import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const Layout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <nav className="border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between px-4 py-4 gap-4">
          <Link to="/" className="text-xl font-semibold text-primary">CampusConnect</Link>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <NavLink to="/" className="hover:text-primary">Home</NavLink>
            <NavLink to="/search" className="hover:text-primary">Search</NavLink>
            {user ? (
              <>
                <NavLink to="/dashboard" className="hover:text-primary">Dashboard</NavLink>
                <NavLink to="/report/lost" className="hover:text-primary">Report Lost</NavLink>
                <NavLink to="/report/found" className="hover:text-primary">Report Found</NavLink>
                <NavLink to="/profile" className="hover:text-primary">Profile</NavLink>
                {user.role === 'admin' && <NavLink to="/admin" className="hover:text-primary">Admin</NavLink>}
                <NotificationDropdown />
                <button className="text-red-600" onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="hover:text-primary">Login</NavLink>
                <NavLink to="/register" className="hover:text-primary">Register</NavLink>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t bg-white px-4 py-6 text-center text-sm text-slate-500">
        © 2026 CampusConnect. Helping campuses recover lost items faster.
      </footer>
    </div>
  );
};

export default Layout;
