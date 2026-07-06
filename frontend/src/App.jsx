import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LostReportForm from './pages/LostReportForm';
import FoundReportForm from './pages/FoundReportForm';
import SearchPage from './pages/SearchPage';
import ReportDetail from './pages/ReportDetail';
import Profile from './pages/Profile';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ChatPage from './pages/ChatPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/report/:id" element={<ReportDetail />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report/lost" element={<LostReportForm />} />
          <Route path="/report/found" element={<FoundReportForm />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat/:reportId" element={<ChatPage />} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/dashboard" />} />
        </Route>
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
