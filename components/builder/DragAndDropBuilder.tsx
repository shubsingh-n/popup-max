'use client';

import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { nanoid } from 'nanoid';
import { PopupComponent, PopupSettings, ComponentType } from '@/types/builder';
import Toolbox from './Toolbox';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import ComponentRenderer from './ComponentRenderer';

const defaultSettings: PopupSettings = {
    width: '500px',
    height: 'auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '2rem',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    closeButtonColor: '#000000',
};

interface DragAndDropBuilderProps {
    initialComponents?: PopupComponent[];
    initialSettings?: Partial<PopupSettings>;
    onSave: (components: PopupComponent[], settings: PopupSettings, title: string) => void;
    isSaving: boolean;
    siteId: string;
    popupId?: string;
    initialTitle?: string;
}

export default function DragAndDropBuilder({
    initialComponents = [],
    initialSettings = {},
    onSave,
    isSaving,
    siteId,
    popupId,
    initialTitle,
}: DragAndDropBuilderProps) {
    const [components, setComponents] = useState<PopupComponent[]>(initialComponents);
    const [settings, setSettings] = useState<PopupSettings>({
        ...defaultSettings,
        ...initialSettings,
    });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeDragItem, setActiveDragItem] = useState<any>(null);
    const [activePage, setActivePage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Title Management
    const [title, setTitle] = useState(initialTitle || 'New Popup');
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    // Warn on exit
    React.useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const handleEditTriggers = () => {
        if (hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Click OK to proceed (changes will be discarded) or Cancel to stay and Save.')) {
                return;
            }
        }
        window.location.href = `/dashboard/popups/${popupId}/triggers`;
    };

    const handleSave = () => {
        onSave(components, settings, title);
        setHasUnsavedChanges(false);
    };

    // Initialize pages if components exist or thankYouPageIndex is set
    React.useEffect(() => {
        const componentMaxPage = components.length > 0
            ? Math.max(...components.map(c => c.pageIndex || 0), 0)
            : 0;
        const settingsThankYouMax = settings.thankYouPageIndex ?? 0;
        const initialMax = Math.max(componentMaxPage, settingsThankYouMax, initialComponents.length > 0 ? Math.max(...initialComponents.map(c => c.pageIndex || 0), 0) : 0);

        setTotalPages(prev => Math.max(prev, initialMax + 1));
    }, [initialComponents]); // Only on mount/initial load 

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
    };

    const handleAddPage = () => {
        const newIndex = totalPages;
        setTotalPages(prev => prev + 1);
        setActivePage(newIndex);
        setHasUnsavedChanges(true);
    };

    const handleAddThankYouPage = () => {
        const newIndex = totalPages;
        setTotalPages(next => next + 1);
        setActivePage(newIndex);
        handleUpdateSettings({ thankYouPageIndex: newIndex });
        setHasUnsavedChanges(true);
    };

    const handleSwitchPage = (index: number) => {
        setActivePage(index);
        setSelectedId(null);
    };

    const handleDeletePage = (index: number) => {
        if (totalPages <= 1) return;

        // Remove components on this page
        if (confirm('Are you sure? All components on this page will be deleted.')) {
            setComponents(prev => prev.filter(c => (c.pageIndex || 0) !== index));
            // Shift components on higher pages down? Or just keep indices as is?
            // Simpler: Just keep indices. If gap, fine.
            // But UI expects 0..N. Let's shift.
            setComponents(prev => prev.map(c => {
                if ((c.pageIndex || 0) > index) return { ...c, pageIndex: (c.pageIndex || 0) - 1 };
                return c;
            }).filter(c => (c.pageIndex || 0) !== index)); // Filter again just in case

            // Update thankYouPageIndex if it shifts
            if (settings.thankYouPageIndex !== undefined) {
                if (settings.thankYouPageIndex === index) {
                    handleUpdateSettings({ thankYouPageIndex: undefined });
                } else if (settings.thankYouPageIndex > index) {
                    handleUpdateSettings({ thankYouPageIndex: settings.thankYouPageIndex - 1 });
                }
            }

            setTotalPages(prev => Math.max(1, prev - 1));
            setActivePage(prev => Math.max(0, prev - 1));
            setHasUnsavedChanges(true);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const isTool = active.data.current?.isTool;

        if (isTool) {
            setActiveDragItem({ type: active.data.current?.type, isTool: true });
        } else {
            const component = components.find((c) => c.id === active.id);
            setActiveDragItem({ component, isTool: false });
            setSelectedId(active.id as string);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        // Handle new tool drop
        if (active.data.current?.isTool) {
            if (over.id === 'canvas' || components.some(c => c.id === over.id)) {
                const type = active.data.current?.type as ComponentType;
                const newComponent: PopupComponent = {
                    id: nanoid(),
                    type,
                    label: type,
                    pageIndex: activePage, // Assign to current page
                    content: getDefaultContent(type),
                    style: getDefaultStyle(type),
                };

                setComponents((prev) => [...prev, newComponent]);
                setSelectedId(newComponent.id);
            }
            return;
        }

        // Handle sorting
        if (active.id !== over.id) {
            setComponents((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleUpdateComponent = (id: string, updates: Partial<PopupComponent>) => {
        setComponents((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );
        setHasUnsavedChanges(true);
    };

    const handleUpdateSettings = (updates: Partial<PopupSettings>) => {
        setSettings((prev) => ({ ...prev, ...updates }));
        setHasUnsavedChanges(true);
    };

    const handleDeleteComponent = (id: string) => {
        setComponents((prev) => prev.filter((c) => c.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const selectedComponent = selectedId ? components.find((c) => c.id === selectedId) || null : null;

    // Filter components for current page
    const pageComponents = components.filter(c => (c.pageIndex || 0) === activePage);

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {isEditingTitle ? (
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            autoFocus
                            className="text-lg font-semibold text-gray-800 border-b border-blue-500 outline-none px-1"
                        />
                    ) : (
                        <h2
                            className="text-lg font-semibold text-gray-800 flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded group"
                            onClick={() => setIsEditingTitle(true)}
                            title="Click to rename"
                        >
                            {title}
                            <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                            </span>
                        </h2>
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleEditTriggers}
                        className="text-gray-600 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                        disabled={!popupId || popupId === 'new'}
                        title={!popupId || popupId === 'new' ? 'Save popup first' : 'Edit Triggers'}
                    >
                        <span>⚡</span> Edit Triggers
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${hasUnsavedChanges ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                        {isSaving ? 'Saving...' : (hasUnsavedChanges ? 'Save Changes' : 'Saved')}
                    </button>
                </div>
            </div>

            {/* Page Manager Bar */}
            <div className="bg-gray-50 border-b px-4 py-2 flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-semibold text-gray-500 uppercase mr-2">Pages:</span>
                {Array.from({ length: totalPages }).map((_, idx) => {
                    const isThankYou = settings.thankYouPageIndex === idx;
                    return (
                        <div key={idx} className="flex items-center">
                            <button
                                onClick={() => handleSwitchPage(idx)}
                                className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${activePage === idx ? 'bg-white shadow text-blue-600 font-medium ring-1 ring-blue-100' : 'text-gray-600 hover:bg-white/50'}`}
                            >
                                {isThankYou ? (
                                    <span className="flex items-center gap-1.5">
                                        <span className="text-sm">🎉</span>
                                        <span className="font-bold">Thank You Screen</span>
                                    </span>
                                ) : (
                                    `Step ${idx + 1}`
                                )}
                            </button>
                            {/* Only allow deleting if it's the last page and not the first/only one */}
                            {idx === totalPages - 1 && totalPages > 1 && (
                                <button
                                    onClick={() => {
                                        if (isThankYou) handleUpdateSettings({ thankYouPageIndex: undefined });
                                        handleDeletePage(idx);
                                    }}
                                    className="ml-1 text-gray-400 hover:text-red-500 px-1"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    );
                })}
                <button
                    onClick={handleAddPage}
                    className="ml-2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors"
                    title="Add Step"
                >
                    +
                </button>
                {!settings.thankYouPageIndex && (
                    <button
                        onClick={handleAddThankYouPage}
                        className="ml-2 px-3 py-1 rounded-full border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 text-xs flex items-center gap-1 transition-colors"
                        title="Add Thank You Page"
                    >
                        <span>+</span> Add Thank You Screen
                    </button>
                )}
            </div>

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-1 overflow-hidden">
                    <Toolbox />

                    <Canvas
                        components={pageComponents} // Only pass visible page components
                        settings={settings}
                        selectedId={selectedId}
                        onSelect={(id) => setSelectedId(id === 'settings' ? null : id)} // 'settings' means deselect component
                        onUpdateComponent={handleUpdateComponent}
                    />

                    <PropertiesPanel
                        selectedComponent={selectedComponent}
                        settings={settings}
                        onUpdateComponent={handleUpdateComponent}
                        onUpdateSettings={handleUpdateSettings}
                        onDeleteComponent={handleDeleteComponent}
                    />
                </div>

                <DragOverlay>
                    {activeDragItem?.isTool ? (
                        <div className="p-3 bg-white border rounded shadow opacity-80 w-48">
                            Moving {activeDragItem.type}
                        </div>
                    ) : activeDragItem?.component ? (
                        <div className="opacity-80">
                            <ComponentRenderer component={activeDragItem.component} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

// Helpers
function getDefaultContent(type: ComponentType): any {
    switch (type) {
        case 'title': return { text: 'Big Catchy Headline' };
        case 'description': return { text: 'Explain your offer clearly here.' };
        case 'button': return { text: 'Sign Up Now' };
        case 'image': return { src: '' };
        case 'timer': return { targetDate: new Date(Date.now() + 86400000).toISOString() }; // 24h from now
        case 'marquee': return { text: 'Special Offer • Limited Time • Sale Ends Soon', speed: 10, direction: 'left' };
        default: return {}; // email/phone/text inputs have defaults in renderer
    }
}

function getDefaultStyle(type: ComponentType): any {
    const base = {
        marginBottom: '1rem',
    };

    if (type === 'title') return { ...base, fontSize: '2rem', fontWeight: 'bold', textAlign: 'center' };
    if (type === 'description') return { ...base, fontSize: '1rem', textAlign: 'center', color: '#666' };
    if (type === 'button') return { ...base, width: '100%', padding: '0.75rem', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', textAlign: 'center' };
    if (type === 'marquee') return { ...base, backgroundColor: '#f0f0f0', color: '#333', padding: '10px', fontSize: '14px' };

    return base;
}
