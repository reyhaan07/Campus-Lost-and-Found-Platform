import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters').or(z.literal('')).optional(),
});

const Profile = () => {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', phone: user?.phone || '', password: '' },
  });

  const onSubmit = async (values) => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const payload = { name: values.name, phone: values.phone };
      if (values.password) payload.password = values.password;
      await api.put('/auth/profile', payload);
      setMessage('Profile updated');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow">
      <h2 className="text-2xl font-semibold">Profile</h2>
      <p className="mt-2 text-sm text-slate-500">Keep your account details up to date.</p>
      {message && <div className="mt-4 rounded bg-green-50 p-3 text-sm text-green-600">{message}</div>}
      {error && <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <input className="w-full rounded-lg border p-3" placeholder="Name" {...register('name')} />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <input className="w-full rounded-lg border p-3" placeholder="Phone" {...register('phone')} />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
        </div>
        <div>
          <input className="w-full rounded-lg border p-3" type="password" placeholder="New password" {...register('password')} />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>
        <button disabled={submitting} className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-white disabled:opacity-50">
          {submitting ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
      <button className="mt-4 rounded-lg border px-4 py-2 text-sm" onClick={logout}>Logout</button>
    </div>
  );
};

export default Profile;
