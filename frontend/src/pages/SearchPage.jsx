import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const SearchPage = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ type: 'found', search, category });
        const response = await api.get(`/reports?${params.toString()}`);
        if (active) {
          setReports(response.data.reports || []);
          setError('');
        }
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || 'Unable to search reports');
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, category]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-2xl font-semibold">Search Found Items</h2>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input className="flex-1 rounded-lg border p-3" placeholder="Search by title, category, or location" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="rounded-lg border p-3" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option>Electronics</option><option>Documents</option><option>Accessories</option><option>Clothing</option><option>Others</option>
          </select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading && <p className="text-slate-500">Searching...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && reports.length === 0 && <p className="text-slate-500">No matching found items.</p>}
        {reports.map((report) => (
          <Link key={report._id} to={`/report/${report._id}`} className="rounded-xl border bg-white p-4 shadow-sm">
            <img src={report.imageUrl} alt={report.title} className="h-40 w-full rounded-lg object-cover" />
            <h3 className="mt-3 font-semibold">{report.title}</h3>
            <p className="text-sm text-slate-500">{report.location}</p>
            <p className="mt-2 text-sm">{report.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SearchPage;
