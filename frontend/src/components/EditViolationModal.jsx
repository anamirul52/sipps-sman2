import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { X, Edit, Info } from 'lucide-react';

const EditViolationModal = ({ violation, onClose, onSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(violation?.category_id || '');
  const [violationDate, setViolationDate] = useState(
    violation?.violation_date ? new Date(violation.violation_date).toISOString().split('T')[0] : ''
  );
  const [status, setStatus] = useState(violation?.status || 'pending');
  const [note, setNote] = useState(violation?.note || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId || !violationDate) {
      toast.error('Kategori dan Tanggal Pelanggaran wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const res = await api.put(`/violations/${violation.id}`, {
        category_id: parseInt(categoryId),
        violation_date: violationDate,
        status,
        note
      });

      toast.success(res.data.message || 'Pelanggaran berhasil diperbarui');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal memperbarui pelanggaran';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedCat = categories.find(c => String(c.id) === String(categoryId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3.5 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-amber-900 flex items-center">
            <Edit className="mr-2 text-amber-600 text-xl" />
            Edit Catatan Pelanggaran
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-white transition"
          >
            <X className="text-xl" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info Siswa (Read-only) */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 flex justify-between items-center">
            <div>
              <span className="text-gray-500 block">Siswa:</span>
              <strong className="text-gray-900 text-sm">{violation?.student_name}</strong>
            </div>
            <div className="text-right">
              <span className="text-gray-500 block">NIPD:</span>
              <span className="font-mono font-semibold">{violation?.nipd || violation?.nisn || '-'}</span>
            </div>
          </div>

          {/* Kategori Pelanggaran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori Pelanggaran <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
            >
              <option value="">-- Pilih Jenis Pelanggaran (29 Kategori Resmi) --</option>
              {categories.map((c, idx) => (
                <option key={c.id} value={c.id}>
                  {idx + 1}. [{c.point_deduction} Poin] {c.name}
                </option>
              ))}
            </select>
            {selectedCat && (
              <div className="mt-1.5 p-2 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900 flex justify-between">
                <span>Bobot Poin: <strong>+{selectedCat.point_deduction} Poin</strong></span>
                <span>Tindakan: <em>{selectedCat.penalty_description}</em></span>
              </div>
            )}
          </div>

          {/* Tanggal Pelanggaran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Pelanggaran <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={violationDate}
              onChange={(e) => setViolationDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Status Penanganan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Penanganan <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
            >
              <option value="pending">Pending (Menunggu Penanganan)</option>
              <option value="processed">Diproses (Sedang Konseling/Tindakan)</option>
              <option value="resolved">Selesai (Sudah Ditindak/Tuntas)</option>
            </select>
          </div>

          {/* Catatan / Kronologi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan / Kronologi
            </label>
            <textarea
              rows="3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tambahkan catatan kronologi kejadian..."
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            ></textarea>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium shadow disabled:opacity-50 transition"
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditViolationModal;
