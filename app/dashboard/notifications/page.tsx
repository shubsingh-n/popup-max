
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Plus, Send, AlertCircle, Download, CheckCircle, RefreshCcw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function NotificationsPage() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [sites, setSites] = useState<any[]>([]);
    const [selectedSite, setSelectedSite] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const searchParams = useSearchParams();
    const siteIdParam = searchParams.get('siteId');

    useEffect(() => {
        fetchInitialData();
    }, [siteIdParam]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Sites
            const sitesRes = await fetch('/api/sites');
            const sitesData = await sitesRes.json();
            if (sitesData.success) {
                setSites(sitesData.data);
                const currentSite = siteIdParam
                    ? sitesData.data.find((s: any) => s.siteId === siteIdParam)
                    : sitesData.data[0];
                setSelectedSite(currentSite);

                // 2. Fetch Campaigns for this site or all
                const url = currentSite ? `/api/notifications?siteId=${currentSite.siteId}` : '/api/notifications';
                const campaignsRes = await fetch(url);
                const campaignsData = await campaignsRes.json();
                if (campaignsData.success) {
                    setCampaigns(campaignsData.data);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!selectedSite) return;
        setVerifying(true);
        try {
            const res = await fetch(`/api/sites/${selectedSite._id}/verify-push`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert('Success! Your site is verified.');
                fetchInitialData(); // Refresh to hide banner
            } else {
                alert('Verification Failed: ' + data.error);
            }
        } catch (e) {
            alert('Error during verification.');
        } finally {
            setVerifying(false);
        }
    };

    const downloadSW = async () => {
        try {
            const res = await fetch('/firebase-messaging-sw.js');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'firebase-messaging-sw.js';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert('Failed to download file.');
        }
    };

    const handleSend = async (id: string) => {
        if (!confirm('Are you sure you want to send this notification to all subscribers?')) return;

        try {
            const res = await fetch(`/api/notifications/${id}/send`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert('Notification Sent!');
                fetchInitialData();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (e) {
            alert('Failed to send.');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    const showSetup = selectedSite && !selectedSite.isPushVerified;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-900">Push Campaigns</h1>
                    {selectedSite && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-white border rounded-full text-sm text-gray-600">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            {selectedSite.name}
                        </div>
                    )}
                </div>
                <Link
                    href={`/dashboard/notifications/new${selectedSite ? `?siteId=${selectedSite.siteId}` : ''}`}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={18} /> New Campaign
                </Link>
            </div>

            {showSetup && (
                <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
                            <AlertCircle size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-amber-900 mb-1">Push Notifications Setup Required</h3>
                            <p className="text-amber-800 text-sm mb-4">
                                To send notifications to your website visitors, you must upload the Service Worker file to your website&apos;s root directory.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-white p-4 rounded-lg border border-amber-100">
                                    <div className="flex items-center gap-2 mb-2 font-bold text-gray-800">
                                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs">1</span>
                                        Download File
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4">Download the personalized Service Worker file for your site.</p>
                                    <button
                                        onClick={downloadSW}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-gray-900 text-white rounded-md hover:bg-black transition-colors text-sm font-medium"
                                    >
                                        <Download size={16} /> Download JS File
                                    </button>
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-amber-100">
                                    <div className="flex items-center gap-2 mb-2 font-bold text-gray-800">
                                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs">2</span>
                                        Upload & Verify
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4">Upload to <strong>{selectedSite.domain}/firebase-messaging-sw.js</strong></p>
                                    <button
                                        onClick={handleVerify}
                                        disabled={verifying}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
                                    >
                                        {verifying ? <RefreshCcw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                        Verify Installation
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {campaigns.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">No campaigns yet. Click &quot;New Campaign&quot; to create one.</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent / Failed</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {campaigns.map((c) => (
                                <tr key={c._id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{c.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{c.body}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                       ${c.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {c.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {c.sentCount} / {c.failureCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {c.status === 'draft' && (
                                            <button onClick={() => handleSend(c._id)} className="text-purple-600 hover:text-purple-900 flex items-center gap-1">
                                                <Send size={16} /> Send Now
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
