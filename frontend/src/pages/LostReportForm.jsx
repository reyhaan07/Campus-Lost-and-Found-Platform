import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';

const reportSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  category: z.enum(['Electronics', 'Documents', 'Accessories', 'Clothing', 'Others']),
  description: z.string().min(10, 'Description is required'),
  location: z.string().min(3, 'Location is required'),
  date: z.string().min(1, 'Date is required'),
});

const LostReportForm = () => {
  const today = new Date().toISOString().split('T')[0];
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(reportSchema), defaultValues: { category: 'Electronics' } });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      setFile(null);
      setPreview('');
      setError('Image must be 5 MB or smaller');
      return;
    }
    setError('');
    setFile(selectedFile);
    if (selectedFile) setPreview(URL.createObjectURL(selectedFile));
  };

  const onSubmit = async (values) => {
    if (submitting) return;
    if (!file) {
      setError('Please upload an image');
      return;
    }

    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('category', values.category);
    formData.append('description', values.description);
    formData.append('location', values.location);
    formData.append('date', values.date);
    formData.append('type', 'lost');
    formData.append('image', file);

    setSubmitting(true);
    setError('');
    try {
      await api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow">
      <h2 className="text-2xl font-semibold">Report a Lost Item</h2>
      {error && <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <input className="w-full rounded-lg border p-3" placeholder="Title" {...register('title')} />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>
        <div>
          <select className="w-full rounded-lg border p-3" {...register('category')}>
            <option value="Electronics">Electronics</option>
            <option value="Documents">Documents</option>
            <option value="Accessories">Accessories</option>
            <option value="Clothing">Clothing</option>
            <option value="Others">Others</option>
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
        </div>
        <div>
          <textarea className="w-full rounded-lg border p-3" placeholder="Description" rows="4" {...register('description')} />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>
        <div>
          <input className="w-full rounded-lg border p-3" placeholder="Location" {...register('location')} />
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
        </div>
        <div>
          <input className="w-full rounded-lg border p-3" type="date" max={today} {...register('date')} />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
        </div>
        <div>
          <input className="w-full rounded-lg border p-3" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
        </div>
        {preview && <img src={preview} alt="Preview" className="h-48 w-full rounded-lg object-cover" />}
        <button type="submit" disabled={submitting} className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-white disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default LostReportForm;
