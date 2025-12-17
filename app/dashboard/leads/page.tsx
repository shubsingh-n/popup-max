'use client';

import { useEffect, useState } from 'react';

interface Lead {
  _id: string;
  siteId: string;
  popupId: string;
  email: string;
  createdAt: string;
}

interface Site {
  _id: string;
  name: string;
  siteId: string;
}

interface Popup {
  _id: string;
  title: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSiteId, setFilterSiteId] = useState('');
  const [filterPopupId, setFilterPopupId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (filterSiteId || filterPopupId) {
      fetchLeads();
    } else {
      fetchLeads();
    }
  }, [filterSiteId, filterPopupId]);

  const fetchData = async () => {
    try {
      const [leadsRes, sitesRes, popupsRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/sites'),
        fetch('/api/popups'),
      ]);

      const leadsData = await leadsRes.json();
      const sitesData = await sitesRes.json();
      const popupsData = await popupsRes.json();

      if (leadsData.success) setLeads(leadsData.data);
      if (sitesData.success) setSites(sitesData.data);
      if (popupsData.success) setPopups(popupsData.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (filterSiteId) params.append('siteId', filterSiteId);
      if (filterPopupId) params.append('popupId', filterPopupId);

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Site', 'Popup', 'Date'];
    const rows = leads.map((lead) => {
      const site = sites.find((s) => s.siteId === lead.siteId);
      const popup = popups.find((p) => p._id === lead.popupId);
      return [
        lead.email,
        site?.name || lead.siteId,
        popup?.title || lead.popupId,
        new Date(lead.createdAt).toLocaleString(),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
        <button
          onClick={exportToCSV}
          disabled={leads.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Site
          </label>
          <select
            value={filterSiteId}
            onChange={(e) => {
              setFilterSiteId(e.target.value);
              setFilterPopupId(''); // Reset popup filter when site changes
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sites</option>
            {sites.map((site) => (
              <option key={site._id} value={site.siteId}>
                {site.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Popup
          </label>
          <select
            value={filterPopupId}
            onChange={(e) => setFilterPopupId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!filterSiteId}
          >
            <option value="">All Popups</option>
            {popups
              .filter((p) => !filterSiteId || true) // Simplified - in real app, filter by siteId
              .map((popup) => (
                <option key={popup._id} value={popup._id}>
                  {popup.title}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {leads.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No leads yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Popup
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => {
                  const site = sites.find((s) => s.siteId === lead.siteId);
                  const popup = popups.find((p) => p._id === lead.popupId);
                  return (
                    <tr key={lead._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lead.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {site?.name || lead.siteId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {popup?.title || lead.popupId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total: {leads.length} lead{leads.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

