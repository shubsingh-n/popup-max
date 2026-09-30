'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DragAndDropBuilder from '@/components/builder/DragAndDropBuilder';
import CustomWidgetBuilder from '@/components/builder/CustomWidgetBuilder';
import { PopupComponent, PopupSettings } from '@/types/builder';

function PopupBuilderContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const popupId = params.id as string;
  const isNew = popupId === 'new';

  const [loading, setLoading] = useState(true);
  const [siteId, setSiteId] = useState<string>('');

  // State for builder
  const [initialComponents, setInitialComponents] = useState<PopupComponent[]>([]);
  const [initialSettings, setInitialSettings] = useState<Partial<PopupSettings>>({});
  const [initialTitle, setInitialTitle] = useState('My Popup');
  const [isSaving, setIsSaving] = useState(false);
  const [popupType, setPopupType] = useState<'popup' | 'custom'>('popup');
  const [initialCustomCode, setInitialCustomCode] = useState<{ html?: string; css?: string; js?: string }>({});

  useEffect(() => {
    if (isNew) {
      const sid = searchParams.get('siteId');
      const ptype = searchParams.get('type');
      if (ptype === 'custom') setPopupType('custom');
      
      if (sid) {
        setSiteId(sid);
        setInitialTitle(ptype === 'custom' ? 'New Custom Widget' : 'New Popup');
        setLoading(false);
      } else {
        // Fetch sites and use the first one as default
        fetch('/api/sites')
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data.length > 0) {
              setSiteId(data.data[0].siteId);
            }
            setInitialTitle(ptype === 'custom' ? 'New Custom Widget' : 'New Popup');
            setLoading(false);
          })
          .catch(err => {
            console.error('Error fetching sites:', err);
            setInitialTitle(ptype === 'custom' ? 'New Custom Widget' : 'New Popup');
            setLoading(false);
          });
      }
    } else {
      fetchPopup();
    }
  }, [popupId, isNew, searchParams]);

  const fetchPopup = async () => {
    try {
      const res = await fetch(`/api/popups/${popupId}`);
      const data = await res.json();
      if (data.success) {
        setSiteId(data.data.siteId);

        if (data.data.components && data.data.components.length > 0) {
          setInitialComponents(data.data.components);
        }

        if (data.data.settings) {
          setInitialSettings(data.data.settings);
        }

        if (data.data.title) {
          setInitialTitle(data.data.title);
        }

        if (data.data.type) {
          setPopupType(data.data.type);
        }

        if (data.data.customCode) {
          setInitialCustomCode(data.data.customCode);
        }
      }
    } catch (error) {
      console.error('Error fetching popup:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (
    title: string,
    components: PopupComponent[] = [],
    settings: any = {},
    customCode: any = {}
  ) => {
    setIsSaving(true);
    try {
      const url = isNew ? '/api/popups' : `/api/popups/${popupId}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        siteId,
        components,
        settings,
        title,
        type: popupType,
        customCode,
        // Legacy fallback
        description: 'Created with new builder',
        ctaText: 'Submit',
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        // Redirect to popups list as requested
        router.push('/dashboard/popups');
      } else {
        alert(data.error || 'Failed to save popup');
      }
    } catch (error) {
      console.error('Error saving popup:', error);
      alert('Failed to save popup');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading editor...</div>;
  }

  return (
    <div className="h-full bg-gray-50">
      {popupType === 'custom' ? (
        <CustomWidgetBuilder
          siteId={siteId}
          popupId={isNew ? undefined : popupId}
          initialCode={initialCustomCode}
          initialTitle={initialTitle}
          onSave={(title, code) => handleSave(title, [], {}, code)}
          isSaving={isSaving}
        />
      ) : (
        <DragAndDropBuilder
          siteId={siteId}
          popupId={isNew ? undefined : popupId}
          initialComponents={initialComponents}
          initialSettings={initialSettings as PopupSettings}
          initialTitle={initialTitle}
          onSave={(comps, sets, t) => handleSave(t, comps, sets, {})}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

export default function PopupBuilderPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <PopupBuilderContent />
    </Suspense>
  );
}

