'use client';

import React from 'react';
import { PopupComponent, PopupSettings } from '@/types/builder';

interface PropertiesPanelProps {
    selectedComponent: PopupComponent | null;
    settings: PopupSettings;
    onUpdateComponent: (id: string, updates: Partial<PopupComponent>) => void;
    onUpdateSettings: (updates: Partial<PopupSettings>) => void;
    onDeleteComponent: (id: string) => void;
}

export default function PropertiesPanel({
    selectedComponent,
    settings,
    onUpdateComponent,
    onUpdateSettings,
    onDeleteComponent
}: PropertiesPanelProps) {

    if (!selectedComponent) {
        // Show global settings
        return (
            <div className="w-80 bg-white border-l h-full p-6 overflow-y-auto">
                <h3 className="font-semibold text-gray-900 mb-6">Popup Settings</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                        <input
                            type="text"
                            value={settings.width}
                            onChange={(e) => onUpdateSettings({ width: e.target.value })}
                            className="w-full border rounded px-3 py-2 text-sm"
                            placeholder="e.g. 500px"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                        <input
                            type="text"
                            value={settings.height}
                            onChange={(e) => onUpdateSettings({ height: e.target.value })}
                            className="w-full border rounded px-3 py-2 text-sm"
                            placeholder="e.g. auto, 400px"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={settings.backgroundColor}
                                onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
                                className="h-9 w-9 p-0 border rounded"
                            />
                            <input
                                type="text"
                                value={settings.backgroundColor}
                                onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })}
                                className="flex-1 border rounded px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
                        <input
                            type="text"
                            value={settings.borderRadius}
                            onChange={(e) => onUpdateSettings({ borderRadius: e.target.value })}
                            className="w-full border rounded px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Padding</label>
                        <input
                            type="text"
                            value={settings.padding}
                            onChange={(e) => onUpdateSettings({ padding: e.target.value })}
                            className="w-full border rounded px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
                        <input
                            type="text"
                            value={settings.backgroundImage || ''}
                            onChange={(e) => onUpdateSettings({ backgroundImage: e.target.value })}
                            className="w-full border rounded px-3 py-2 text-sm"
                            placeholder="https://..."
                        />
                    </div>

                    {/* Close Design Settings (New) */}
                    <div className="border-t pt-4 space-y-4">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Close Design</h4>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="chk-show-close"
                                checked={settings.closeButton?.show !== false} // Default true
                                onChange={(e) => onUpdateSettings({
                                    closeButton: { ...settings.closeButton, show: e.target.checked } as any
                                })}
                            />
                            <label htmlFor="chk-show-close" className="text-sm text-gray-700 select-none">Show Close Button</label>
                        </div>

                        {(settings.closeButton?.show !== false) && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                    <select
                                        value={settings.closeButton?.position || 'top-right'}
                                        onChange={(e) => onUpdateSettings({
                                            closeButton: { ...settings.closeButton, position: e.target.value } as any
                                        })}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                    >
                                        <option value="top-right">Top Right</option>
                                        <option value="top-left">Top Left</option>
                                        <option value="bottom-right">Bottom Right</option>
                                        <option value="bottom-left">Bottom Left</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Buton Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={settings.closeButton?.color || '#000000'}
                                            onChange={(e) => onUpdateSettings({
                                                closeButton: { ...settings.closeButton, color: e.target.value } as any
                                            })}
                                            className="h-9 w-9 p-0 border rounded"
                                        />
                                        <input
                                            type="text"
                                            value={settings.closeButton?.color || '#000000'}
                                            onChange={(e) => onUpdateSettings({
                                                closeButton: { ...settings.closeButton, color: e.target.value } as any
                                            })}
                                            className="flex-1 border rounded px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t">
                            <input
                                type="checkbox"
                                id="chk-overlay-close"
                                checked={settings.closeOnOverlayClick !== false} // Default true
                                onChange={(e) => onUpdateSettings({ closeOnOverlayClick: e.target.checked })}
                            />
                            <label htmlFor="chk-overlay-close" className="text-sm text-gray-700 select-none">Close on Overlay Click</label>
                        </div>
                    </div>

                    {/* Over-state (Teaser) Design Settings (New Phase 5) */}
                    <div className="border-t pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Over-state (Teaser)</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 font-medium">ENABLE</span>
                                <input
                                    type="checkbox"
                                    checked={settings.overState?.enabled || false}
                                    onChange={(e) => onUpdateSettings({
                                        overState: { ...settings.overState, enabled: e.target.checked } as any
                                    })}
                                    className="toggle-checkbox"
                                />
                            </div>
                        </div>

                        {settings.overState?.enabled && (
                            <div className="space-y-4 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teaser Text</label>
                                    <input
                                        type="text"
                                        value={settings.overState?.text || 'Open Offer'}
                                        onChange={(e) => onUpdateSettings({
                                            overState: { ...settings.overState, text: e.target.value } as any
                                        })}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">BG Color</label>
                                        <div className="flex gap-1">
                                            <input
                                                type="color"
                                                value={settings.overState?.style?.backgroundColor || '#007bff'}
                                                onChange={(e) => onUpdateSettings({
                                                    overState: {
                                                        ...settings.overState,
                                                        style: { ...settings.overState?.style, backgroundColor: e.target.value }
                                                    } as any
                                                })}
                                                className="h-8 w-8 p-0 border rounded"
                                            />
                                            <input
                                                type="text"
                                                value={settings.overState?.style?.backgroundColor || '#007bff'}
                                                onChange={(e) => onUpdateSettings({
                                                    overState: {
                                                        ...settings.overState,
                                                        style: { ...settings.overState?.style, backgroundColor: e.target.value }
                                                    } as any
                                                })}
                                                className="w-full border rounded px-1 py-1 text-[10px]"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                                        <div className="flex gap-1">
                                            <input
                                                type="color"
                                                value={settings.overState?.style?.color || '#ffffff'}
                                                onChange={(e) => onUpdateSettings({
                                                    overState: {
                                                        ...settings.overState,
                                                        style: { ...settings.overState?.style, color: e.target.value }
                                                    } as any
                                                })}
                                                className="h-8 w-8 p-0 border rounded"
                                            />
                                            <input
                                                type="text"
                                                value={settings.overState?.style?.color || '#ffffff'}
                                                onChange={(e) => onUpdateSettings({
                                                    overState: {
                                                        ...settings.overState,
                                                        style: { ...settings.overState?.style, color: e.target.value }
                                                    } as any
                                                })}
                                                className="w-full border rounded px-1 py-1 text-[10px]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
                                        <input
                                            type="text"
                                            value={settings.overState?.style?.borderRadius || '20px'}
                                            onChange={(e) => onUpdateSettings({
                                                overState: {
                                                    ...settings.overState,
                                                    style: { ...settings.overState?.style, borderRadius: e.target.value }
                                                } as any
                                            })}
                                            className="w-full border rounded px-3 py-1 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Padding</label>
                                        <input
                                            type="text"
                                            value={settings.overState?.style?.padding || '8px 16px'}
                                            onChange={(e) => onUpdateSettings({
                                                overState: {
                                                    ...settings.overState,
                                                    style: { ...settings.overState?.style, padding: e.target.value }
                                                } as any
                                            })}
                                            className="w-full border rounded px-3 py-1 text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="chk-teaser-close"
                                        checked={settings.overState?.showClose !== false}
                                        onChange={(e) => onUpdateSettings({
                                            overState: { ...settings.overState, showClose: e.target.checked } as any
                                        })}
                                    />
                                    <label htmlFor="chk-teaser-close" className="text-sm text-gray-700 select-none">Show Close Cross</label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Show component specific settings
    const { type, content = {}, style = {} } = selectedComponent;

    const handleStyleChange = (key: string, value: string) => {
        onUpdateComponent(selectedComponent.id, {
            style: { ...style, [key]: value }
        });
    };

    const handleContentChange = (key: string, value: any) => {
        onUpdateComponent(selectedComponent.id, {
            content: { ...content, [key]: value }
        });
    };

    const handleValidationChange = (key: string, value: any) => {
        onUpdateComponent(selectedComponent.id, {
            content: {
                ...content,
                validation: {
                    ...(content.validation || {}),
                    [key]: value
                }
            }
        });
    };

    return (
        <div className="w-80 bg-white border-l h-full p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-900 capitalize">{type} Properties</h3>
                <button
                    onClick={() => onDeleteComponent(selectedComponent.id)}
                    className="text-red-500 text-sm hover:text-red-700"
                >
                    Delete
                </button>
            </div>

            <div className="space-y-6">
                {/* Content Section */}
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Content</h4>

                    {(type === 'title' || type === 'description' || type === 'button' || type === 'marquee') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                            <input
                                type="text"
                                value={content.text || ''}
                                onChange={(e) => handleContentChange('text', e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    {type === 'button' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Click Action</label>
                                <select
                                    value={content.action || 'submit'}
                                    onChange={(e) => handleContentChange('action', e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                >
                                    <option value="submit">Submit Form</option>
                                    <option value="next">Next Step</option>
                                    <option value="prev">Back (Previous Step)</option>
                                    <option value="close">Close Popup</option>
                                    <option value="link">Go to URL</option>
                                </select>
                            </div>
                            {content.action === 'link' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target URL</label>
                                    <input
                                        type="text"
                                        value={content.actionUrl || ''}
                                        onChange={(e) => handleContentChange('actionUrl', e.target.value)}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        placeholder="https://..."
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {(type === 'email' || type === 'phone' || type === 'shortText' || type === 'longText' || type === 'date') && (
                        <div className="space-y-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Field Label / ID</label>
                                <input
                                    type="text"
                                    value={selectedComponent.label || ''}
                                    onChange={(e) => onUpdateComponent(selectedComponent.id, { label: e.target.value })}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    placeholder="e.g. first_name, your_email"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">This will be the key used in lead data.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="chk-hidden"
                                    checked={content.hidden || false}
                                    onChange={(e) => handleContentChange('hidden', e.target.checked)}
                                />
                                <label htmlFor="chk-hidden" className="text-sm text-gray-700 select-none font-medium">Hide this field</label>
                            </div>
                        </div>
                    )}

                    {(type === 'email' || type === 'phone' || type === 'shortText' || type === 'longText') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                            <input
                                type="text"
                                value={content.placeholder || ''}
                                onChange={(e) => handleContentChange('placeholder', e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    {type === 'image' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                            <input
                                type="text"
                                value={content.src || ''}
                                onChange={(e) => handleContentChange('src', e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm"
                                placeholder="https://..."
                            />
                        </div>
                    )}
                </div>

                {/* Validation Section (New) */}
                {(type === 'email' || type === 'phone' || type === 'shortText' || type === 'longText' || type === 'date') && (
                    <div className="border-t pt-6 space-y-4">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Validation</h4>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="chk-required"
                                checked={content.validation?.required || false}
                                onChange={(e) => handleValidationChange('required', e.target.checked)}
                            />
                            <label htmlFor="chk-required" className="text-sm text-gray-700 select-none">Required Field</label>
                        </div>

                        {(type === 'shortText' || type === 'longText' || type === 'phone') && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Length</label>
                                    <input
                                        type="number"
                                        value={content.validation?.min || ''}
                                        onChange={(e) => handleValidationChange('min', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Length</label>
                                    <input
                                        type="number"
                                        value={content.validation?.max || ''}
                                        onChange={(e) => handleValidationChange('max', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        placeholder="100"
                                    />
                                </div>
                            </div>
                        )}

                        {type === 'phone' && (
                            <p className="text-xs text-gray-500 mt-1">
                                For phone numbers, Min/Max refers to the number of digits.
                            </p>
                        )}
                    </div>
                )}

                {/* Marquee Settings (New) */}
                {type === 'marquee' && (
                    <div className="border-t pt-6 space-y-4">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Marquee Settings</h4>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Speed (seconds)</label>
                            <input
                                type="number"
                                value={content.speed || 10}
                                onChange={(e) => handleContentChange('speed', Number(e.target.value))}
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                            <select
                                value={content.direction || 'left'}
                                onChange={(e) => handleContentChange('direction', e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm"
                            >
                                <option value="left">Left</option>
                                <option value="right">Right</option>
                            </select>
                        </div>
                    </div>
                )}

                <div className="border-t pt-6 space-y-4">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Style</h4>

                    {/* Colors */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={style.color || '#000000'}
                                onChange={(e) => handleStyleChange('color', e.target.value)}
                                className="h-9 w-9 p-0 border rounded"
                            />
                            <input
                                type="text"
                                value={style.color || ''}
                                onChange={(e) => handleStyleChange('color', e.target.value)}
                                className="flex-1 border rounded px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    {(type === 'button' || type === 'marquee' || type === 'email' || type === 'phone' || type === 'shortText' || type === 'longText' || type === 'date') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={style.backgroundColor || (type === 'button' ? '#007bff' : '#ffffff')}
                                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                    className="h-9 w-9 p-0 border rounded"
                                />
                                <input
                                    type="text"
                                    value={style.backgroundColor || ''}
                                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                    className="flex-1 border rounded px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Border Settings (New) */}
                    {(type === 'email' || type === 'phone' || type === 'shortText' || type === 'longText' || type === 'button' || type === 'marquee') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Border Color</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="color"
                                    value={style.borderColor || '#cccccc'}
                                    onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                                    className="h-9 w-9 p-0 border rounded"
                                />
                                <input
                                    type="text"
                                    value={style.borderColor || ''}
                                    onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                                    className="flex-1 border rounded px-3 py-2 text-sm"
                                    placeholder="#ccc"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
                                    <input
                                        type="text"
                                        value={style.borderRadius || ''}
                                        onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        placeholder="4px"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Border Width</label>
                                    <input
                                        type="text"
                                        value={style.borderWidth || ''}
                                        onChange={(e) => handleStyleChange('borderWidth', e.target.value)}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        placeholder="1px"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Typography */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                        <input
                            type="text"
                            value={style.fontSize || ''}
                            onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                            placeholder="e.g. 16px, 1.5rem"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alignment</label>
                        <div className="flex border rounded overflow-hidden">
                            {['left', 'center', 'right'].map((align) => (
                                <button
                                    key={align}
                                    onClick={() => handleStyleChange('textAlign', align)}
                                    className={`flex-1 py-1 text-sm ${style.textAlign === align ? 'bg-gray-100 font-medium' : 'bg-white'}`}
                                >
                                    {align}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Spacing */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Margin Top</label>
                            <input
                                type="text"
                                value={style.marginTop || ''}
                                onChange={(e) => handleStyleChange('marginTop', e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Margin Bottom</label>
                            <input
                                type="text"
                                value={style.marginBottom || ''}
                                onChange={(e) => handleStyleChange('marginBottom', e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
