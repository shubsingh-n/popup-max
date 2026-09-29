'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Globe, FileText, Code, Clock, MousePointer2, User, Layout, ArrowUpRight, MapPin, CalendarClock } from 'lucide-react';

interface TriggerRule {
    matchType: string;
    value: string;
}

interface JsTriggerRule {
    name: string;
    matchType: string;
    value: string;
}

interface TriggersState {
    pageUrl: TriggerRule[];
    pageTitle: TriggerRule[];
    jsVariable: JsTriggerRule[];
    utmParameters: JsTriggerRule[];
    targetDevices: string[];
    targetBrowsers: string[];
    targetCountries: string[];
    timeDelay: number | null;
    scrollPercentage: number | null;
    clickElement: string | null;
    inactivityTime: number | null;
    visitedPage: TriggerRule[];
    // New Fields
    visitorType: 'all' | 'session_unique' | 'persistent_unique' | 'repeater';
    visitorCount: number;
    clickTrigger: string | null;
    autoCloseDelay: number | null;
    exitIntent: boolean;
    schedule?: {
        startTime?: string | null;
        endTime?: string | null;
    };
}

interface SettingsState {
    position: {
        desktop: string;
        mobile: string;
    };
    animation: {
        desktop: string;
        mobile: string;
    };
    overState?: {
        enabled: boolean;
        text: string;
        showClose: boolean;
        style: any;
        triggers: {
            positionDesktop: string;
            positionMobile: string;
            displayMode: 'always' | 'closed_not_filled' | 'after_delay';
            delay?: number;
        };
    };
}

const defaultTriggers: TriggersState = {
    pageUrl: [],
    pageTitle: [],
    jsVariable: [],
    utmParameters: [],
    targetDevices: ['desktop', 'mobile', 'tablet'],
    targetBrowsers: ['chrome', 'firefox', 'safari', 'edge', 'opera'],
    targetCountries: [],
    timeDelay: null,
    scrollPercentage: null,
    clickElement: null,
    inactivityTime: null,
    visitedPage: [],
    visitorType: 'all',
    visitorCount: 0,
    clickTrigger: null,
    autoCloseDelay: null,
    exitIntent: false,
    schedule: {
        startTime: null,
        endTime: null,
    }
};

const defaultSettings: SettingsState = {
    position: { desktop: 'center', mobile: 'center' },
    animation: { desktop: 'fade', mobile: 'fade' },
    overState: {
        enabled: false,
        text: 'Open Offer',
        showClose: true,
        style: {},
        triggers: {
            positionDesktop: 'bottom-left',
            positionMobile: 'bottom-left',
            displayMode: 'always',
            delay: 0
        }
    }
};

