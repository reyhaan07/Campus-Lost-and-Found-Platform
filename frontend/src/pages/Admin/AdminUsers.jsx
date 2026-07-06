import { useState } from 'react';
import api from '../../services/api';

const AdminUsers = ({ users: initialUsers }) => {
  const [users, setUsers] = useState(initialUsers || []);

  const toggleActive = async (userId) => {
    await api.put(`/admin/users/${userId}/deactivate`);
    setUsers((prev) => prev.map((user) => user._id === userId ? { ...user, isActive: !user.isActive } : user));
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <h2 className="mb-4 font-semibold">Manage Users</h2>
      {users.map((user) => (
        <div key={user._id} className="flex items-center justify-between border-b py-2 text-sm">
          <span>{user.name} ({user.email})</span>
          <button className="text-primary" onClick={() => toggleActive(user._id)}>{user.isActive ? 'Deactivate' : 'Activate'}</button>
        </div>
      ))}
    </div>
  );
};

export default AdminUsers;
