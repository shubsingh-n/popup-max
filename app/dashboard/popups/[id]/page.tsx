'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PopupPreview from '@/components/PopupPreview';
import PopupBuilderForm from '@/components/PopupBuilderForm';

interface Popup {
  _id: string;
  siteId: string;
  title: string;
  description: string;
  ctaText: string;
  styles: {
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
  };
  triggers: {
    timeDelay?: number | null;
    exitIntent: boolean;
  };
  isActive: boolean;
}

interface Site {
  _id: string;
  name: string;
  siteId: string;
}

export default function PopupBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const popupId = params.id as string;
  const isNew = popupId === 'new';

  const [popup, setPopup] = useState<Popup | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [formData, setFormData] = useState({
    siteId: '',
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
    if (!isNew) {
      fetchPopup();
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      const siteId = searchParams.get('siteId');
      if (siteId) {
        setFormData((prev) => ({ ...prev, siteId }));
      }
      setLoading(false);
    }
  }, [popupId, isNew]);

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

  const fetchPopup = async () => {
    try {
      const res = await fetch(`/api/popups/${popupId}`);
      const data = await res.json();
      if (data.success) {
        setPopup(data.data);
        setFormData({
          siteId: data.data.siteId,
          title: data.data.title,
          description: data.data.description,
          ctaText: data.data.ctaText,
          styles: data.data.styles,
          triggers: data.data.triggers,
          isActive: data.data.isActive,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching popup:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const url = isNew ? '/api/popups' : `/api/popups/${popupId}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        if (isNew) {
          router.push(`/dashboard/popups/${data.data._id}`);
        } else {
          setPopup(data.data);
          alert('Popup saved successfully!');
        }
      } else {
        alert(data.error || 'Failed to save popup');
      }
    } catch (error) {
      console.error('Error saving popup:', error);
      alert('Failed to save popup');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isNew ? 'Create Popup' : 'Edit Popup'}
        </h1>
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

          {/* Embed Code */}
          {!isNew && popup && (
            <div className="mt-6 bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Embed Code</h3>
              <p className="text-sm text-gray-600 mb-3">
                Copy this code and paste it before the closing &lt;/body&gt; tag on your website:
              </p>
              <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
                <code>
                  {`<script
  src="${typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/popup.js"
  data-site-id="${formData.siteId}"
></script>`}
                </code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

