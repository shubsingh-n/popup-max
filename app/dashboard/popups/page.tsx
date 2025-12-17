'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Site {
  _id: string;
  name: string;
  siteId: string;
}

interface Popup {
  _id: string;
  siteId: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export default function PopupsPage() {
  const searchParams = useSearchParams();
  const siteIdParam = searchParams.get('siteId');
  
  const [sites, setSites] = useState<Site[]>([]);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState(siteIdParam || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      fetchPopups(selectedSiteId);
    } else {
      fetchAllPopups();
    }
  }, [selectedSiteId]);

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/sites');
      const data = await res.json();
      if (data.success) {
        setSites(data.data);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const fetchPopups = async (siteId: string) => {
    try {
      const res = await fetch(`/api/popups/site/${siteId}`);
      const data = await res.json();
      if (data.success) {
        setPopups(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching popups:', error);
      setLoading(false);
    }
  };

  const fetchAllPopups = async () => {
    try {
      const res = await fetch('/api/popups');
      const data = await res.json();
      if (data.success) {
        setPopups(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching popups:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this popup?')) return;

    try {
      const res = await fetch(`/api/popups/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (selectedSiteId) {
          fetchPopups(selectedSiteId);
        } else {
          fetchAllPopups();
        }
      } else {
        alert(data.error || 'Failed to delete popup');
      }
    } catch (error) {
      console.error('Error deleting popup:', error);
      alert('Failed to delete popup');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Popups</h1>
        <Link
          href={`/dashboard/popups/new${selectedSiteId ? `?siteId=${selectedSiteId}` : ''}`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create Popup
        </Link>
      </div>

      {/* Site Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Site
        </label>
        <select
          value={selectedSiteId}
          onChange={(e) => setSelectedSiteId(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sites</option>
          {sites.map((site) => (
            <option key={site._id} value={site.siteId}>
              {site.name}
            </option>
          ))}
        </select>
      </div>

      {/* Popups List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {popups.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No popups yet. Create your first popup to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {popups.map((popup) => {
                const site = sites.find((s) => s.siteId === popup.siteId);
                return (
                  <tr key={popup._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {popup.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {site?.name || popup.siteId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          popup.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {popup.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/dashboard/popups/${popup._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(popup._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

