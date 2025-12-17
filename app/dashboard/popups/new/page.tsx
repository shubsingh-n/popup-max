'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PopupPreview from '@/components/PopupPreview';
import PopupBuilderForm from '@/components/PopupBuilderForm';

interface Site {
  _id: string;
  name: string;
  siteId: string;
}

export default function NewPopupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const siteIdParam = searchParams.get('siteId');

  const [sites, setSites] = useState<Site[]>([]);
  const [formData, setFormData] = useState({
    siteId: siteIdParam || '',
    title: '',
    description: '',
    ctaText: 'Subscribe',
    styles: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      buttonColor: '#007bff',
    },
    triggers: {
      timeDelay: null as number | null,
      exitIntent: false,
    },
    isActive: true,
  });

  useEffect(() => {
    fetchSites();
  }, []);

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

  const handleSave = async () => {
    try {
      const res = await fetch('/api/popups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/dashboard/popups/${data.data._id}`);
      } else {
        alert(data.error || 'Failed to create popup');
      }
    } catch (error) {
      console.error('Error creating popup:', error);
      alert('Failed to create popup');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Popup</h1>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Popup
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div>
          <PopupBuilderForm
            formData={formData}
            setFormData={setFormData}
            sites={sites}
          />
        </div>

        {/* Preview */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Preview</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <PopupPreview formData={formData} />
          </div>
        </div>
      </div>
    </div>
  );
}

