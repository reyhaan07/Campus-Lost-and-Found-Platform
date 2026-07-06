import { useState } from 'react';
import api from '../../services/api';

const AdminReports = ({ reports: initialReports }) => {
  const [reports, setReports] = useState(initialReports || []);

  const deleteReport = async (reportId) => {
    await api.delete(`/admin/reports/${reportId}`);
    setReports((prev) => prev.filter((report) => report._id !== reportId));
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <h2 className="mb-4 font-semibold">Manage Reports</h2>
      {reports.map((report) => (
        <div key={report._id} className="flex items-center justify-between border-b py-2 text-sm">
          <span>{report.title} — {report.status}</span>
          <button className="text-red-500" onClick={() => deleteReport(report._id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

export default AdminReports;
