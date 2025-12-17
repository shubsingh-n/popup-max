'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats {
  totalSites: number;
  totalPopups: number;
  totalLeads: number;
  conversionRate: number;
  recentLeads: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalSites: 0,
    totalPopups: 0,
    totalLeads: 0,
    conversionRate: 0,
    recentLeads: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [sitesRes, popupsRes, leadsRes, eventsRes] = await Promise.all([
        fetch('/api/sites'),
        fetch('/api/popups'),
        fetch('/api/leads'),
        fetch('/api/events?type=view'),
      ]);

      const sites = await sitesRes.json();
      const popups = await popupsRes.json();
      const leads = await leadsRes.json();
      const events = await eventsRes.json();

      const totalSites = sites.data?.length || 0;
      const totalPopups = popups.data?.length || 0;
      const totalLeads = leads.data?.length || 0;
      const totalViews = events.data?.length || 0;
      const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;

      // Get recent leads (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentLeads = leads.data?.filter(
        (lead: any) => new Date(lead.createdAt) >= sevenDaysAgo
      ).length || 0;

      setStats({
        totalSites,
        totalPopups,
        totalLeads,
        conversionRate: Math.round(conversionRate * 100) / 100,
        recentLeads,
      });

      // Prepare chart data (last 7 days)
      const chartDataMap: { [key: string]: { date: string; leads: number; views: number } } = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        chartDataMap[dateStr] = { date: dateStr, leads: 0, views: 0 };
      }

      leads.data?.forEach((lead: any) => {
        const dateStr = new Date(lead.createdAt).toISOString().split('T')[0];
        if (chartDataMap[dateStr]) {
          chartDataMap[dateStr].leads++;
        }
      });

      events.data?.forEach((event: any) => {
        const dateStr = new Date(event.createdAt).toISOString().split('T')[0];
        if (chartDataMap[dateStr]) {
          chartDataMap[dateStr].views++;
        }
      });

      setChartData(Object.values(chartDataMap));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Sites</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalSites}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Popups</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalPopups}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Leads</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Conversion Rate</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Leads (7d)</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.recentLeads}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Last 7 Days Activity</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
            <Bar dataKey="views" fill="#10b981" name="Views" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/dashboard/sites"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Sites</h3>
          <p className="text-gray-600">Create and manage your websites</p>
        </Link>
        <Link
          href="/dashboard/leads"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">View Leads</h3>
          <p className="text-gray-600">See all your captured leads</p>
        </Link>
      </div>
    </div>
  );
}