export default function TriggerConfigPage() {
    const params = useParams();
    const router = useRouter();
    const popupId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [triggers, setTriggers] = useState<TriggersState>(defaultTriggers);
    const [settings, setSettings] = useState<SettingsState>(defaultSettings);
    const [activeTab, setActiveTab] = useState<'pages' | 'time' | 'advanced' | 'visitor' | 'display' | 'teaser' | 'geo_device' | 'schedule'>('pages');

    useEffect(() => {
        fetchPopup();
    }, [popupId]);

    const fetchPopup = async () => {
        try {
            const res = await fetch(`/api/popups/${popupId}`);
            const data = await res.json();
            if (data.success) {
                // Merge with defaults
                if (data.data.triggers) {
                    setTriggers({ ...defaultTriggers, ...data.data.triggers });
                }
                if (data.data.settings) {
                    // Only update relevant settings, keep existing ones if not provided
                    setSettings(prev => ({
                        ...prev,
                        ...data.data.settings,
                        position: { ...defaultSettings.position, ...data.data.settings.position },
                        animation: { ...defaultSettings.animation, ...data.data.settings.animation }
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching triggers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // We need to fetch the existing settings first to NOT overwrite other settings (like bg color)
            // Or we rely on the API doing a merge. The current API does a full update of provided fields.
            // Since we only have partial settings here in state, we should ideally merge.
            // However, the `settings` state in this component SHOULD ideally contain everything if we wanted to be safe,
            // OR we trust the backend to merge. Mongoose `findByIdAndUpdate` replaces fields. 
            // To be safe, we will pass `triggers` and ONLY the `settings.position` and `settings.animation` fields nested.
            // But Mongoose shallow updates nested objects by default unless using dot notation.
            // Let's assume the backend endpoint handles partial updates or we send the full object.
            // Simplified approach: Send triggers, and Merge settings on CLIENT before sending if possible, 
            // BUT we don't have full settings state here. 
            // Better approach: Let's fetch the latest FULL settings, merge, and save.

            const currentRes = await fetch(`/api/popups/${popupId}`);
            const currentData = await currentRes.json();
            const existingSettings = currentData.data?.settings || {};

            const finalSettings = {
                ...existingSettings,
                position: settings.position,
                animation: settings.animation
            };

            const res = await fetch(`/api/popups/${popupId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ triggers, settings: finalSettings }),
            });

            if (res.ok) {
                router.push('/dashboard/popups');
            } else {
                alert('Failed to save triggers');
            }
        } catch (error) {
            console.error('Error saving triggers:', error);
            alert('Error saving triggers');
        } finally {
            setSaving(false);
        }
    };

    const addRule = (field: keyof TriggersState, newItem: any) => {
        setTriggers(prev => ({
            ...prev,
            [field]: [...(prev[field] as any[]), newItem]
        }));
    };

    const removeRule = (field: keyof TriggersState, index: number) => {
        setTriggers(prev => ({
            ...prev,
            [field]: (prev[field] as any[]).filter((_, i) => i !== index)
        }));
    };

    const updateRule = (field: keyof TriggersState, index: number, key: string, value: string) => {
        setTriggers(prev => ({
            ...prev,
            [field]: (prev[field] as any[]).map((item, i) =>
                i === index ? { ...item, [key]: value } : item
            )
        }));
    };

    if (loading) return <div className="p-8 text-center">Loading triggers...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Trigger Configuration</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Nav */}
                <div className="w-64 bg-white border-r p-4 space-y-2">
                    <NavButton
                        active={activeTab === 'display'}
                        onClick={() => setActiveTab('display')}
                        icon={<Layout size={18} />}
                        label="Position & Entry"
                    />
                    <NavButton
                        active={activeTab === 'pages'}
                        onClick={() => setActiveTab('pages')}
                        icon={<Globe size={18} />}
                        label="Page Targeting"
                    />
                    <NavButton
                        active={activeTab === 'visitor'}
                        onClick={() => setActiveTab('visitor')}
                        icon={<User size={18} />}
                        label="Visitor Rules"
                    />
                    <NavButton
                        active={activeTab === 'geo_device'}
                        onClick={() => setActiveTab('geo_device')}
                        icon={<MapPin size={18} />}
                        label="Geo & Device"
                    />
                    <NavButton
                        active={activeTab === 'schedule'}
                        onClick={() => setActiveTab('schedule')}
                        icon={<CalendarClock size={18} />}
                        label="Schedule & Timer"
                    />
                    <NavButton
                        active={activeTab === 'time'}
                        onClick={() => setActiveTab('time')}
                        icon={<Clock size={18} />}
                        label="Time & Scroll"
                    />
                    <NavButton
                        active={activeTab === 'advanced'}
                        onClick={() => setActiveTab('advanced')}
                        icon={<Code size={18} />}
                        label="Advanced Rules"
                    />
                    <NavButton
                        active={activeTab === 'teaser'}
                        onClick={() => setActiveTab('teaser')}
                        icon={<MousePointer2 size={18} />}
                        label="Over-state (Teaser)"
                    />

                    <div className="mt-8 pt-6 border-t">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Active Rules</h4>
                        <ActiveRulesSummary triggers={triggers} />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-8">

                        {activeTab === 'display' && (
                            <div className="space-y-6">
                                <Section title="Screen Position" description="Where should the popup appear on the screen?">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Desktop Position</label>
                                            <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
                                                {['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                                                    <button
                                                        key={pos}
                                                        onClick={() => setSettings(prev => ({ ...prev, position: { ...prev.position, desktop: pos } }))}
                                                        className={`w-12 h-12 border rounded hover:bg-gray-100 flex items-center justify-center ${settings.position.desktop === pos ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-200' : 'bg-white'
                                                            }`}
                                                        title={pos}
                                                    >
                                                        <div className={`w-3 h-3 bg-gray-400 rounded-sm ${settings.position.desktop === pos ? 'bg-blue-600' : ''}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Position</label>
                                            <select
                                                className="w-full border rounded px-3 py-2"
                                                value={settings.position.mobile}
                                                onChange={(e) => setSettings(prev => ({ ...prev, position: { ...prev.position, mobile: e.target.value } }))}
                                            >
                                                <option value="center">Center</option>
                                                <option value="top-center">Top</option>
                                                <option value="bottom-center">Bottom</option>
                                            </select>
                                        </div>
                                    </div>
                                </Section>

                                <Section title="Entry Animation" description="How the popup should animate when appearing.">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Desktop Animation</label>
                                            <select
                                                className="w-full border rounded px-3 py-2"
                                                value={settings.animation.desktop}
                                                onChange={(e) => setSettings(prev => ({ ...prev, animation: { ...prev.animation, desktop: e.target.value } }))}
                                            >
                                                <option value="fade">Fade In</option>
                                                <option value="slide-up">Slide Up</option>
                                                <option value="slide-down">Slide Down</option>
                                                <option value="slide-left">Slide Left</option>
                                                <option value="slide-right">Slide Right</option>
                                                <option value="zoom">Zoom In</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Animation</label>
                                            <select
                                                className="w-full border rounded px-3 py-2"
                                                value={settings.animation.mobile}
                                                onChange={(e) => setSettings(prev => ({ ...prev, animation: { ...prev.animation, mobile: e.target.value } }))}
                                            >
                                                <option value="fade">Fade In</option>
                                                <option value="slide-up">Slide Up</option>
                                                <option value="slide-down">Slide Down</option>
                                                <option value="zoom">Zoom In</option>
                                            </select>
                                        </div>
                                    </div>
                                </Section>
                            </div>
                        )}

                        {activeTab === 'visitor' && (
                            <div className="space-y-6">
                                <Section title="Visitor History" description="Who should see this popup?">
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'all', label: 'Every Refresh', desc: 'Show every time the page is loaded' },
                                            { id: 'session_unique', label: 'Unique Session', desc: 'Show once per browser session' },
                                            { id: 'persistent_unique', label: 'Unique Visitors', desc: 'Show once per visitor (Persistent)' },
                                            { id: 'repeater', label: 'Returning Visitors', desc: 'Visitors with >1 session' },
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setTriggers(prev => ({ ...prev, visitorType: opt.id as any }))}
                                                className={`p-4 border rounded-lg text-left hover:border-blue-300 transition-colors ${triggers.visitorType === opt.id ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'bg-white'
                                                    }`}
                                            >
                                                <div className="font-semibold text-gray-900">{opt.label}</div>
                                                <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </Section>

                                <Section title="Visit Count Frequency" description="Show only on specific visit number?">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center border rounded px-3 py-2 bg-gray-50">
                                            <span className="text-gray-600 mr-2">Show on visit number:</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={triggers.visitorCount || ''}
                                                onChange={(e) => setTriggers(prev => ({ ...prev, visitorCount: Number(e.target.value) }))}
                                                className="w-16 border rounded px-1 text-center bg-white"
                                                placeholder="Any"
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Leave as &quot;0&quot; or empty to show on any qualifying visit. e.g. &quot;4&quot; means show ONLY on the 4th visit.
                                        </p>
                                    </div>
                                </Section>
                            </div>
                        )}

                        {activeTab === 'pages' && (
                            <div className="space-y-6">
                                <Section
                                    title="URL Targeting"
                                    description="Show popup on specific pages based on URL patterns."
                                >
                                    {triggers.pageUrl.map((rule, idx) => (
                                        <div key={idx} className="flex gap-3 mb-3 items-center bg-gray-50 p-3 rounded border">
                                            <select
                                                value={rule.matchType}
                                                onChange={(e) => updateRule('pageUrl', idx, 'matchType', e.target.value)}
                                                className="border rounded px-2 py-1 bg-white"
                                            >
                                                <option value="contains">Contains</option>
                                                <option value="exact">Exact Match</option>
                                                <option value="startsWith">Starts With</option>
                                                <option value="endsWith">Ends With</option>
                                                <option value="notContains">Does Not Contain</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={rule.value}
                                                onChange={(e) => updateRule('pageUrl', idx, 'value', e.target.value)}
                                                className="flex-1 border rounded px-3 py-1"
                                                placeholder="e.g. /pricing"
                                            />
                                            <button onClick={() => removeRule('pageUrl', idx)} className="text-red-500 hover:text-red-700">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => addRule('pageUrl', { matchType: 'contains', value: '' })}
                                        className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline"
                                    >
                                        <Plus size={16} /> Add new URL rule
                                    </button>
                                </Section>

                                <Section
                                    title="Page Title Targeting"
                                    description="Target pages by their HTML <title> tag."
                                >
                                    {triggers.pageTitle.map((rule, idx) => (
                                        <div key={idx} className="flex gap-3 mb-3 items-center bg-gray-50 p-3 rounded border">
                                            <select
                                                value={rule.matchType}
                                                onChange={(e) => updateRule('pageTitle', idx, 'matchType', e.target.value)}
                                                className="border rounded px-2 py-1 bg-white"
                                            >
                                                <option value="contains">Contains</option>
                                                <option value="exact">Exact Match</option>
                                                <option value="notContains">Does Not Contain</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={rule.value}
                                                onChange={(e) => updateRule('pageTitle', idx, 'value', e.target.value)}
                                                className="flex-1 border rounded px-3 py-1"
                                                placeholder="e.g. Checkout"
                                            />
                                            <button onClick={() => removeRule('pageTitle', idx)} className="text-red-500 hover:text-red-700">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => addRule('pageTitle', { matchType: 'contains', value: '' })}
                                        className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline"
                                    >
                                        <Plus size={16} /> Add new Title rule
                                    </button>
                                </Section>

                                <Section
                                    title="UTM Parameters"
                                    description="Show popup only when specific UTM parameters are in the URL."
                                >
                                    {triggers.utmParameters?.map((rule, idx) => (
                                        <div key={idx} className="flex gap-3 mb-3 items-center bg-gray-50 p-3 rounded border">
                                            <input
                                                type="text"
                                                value={rule.name}
                                                onChange={(e) => updateRule('utmParameters', idx, 'name', e.target.value)}
                                                className="border rounded px-3 py-1 w-1/3"
                                                placeholder="e.g. utm_campaign"
                                            />
                                            <select
                                                value={rule.matchType}
                                                onChange={(e) => updateRule('utmParameters', idx, 'matchType', e.target.value)}
                                                className="border rounded px-2 py-1 bg-white"
                                            >
                                                <option value="equals">Equals</option>
                                                <option value="contains">Contains</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={rule.value}
                                                onChange={(e) => updateRule('utmParameters', idx, 'value', e.target.value)}
                                                className="flex-1 border rounded px-3 py-1"
                                                placeholder="e.g. summer_sale"
                                            />
                                            <button onClick={() => removeRule('utmParameters', idx)} className="text-red-500 hover:text-red-700">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => addRule('utmParameters', { name: '', matchType: 'equals', value: '' })}
                                        className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline"
                                    >
                                        <Plus size={16} /> Add new UTM rule
                                    </button>
                                </Section>
                            </div>
                        )}

                        {activeTab === 'geo_device' && (
                            <div className="space-y-6">
                                <Section title="Device Targeting" description="Select which devices this popup should appear on.">
                                    <div className="flex gap-4">
                                        {['desktop', 'mobile', 'tablet'].map(device => (
                                            <label key={device} className="flex items-center gap-2 cursor-pointer p-3 border rounded hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={triggers.targetDevices?.includes(device) ?? true}
                                                    onChange={(e) => {
                                                        const devices = triggers.targetDevices || ['desktop', 'mobile', 'tablet'];
                                                        setTriggers(prev => ({
                                                            ...prev,
                                                            targetDevices: e.target.checked
                                                                ? [...devices, device]
                                                                : devices.filter(d => d !== device)
                                                        }));
                                                    }}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                                />
                                                <span className="capitalize text-sm font-medium text-gray-700">{device}</span>
                                            </label>
                                        ))}
                                    </div>
                                </Section>

                                <Section title="Browser Targeting" description="Select which browsers this popup should appear on.">
                                    <div className="flex flex-wrap gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer p-3 border rounded hover:bg-gray-50 bg-blue-50/50">
                                            <input
                                                type="checkbox"
                                                checked={(triggers.targetBrowsers || ['chrome', 'firefox', 'safari', 'edge', 'opera']).length === 5}
                                                onChange={(e) => {
                                                    setTriggers(prev => ({
                                                        ...prev,
                                                        targetBrowsers: e.target.checked ? ['chrome', 'firefox', 'safari', 'edge', 'opera'] : []
                                                    }));
                                                }}
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                            />
                                            <span className="capitalize text-sm font-bold text-gray-700">All Browsers</span>
                                        </label>
                                        
                                        {['chrome', 'firefox', 'safari', 'edge', 'opera'].map(browser => (
                                            <label key={browser} className="flex items-center gap-2 cursor-pointer p-3 border rounded hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={triggers.targetBrowsers?.includes(browser) ?? true}
                                                    onChange={(e) => {
                                                        const browsers = triggers.targetBrowsers || ['chrome', 'firefox', 'safari', 'edge', 'opera'];
                                                        setTriggers(prev => ({
                                                            ...prev,
                                                            targetBrowsers: e.target.checked
                                                                ? [...browsers, browser]
                                                                : browsers.filter(b => b !== browser)
                                                        }));
                                                    }}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                                />
                                                <span className="capitalize text-sm font-medium text-gray-700">{browser}</span>
                                            </label>
                                        ))}
                                    </div>
                                </Section>

                                <Section title="Geo Targeting (Countries)" description="Target specific countries by their 2-letter country code (e.g., US, CA, IN). Leave empty to target all countries.">
                                    <div className="space-y-3">
                                        <div className="flex gap-3 items-center bg-gray-50 p-3 rounded border">
                                            <input
                                                type="text"
                                                placeholder="Type country code and press Enter (e.g. US)"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const val = (e.target as HTMLInputElement).value.toUpperCase().trim();
                                                        if (val && !(triggers.targetCountries || []).includes(val)) {
                                                            setTriggers(prev => ({ ...prev, targetCountries: [...(prev.targetCountries || []), val] }));
                                                            (e.target as HTMLInputElement).value = '';
                                                        }
                                                    }
                                                }}
                                                className="flex-1 border rounded px-3 py-1"
                                            />
                                        </div>
                                        {triggers.targetCountries && triggers.targetCountries.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {triggers.targetCountries.map((country, idx) => (
                                                    <span key={idx} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center gap-2 font-bold">
                                                        {country}
                                                        <button
                                                            onClick={() => setTriggers(prev => ({
                                                                ...prev,
                                                                targetCountries: (prev.targetCountries || []).filter(c => c !== country)
                                                            }))}
                                                            className="hover:text-blue-900"
                                                        >
                                                            &times;
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {(!triggers.targetCountries || triggers.targetCountries.length === 0) && (
                                            <p className="text-sm text-gray-500 italic">Showing to all countries.</p>
                                        )}
                                    </div>
                                </Section>
                            </div>
                        )}

                        {activeTab === 'schedule' && (
                            <div className="space-y-6">
                                <Section title="Date & Time Schedule" description="Set a specific start and end time for this popup to be active.">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                                            <input
                                                type="datetime-local"
                                                value={triggers.schedule?.startTime ? (() => {
                                                    const d = new Date(triggers.schedule.startTime);
                                                    const pad = (n: number) => n.toString().padStart(2, '0');
                                                    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                                })() : ''}
                                                onChange={(e) => setTriggers(prev => ({
                                                    ...prev,
                                                    schedule: { ...prev.schedule, startTime: e.target.value ? new Date(e.target.value).toISOString() : null }
                                                }))}
                                                className="w-full border rounded px-3 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                                            <input
                                                type="datetime-local"
                                                value={triggers.schedule?.endTime ? (() => {
                                                    const d = new Date(triggers.schedule.endTime);
                                                    const pad = (n: number) => n.toString().padStart(2, '0');
                                                    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                                })() : ''}
                                                onChange={(e) => setTriggers(prev => ({
                                                    ...prev,
                                                    schedule: { ...prev.schedule, endTime: e.target.value ? new Date(e.target.value).toISOString() : null }
                                                }))}
                                                className="w-full border rounded px-3 py-2"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-4 italic">
                                        If you specify an end time, a "Time Left" indicator will be shown on the popup's dashboard card. Leave fields empty to keep it active indefinitely.
                                    </p>
                                </Section>
                            </div>
                        )}

                        {activeTab === 'time' && (
                            <div className="space-y-6">
                                <Section title="Time Delay" description="Show popup after X seconds.">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={triggers.timeDelay || ''}
                                            onChange={(e) => setTriggers(prev => ({ ...prev, timeDelay: e.target.value ? Number(e.target.value) : null }))}
                                            className="border rounded px-3 py-2 w-32"
                                            placeholder="0"
                                        />
                                        <span className="text-gray-600">seconds on page</span>
                                    </div>
                                </Section>

                                <Section title="Scroll Percentage" description="Show popup after user scrolls down X percent.">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="0" max="100"
                                            value={triggers.scrollPercentage || ''}
                                            onChange={(e) => setTriggers(prev => ({ ...prev, scrollPercentage: e.target.value ? Number(e.target.value) : null }))}
                                            className="border rounded px-3 py-2 w-32"
                                            placeholder="50"
                                        />
                                        <span className="text-gray-600">% of page height</span>
                                    </div>
                                </Section>

                                <Section title="Exit Intent" description="Trigger popup when the user's mouse moves towards the top of the browser window (indicating they are about to leave).">
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!triggers.exitIntent}
                                                onChange={(e) => setTriggers(prev => ({ ...prev, exitIntent: e.target.checked }))}
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                            />
                                            <span className="font-medium text-gray-700">Enable Exit Intent</span>
                                        </label>
                                    </div>
                                </Section>

                                <Section title="Idle Intent" description="Trigger popup after X seconds of no mouse movement or clicks.">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={triggers.inactivityTime || ''}
                                            onChange={(e) => setTriggers(prev => ({ ...prev, inactivityTime: e.target.value ? Number(e.target.value) : null }))}
                                            className="border rounded px-3 py-2 w-32"
                                            placeholder="30"
                                        />
                                        <span className="text-gray-600">seconds inactive</span>
                                    </div>
                                </Section>

                                <Section title="Auto Close" description="Automatically close popup after X seconds.">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={triggers.autoCloseDelay || ''}
                                            onChange={(e) => setTriggers(prev => ({ ...prev, autoCloseDelay: e.target.value ? Number(e.target.value) : null }))}
                                            className="border rounded px-3 py-2 w-32"
                                            placeholder="e.g. 10"
                                        />
                                        <span className="text-gray-600">seconds after display</span>
                                    </div>
                                </Section>
                            </div>
                        )}

                        {activeTab === 'advanced' && (
                            <div className="space-y-6">
                                <Section title="Click Trigger" description="Trigger popup when user clicks an element (CSS Selector).">
                                    <div className="flex items-center gap-3 mb-2">
                                        <MousePointer2 className="text-gray-400" />
                                        <input
                                            type="text"
                                            value={triggers.clickTrigger || ''}
                                            onChange={(e) => setTriggers(prev => ({ ...prev, clickTrigger: e.target.value || null }))}
                                            className="border rounded px-3 py-2 w-full font-mono text-sm"
                                            placeholder="#my-button, .cta-link"
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                        <p className="font-semibold mb-1">To use this:</p>
                                        <code className="bg-gray-200 px-1 rounded">&lt;button id=&quot;my-button&quot;&gt;Click Me&lt;/button&gt;</code>
                                        <p className="mt-1">Add this ID to your website&apos;s button, then enter <code>#my-button</code> above.</p>
                                    </div>
                                </Section>

                                <Section title="JavaScript Variable" description="Trigger based on global window variable value.">
                                    {triggers.jsVariable.map((rule, idx) => (
                                        <div key={idx} className="flex gap-3 mb-3 items-center bg-gray-50 p-3 rounded border flex-wrap">
                                            <span className="text-gray-500 text-sm">window.</span>
                                            <input
                                                type="text"
                                                value={rule.name}
                                                onChange={(e) => updateRule('jsVariable', idx, 'name', e.target.value)}
                                                className="border rounded px-2 py-1 w-32"
                                                placeholder="varName"
                                            />
                                            <select
                                                value={rule.matchType}
                                                onChange={(e) => updateRule('jsVariable', idx, 'matchType', e.target.value)}
                                                className="border rounded px-2 py-1 bg-white"
                                            >
                                                <option value="equals">Equals (==)</option>
                                                <option value="contains">Contains</option>
                                                <option value="greaterThan">&gt;</option>
                                                <option value="lessThan">&lt;</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={rule.value}
                                                onChange={(e) => updateRule('jsVariable', idx, 'value', e.target.value)}
                                                className="flex-1 border rounded px-3 py-1"
                                                placeholder="Expected Value"
                                            />
                                            <button onClick={() => removeRule('jsVariable', idx)} className="text-red-500 hover:text-red-700">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => addRule('jsVariable', { name: '', matchType: 'equals', value: '' })}
                                        className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline"
                                    >
                                        <Plus size={16} /> Add new JS Variable rule
                                    </button>
                                </Section>
                            </div>
                        )}

                        {activeTab === 'teaser' && (
                            <div className="space-y-6">
                                <Section title="Teaser Display Settings" description="Configure when and where the minimized teaser should appear.">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <div
                                                className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${settings.overState?.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                                                onClick={() => setSettings(prev => ({
                                                    ...prev,
                                                    overState: {
                                                        ...(prev.overState || { text: 'Open Offer', showClose: true, style: {}, triggers: { positionDesktop: 'bottom-left', positionMobile: 'bottom-left', displayMode: 'always', delay: 0 } }),
                                                        enabled: !prev.overState?.enabled
                                                    }
                                                }))}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.overState?.enabled ? 'left-7' : 'left-1'}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-blue-900">Enable Teaser (Over-state)</h4>
                                                <p className="text-sm text-blue-700">Show a small button when the main popup is hidden.</p>
                                            </div>
                                        </div>

                                        {settings.overState?.enabled && (
                                            <>
                                                <div className="grid grid-cols-2 gap-8 mb-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Teaser Text</label>
                                                        <input
                                                            type="text"
                                                            value={settings.overState.text}
                                                            onChange={(e) => setSettings(prev => ({
                                                                ...prev,
                                                                overState: { ...prev.overState!, text: e.target.value }
                                                            }))}
                                                            className="w-full border rounded px-3 py-2"
                                                            placeholder="e.g. Open Offer"
                                                        />
                                                    </div>
                                                    <div className="flex items-center mt-6">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={settings.overState.showClose}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    overState: { ...prev.overState!, showClose: e.target.checked }
                                                                }))}
                                                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                                            />
                                                            <span className="text-sm font-medium text-gray-700">Show Close Button on Teaser</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-8 mb-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="color"
                                                                value={settings.overState.style?.backgroundColor || '#ffffff'}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    overState: {
                                                                        ...prev.overState!,
                                                                        style: { ...prev.overState!.style, backgroundColor: e.target.value }
                                                                    }
                                                                }))}
                                                                className="h-10 w-10 border rounded p-1 cursor-pointer"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={settings.overState.style?.backgroundColor || '#ffffff'}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    overState: {
                                                                        ...prev.overState!,
                                                                        style: { ...prev.overState!.style, backgroundColor: e.target.value }
                                                                    }
                                                                }))}
                                                                className="flex-1 border rounded px-3 py-2 font-mono"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="color"
                                                                value={settings.overState.style?.color || '#000000'}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    overState: {
                                                                        ...prev.overState!,
                                                                        style: { ...prev.overState!.style, color: e.target.value }
                                                                    }
                                                                }))}
                                                                className="h-10 w-10 border rounded p-1 cursor-pointer"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={settings.overState.style?.color || '#000000'}
                                                                onChange={(e) => setSettings(prev => ({
                                                                    ...prev,
                                                                    overState: {
                                                                        ...prev.overState!,
                                                                        style: { ...prev.overState!.style, color: e.target.value }
                                                                    }
                                                                }))}
                                                                className="flex-1 border rounded px-3 py-2 font-mono"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mb-6">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom HTML (Advanced)</label>
                                                    <p className="text-xs text-gray-500 mb-2">Override the default teaser styling by providing your own HTML. This allows you to add images, custom shapes, and full styling.</p>
                                                    <textarea
                                                        value={settings.overState.customHtml || ''}
                                                        onChange={(e) => setSettings(prev => ({
                                                            ...prev,
                                                            overState: { ...prev.overState!, customHtml: e.target.value }
                                                        }))}
                                                        className="w-full border rounded px-3 py-2 font-mono text-sm min-h-[100px]"
                                                        placeholder="<div style='background: red; border-radius: 50%; padding: 10px;'><img src='...' /></div>"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-8 mb-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Desktop Position</label>
                                                        <select
                                                            className="w-full border rounded px-3 py-2"
                                                            value={settings.overState.triggers.positionDesktop}
                                                            onChange={(e) => setSettings(prev => ({
                                                                ...prev,
                                                                overState: {
                                                                    ...prev.overState!,
                                                                    triggers: { ...prev.overState!.triggers, positionDesktop: e.target.value }
                                                                }
                                                            }))}
                                                        >
                                                            <option value="bottom-left">Bottom Left</option>
                                                            <option value="bottom-right">Bottom Right</option>
                                                            <option value="top-left">Top Left</option>
                                                            <option value="top-right">Top Right</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Position</label>
                                                        <select
                                                            className="w-full border rounded px-3 py-2"
                                                            value={settings.overState.triggers.positionMobile}
                                                            onChange={(e) => setSettings(prev => ({
                                                                ...prev,
                                                                overState: {
                                                                    ...prev.overState!,
                                                                    triggers: { ...prev.overState!.triggers, positionMobile: e.target.value }
                                                                }
                                                            }))}
                                                        >
                                                            <option value="bottom-left">Bottom Left</option>
                                                            <option value="bottom-right">Bottom Right</option>
                                                            <option value="bottom-center">Bottom Center</option>
                                                            <option value="top-center">Top Center</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Mode</label>
                                                    <div className="space-y-3">
                                                        {[
                                                            { id: 'always', label: 'View Always', desc: 'Teaser is always visible when popup is closed.' },
                                                            { id: 'closed_not_filled', label: 'View When Popup is closed and not filled', desc: 'Teaser hides if user has already submitted the form.' },
                                                            { id: 'after_delay', label: 'Show after a duration', desc: 'Show teaser only after X seconds on page.' },
                                                        ].map(mode => (
                                                            <label key={mode.id} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                                <input
                                                                    type="radio"
                                                                    name="displayMode"
                                                                    checked={settings.overState?.triggers.displayMode === mode.id}
                                                                    onChange={() => setSettings(prev => ({
                                                                        ...prev,
                                                                        overState: {
                                                                            ...prev.overState!,
                                                                            triggers: { ...prev.overState!.triggers, displayMode: mode.id as any }
                                                                        }
                                                                    }))}
                                                                    className="mt-1"
                                                                />
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{mode.label}</div>
                                                                    <div className="text-xs text-gray-500">{mode.desc}</div>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {settings.overState?.triggers.displayMode === 'after_delay' && (
                                                    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                                                        <span className="text-sm font-medium text-gray-700">Display Delay:</span>
                                                        <input
                                                            type="number"
                                                            value={settings.overState.triggers.delay || 0}
                                                            onChange={(e) => setSettings(prev => ({
                                                                ...prev,
                                                                overState: {
                                                                    ...prev.overState!,
                                                                    triggers: { ...prev.overState!.triggers, delay: Number(e.target.value) }
                                                                }
                                                            }))}
                                                            className="w-20 border rounded px-2 py-1"
                                                        />
                                                        <span className="text-sm text-gray-500">seconds</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </Section>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-gray-500 text-sm mb-4">{description}</p>
            {children}
        </div>
    );
}

function ActiveRulesSummary({ triggers }: { triggers: TriggersState }) {
    const rules = [];

    if (triggers.timeDelay) rules.push(`Wait ${triggers.timeDelay}s`);
    if (triggers.scrollPercentage) rules.push(`Scroll ${triggers.scrollPercentage}%`);
    if (triggers.inactivityTime) rules.push(`Inactive ${triggers.inactivityTime}s`);
    if (triggers.pageUrl.length > 0) rules.push(`${triggers.pageUrl.length} URL Rule(s)`);
    if (triggers.pageTitle.length > 0) rules.push(`${triggers.pageTitle.length} Title Rule(s)`);
    if (triggers.clickTrigger) rules.push(`On Click`);
    if (triggers.jsVariable.length > 0) rules.push(`JS Variable`);
    if (triggers.autoCloseDelay) rules.push(`Auto Close ${triggers.autoCloseDelay}s`);
    if (triggers.visitorType !== 'all') {
        const typeMap: any = {
            session_unique: 'New session',
            persistent_unique: 'Unique visitor',
            repeater: 'Returning visitor'
        };
        rules.push(typeMap[triggers.visitorType] || triggers.visitorType);
    }
    if (triggers.visitorCount > 0) rules.push(`Visit #${triggers.visitorCount}`);

    if (rules.length === 0) {
        return <div className="text-sm text-gray-400 italic px-2">No active rules</div>;
    }

    return (
        <div className="space-y-2 px-2">
            {rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-2 py-1.5 rounded">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {rule}
                </div>
            ))}
        </div>
    );
}
