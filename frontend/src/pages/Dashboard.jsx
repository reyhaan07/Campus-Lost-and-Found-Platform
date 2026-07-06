import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/reports/my-reports');
        setReports(response.data.reports || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load reports');
      }
    };
    load();
  }, []);

  const handleResolve = async (id) => {
    if (resolvingId) return;
    setResolvingId(id);
    setError('');
    try {
      await api.put(`/reports/${id}/resolve`);
      setReports((prev) => prev.map((report) => (
        report._id === id ? { ...report, status: 'resolved' } : report
      )));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to resolve report');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <Link to="/report/lost" className="rounded-lg bg-primary px-4 py-2 text-white">New Report</Link>
      </div>
      {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      <div className="grid gap-4">
        {reports.map((report) => (
          <div key={report._id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{report.title}</h3>
                <p className="text-sm text-slate-500">{report.type} • {report.category}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase">{report.status}</span>
            </div>
            <p className="mt-3 text-sm">{report.description}</p>
            <div className="mt-4 flex gap-3">
              <Link to={`/report/${report._id}`} className="text-sm text-primary">View</Link>
              {report.matchedReportId && <Link to={`/chat/${report._id}`} className="text-sm text-primary">Chat</Link>}
              {report.status !== 'resolved' && (
                <button disabled={Boolean(resolvingId)} onClick={() => handleResolve(report._id)} className="text-sm text-accent disabled:opacity-50">
                  {resolvingId === report._id ? 'Resolving...' : 'Mark Resolved'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
