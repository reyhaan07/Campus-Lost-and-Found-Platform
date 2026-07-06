import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ReportDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await api.get(`/reports/${id}`);
      setReport(response.data.report);
    };
    load();
  }, [id]);

  if (!report) return <div>Loading...</div>;

  const reportOwnerId = report.userId?._id || report.userId;
  const matchedOwnerId = report.matchedReportId?.userId?._id || report.matchedReportId?.userId;
  const canChat = user && report.matchedReportId
    && [reportOwnerId, matchedOwnerId].includes(user._id);
  const dateLabel = report.type === 'lost' ? 'Lost on' : 'Found on';

  return (
    <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
      <img src={report.imageUrl} alt={report.title} className="h-72 w-full rounded-xl object-cover" />
      <h2 className="mt-6 text-3xl font-semibold">{report.title}</h2>
      <p className="mt-2 text-slate-500">{report.category} • {report.location}</p>
      <p className="mt-4 text-slate-700">{report.description}</p>
      <div className="mt-6 rounded-lg bg-slate-50 p-4">
        <p><span className="font-medium">Status:</span> {report.status}</p>
        <p><span className="font-medium">{dateLabel}:</span> {new Date(report.date).toLocaleDateString('en-IN')}</p>
        {report.matchedReportId && (
          <div className="mt-4 rounded-xl border bg-white p-4">
            <p className="font-semibold">Potential match found</p>
            <p className="text-sm text-slate-600">Matched report ID: {report.matchedReportId._id || report.matchedReportId}</p>
            <p className="text-sm text-slate-600">
              {report.matchedReportId.type === 'lost' ? 'Lost on' : 'Found on'}: {new Date(report.matchedReportId.date).toLocaleDateString('en-IN')}
            </p>
            {canChat && report.matchedReportId.userId && (
              <div className="mt-2 text-sm text-slate-700">
                <p>Contact Name: {report.matchedReportId.userId.name}</p>
              </div>
            )}
            {canChat && (
              <Link to={`/chat/${report._id}`} className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">
                Chat with matched user
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDetail;
