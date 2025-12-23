'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit, Trash2, Copy, MousePointer2, ExternalLink, FlaskConical, Layers, Plus, Split, GripVertical } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';

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
  testGroupId?: string;
  variantLabel?: string;
  stats?: {
    visitors: number;
    views: number;
    submissions: number;
  };
  createdAt: string;
}

function DraggableRow({ id, children, disabled }: { id: string; children: React.ReactNode; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: { id },
    disabled: disabled
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
    position: isDragging ? 'relative' as any : undefined,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} className="relative group/drag">
      {!disabled && (
        <div
          className="absolute left-1 top-1/2 -translate-y-1/2 -ml-4 opacity-0 group-hover/drag:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 z-10"
          {...listeners}
          {...attributes}
        >
          <GripVertical size={14} className="text-gray-400" />
        </div>
      )}
      {children}
    </div>
  );
}

function DroppableArea({ id, children, type }: { id: string; children: React.ReactNode; type: 'group' | 'popup' }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: { id, type }
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all ${isOver ? 'ring-2 ring-blue-400 ring-offset-2 rounded-lg bg-blue-50/50 scale-[1.01]' : ''}`}
    >
      {children}
    </div>
  );
}

function PopupsContent() {
  const searchParams = useSearchParams();
  const siteIdParam = searchParams.get('siteId');
  const router = useRouter();

  const [sites, setSites] = useState<Site[]>([]);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState(siteIdParam || '');
  const [loading, setLoading] = useState(true);

  // UI States
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
      const res = await fetch(`/api/popups?siteId=${siteId}`);
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
        setPopups(prev => prev.filter(p => p._id !== id));
      } else {
        alert(data.error || 'Failed to delete popup');
      }
    } catch (error) {
      console.error('Error deleting popup:', error);
      alert('Failed to delete popup');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/popups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        setPopups(prev => prev.map(p => p._id === id ? { ...p, isActive: !currentStatus } : p));
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleCreateABTest = async (popup: Popup) => {
    const testGroupId = Math.random().toString(36).substring(2, 11);
    try {
      const res = await fetch(`/api/popups/${popup._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testGroupId, variantLabel: 'A' }),
      });
      if (res.ok) {
        fetchPopups(selectedSiteId);
      }
    } catch (error) {
      console.error('Error creating A/B test:', error);
    }
  };

  const handleAddToGroup = async (popupId: string, testGroupId: string) => {
    const group = popups.filter(p => p.testGroupId === testGroupId);
    const lastLabel = group.length > 0
      ? group.map(p => p.variantLabel || 'A').sort().pop() || 'A'
      : '@';
    const nextLabel = String.fromCharCode(lastLabel.charCodeAt(0) + 1);

    try {
      const res = await fetch(`/api/popups/${popupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testGroupId, variantLabel: nextLabel }),
      });
      if (res.ok) fetchPopups(selectedSiteId);
    } catch (error) { console.error(error); }
  };

  const groupPopups = async (ids: string[], testGroupId: string) => {
    try {
      await Promise.all(ids.map((id, idx) =>
        fetch(`/api/popups/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testGroupId, variantLabel: String.fromCharCode(65 + idx) }),
        })
      ));
      fetchPopups(selectedSiteId);
    } catch (error) { console.error(error); }
  };

  const handleRemoveFromGroup = async (popupId: string) => {
    try {
      const res = await fetch(`/api/popups/${popupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testGroupId: null, variantLabel: null }),
      });
      if (res.ok) fetchPopups(selectedSiteId);
    } catch (error) { console.error(error); }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const overType = over.data.current?.type;

    if (activeId === overId) return;

    if (overType === 'popup') {
      const overPopup = popups.find(p => p._id === overId);
      if (overPopup && !overPopup.testGroupId) {
        const testGroupId = Math.random().toString(36).substring(2, 11);
        groupPopups([overId, activeId], testGroupId);
      }
    } else if (overType === 'group') {
      handleAddToGroup(activeId, overId);
    } else if (overId === 'main-list') {
      const activePopup = popups.find(p => p._id === activeId);
      if (activePopup?.testGroupId) {
        handleRemoveFromGroup(activeId);
      }
    }
  };

  const handleRename = async (id: string) => {
    if (!tempTitle.trim()) return;
    try {
      const res = await fetch(`/api/popups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: tempTitle }),
      });
      if (res.ok) {
        setPopups(prev => prev.map(p => p._id === id ? { ...p, title: tempTitle } : p));
        setEditingTitleId(null);
      }
    } catch (error) { console.error(error); }
  };

  const startRename = (popup: Popup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitleId(popup._id);
    setTempTitle(popup.title);
  };

  const copyEmbedLink = (popup: Popup, e: React.MouseEvent) => {
    e.stopPropagation();
    const code = `<script src="${window.location.origin}/popup.js" data-site-id="${popup.siteId}"></script>`;
    navigator.clipboard.writeText(code);
    alert('Embed code copied to clipboard!');
  };

  const renderPopupRow = (popup: Popup, isInsideGroup = false) => {
    return (
      <div key={popup._id} className={`flex items-center hover:bg-gray-50 transition-colors ${isInsideGroup ? 'bg-white rounded border border-blue-50/50' : ''}`}>
        <div className="px-6 py-4 w-1/4 text-sm font-medium text-gray-900">
          <div className="flex items-center gap-2">
            {isInsideGroup && (
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                {popup.variantLabel || 'A'}
              </span>
            )}
            {editingTitleId === popup._id ? (
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={e => setTempTitle(e.target.value)}
                  className="border rounded px-2 py-1 text-sm w-32"
                  autoFocus
                />
                <button onClick={() => handleRename(popup._id)} className="text-green-600 text-xs">Save</button>
                <button onClick={() => setEditingTitleId(null)} className="text-gray-500 text-xs">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group max-w-full overflow-hidden">
                <span className="truncate" title={popup.title}>{popup.title}</span>
                <button onClick={(e) => startRename(popup, e)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600">
                  <Edit size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 w-40">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => handleToggleStatus(popup._id, popup.isActive, e)}
              className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${popup.isActive ? 'bg-green-600' : 'bg-gray-200'}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${popup.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Analytics */}
        <div className="px-6 py-4 flex-1 text-center font-bold text-gray-700">
          {popup.stats?.visitors || 0}
        </div>
        <div className="px-6 py-4 flex-1 text-center font-bold text-blue-600">
          {popup.stats?.views || 0}
        </div>
        <div className="px-6 py-4 flex-1 text-center font-bold text-green-600">
          {popup.stats?.submissions || 0}
        </div>

        <div className="px-6 py-4 text-right w-40 font-medium">
          <div className="flex items-center justify-end gap-2 text-gray-400">
            {!isInsideGroup && !popup.testGroupId && (
              <button onClick={() => handleCreateABTest(popup)} className="hover:text-purple-600 p-1" title="Create A/B Test">
                <Split size={18} />
              </button>
            )}
            <button onClick={(e) => copyEmbedLink(popup, e)} className="hover:text-blue-600 p-1" title="Copy Embed Code">
              <Copy size={18} />
            </button>
            <Link href={`/dashboard/popups/${popup._id}`} className="hover:text-blue-600 p-1" title="Edit Design">
              <Edit size={18} />
            </Link>
            <Link href={`/dashboard/popups/${popup._id}/triggers`} className="hover:text-purple-600 p-1" title="Edit Triggers">
              <MousePointer2 size={18} />
            </Link>
            <button onClick={() => handleDelete(popup._id)} className="hover:text-red-600 p-1" title="Delete Popup">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Popups</h1>
        <Link
          href={`/dashboard/popups/new${selectedSiteId ? `?siteId=${selectedSiteId}` : ''}`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span className="text-xl">+</span> Create Popup
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        {popups.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No popups found. Create one to get started!</div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="min-w-full">
              <div className="bg-gray-50 border-b flex text-xs font-medium text-gray-500 uppercase tracking-wider select-none">
                <div className="px-6 py-3 w-1/4">Title</div>
                <div className="px-6 py-3 w-40">Status</div>
                <div className="px-6 py-3 flex-1 text-center">Visitors</div>
                <div className="px-6 py-3 flex-1 text-center">Triggered</div>
                <div className="px-6 py-3 flex-1 text-center">Submitted</div>
                <div className="px-6 py-3 text-right w-40">Actions</div>
              </div>

              <DroppableArea id="main-list" type="popup">
                <div className="divide-y divide-gray-200 min-h-[50px]">
                  {(() => {
                    const renderedGroups = new Set();
                    return popups.map((popup) => {
                      if (popup.testGroupId) {
                        if (renderedGroups.has(popup.testGroupId)) return null;
                        renderedGroups.add(popup.testGroupId);
                        const variants = popups.filter(p => p.testGroupId === popup.testGroupId)
                          .sort((a, b) => (a.variantLabel || '').localeCompare(b.variantLabel || ''));

                        return (
                          <DroppableArea key={popup.testGroupId} id={popup.testGroupId} type="group">
                            <div className="p-4 bg-blue-50/20 border-l-4 border-blue-500 my-2 shadow-sm rounded-r-lg mx-2">
                              <div className="flex items-center gap-2 mb-3 px-2">
                                <FlaskConical size={16} className="text-blue-600" />
                                <h3 className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">A/B Test Group</h3>
                                <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">{variants.length} VARIANTS</span>
                              </div>
                              <div className="space-y-1.5">
                                {variants.map(v => (
                                  <DraggableRow key={v._id} id={v._id}>{renderPopupRow(v, true)}</DraggableRow>
                                ))}
                              </div>
                            </div>
                          </DroppableArea>
                        );
                      }
                      return (
                        <DroppableArea key={popup._id} id={popup._id} type="popup">
                          <DraggableRow id={popup._id}>{renderPopupRow(popup)}</DraggableRow>
                        </DroppableArea>
                      );
                    });
                  })()}
                </div>
              </DroppableArea>
            </div>
            <DragOverlay>
              <div className="bg-white border-2 border-blue-500 p-4 shadow-2xl rounded-lg w-72 opacity-90 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">?</div>
                <div className="text-sm font-bold text-gray-800">Moving Popup...</div>
              </div>
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}

export default function PopupsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <PopupsContent />
    </Suspense>
  );
}
