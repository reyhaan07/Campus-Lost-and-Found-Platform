import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../../services/api';
import AdminUsers from './AdminUsers';
import AdminReports from './AdminReports';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [section, setSection] = useState('overview');

  useEffect(() => {
    const load = async () => {
      const statsResponse = await api.get('/admin/stats');
      const usersResponse = await api.get('/admin/users');
      const reportsResponse = await api.get('/admin/reports');
      setStats(statsResponse.data);
      setUsers(usersResponse.data.users || []);
      setReports(reportsResponse.data.reports || []);
    };
    load();
  }, []);

  if (!stats) return <div>Loading admin dashboard...</div>;

  const chartData = stats.categoryBreakdown?.map((item) => ({ name: item._id, value: item.count })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg border px-4 py-2 text-sm" onClick={() => setSection('overview')}>Overview</button>
          <button className="rounded-lg border px-4 py-2 text-sm" onClick={() => setSection('users')}>Users</button>
          <button className="rounded-lg border px-4 py-2 text-sm" onClick={() => setSection('reports')}>Reports</button>
        </div>
      </div>
      {section === 'overview' && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-white p-4 shadow">Total Users: {stats.totalUsers}</div>
            <div className="rounded-xl bg-white p-4 shadow">Open Reports: {stats.openReports}</div>
            <div className="rounded-xl bg-white p-4 shadow">Matched: {stats.matchedReports}</div>
            <div className="rounded-xl bg-white p-4 shadow">Resolved: {stats.resolvedReports}</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-white p-4 shadow">
              <p className="text-sm text-slate-500">Match Success Rate</p>
              <p className="mt-1 text-3xl font-semibold text-primary">{stats.matchSuccessRate ?? 0}%</p>
              <p className="mt-1 text-xs text-slate-400">Share of reports that found or reached a match</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow">
              <p className="text-sm text-slate-500">Recovery Rate</p>
              <p className="mt-1 text-3xl font-semibold text-accent">{stats.recoveryRate ?? 0}%</p>
              <p className="mt-1 text-xs text-slate-400">Share of reports fully resolved</p>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-4 shadow">
              <h2 className="mb-4 font-semibold">Category Breakdown</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={80}>
                    {chartData.map((entry, index) => <Cell key={entry.name} fill={['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#6366F1'][index % 5]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl bg-white p-4 shadow">
              <h2 className="mb-4 font-semibold">Reports Per Month</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.reportsPerMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} />
                  <YAxis allowDecimals={false} width={30} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow">
            <h2 className="mb-4 font-semibold">Recent Reports</h2>
            <div className="space-y-2">
              {reports.slice(0, 6).map((report) => <div key={report._id} className="rounded border p-2 text-sm">{report.title} — {report.status}</div>)}
            </div>
          </div>
        </>
      )}
      {section === 'users' && <AdminUsers users={users} />}
      {section === 'reports' && <AdminReports reports={reports} />}
    </div>
  );
};

export default AdminDashboard;
