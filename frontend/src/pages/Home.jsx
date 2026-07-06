import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Home = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/reports?type=found&page=1&limit=6');
        setReports(response.data.reports || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load found items');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-r from-primary to-sky-500 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-semibold">CampusConnect - Never Lose Anything Again 🎓</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-100">Report lost or found items in seconds and let AI help connect the right people.</p>
        <div className="mt-6 flex gap-4">
          <Link to="/report/lost" className="rounded-lg bg-white px-4 py-2 font-medium text-primary">Report Lost</Link>
          <Link to="/report/found" className="rounded-lg border border-white px-4 py-2 font-medium">Report Found</Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Recent Found Items</h2>
          <Link to="/search" className="text-primary">Browse all</Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading && <p className="text-slate-500">Loading found items...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && reports.length === 0 && <p className="text-slate-500">No open found items yet.</p>}
          {reports.map((report) => (
            <Link key={report._id} to={`/report/${report._id}`} className="rounded-xl border bg-white p-4 shadow-sm">
              <img src={report.imageUrl} alt={report.title} className="h-40 w-full rounded-lg object-cover" />
              <h3 className="mt-3 font-semibold">{report.title}</h3>
              <p className="text-sm text-slate-500">{report.location}</p>
              <p className="mt-2 text-sm">{report.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
