import { Link } from 'react-router-dom';

const ReportCard = ({ report }) => (
  <Link to={`/report/${report._id}`} className="rounded-xl border bg-white p-4 shadow-sm hover:border-primary">
    <img src={report.imageUrl} alt={report.title} className="h-40 w-full rounded-lg object-cover" />
    <h3 className="mt-3 font-semibold">{report.title}</h3>
    <p className="text-sm text-slate-500">{report.location}</p>
    <p className="mt-2 text-sm text-slate-700">{report.description.slice(0, 100)}...</p>
  </Link>
);

export default ReportCard;
