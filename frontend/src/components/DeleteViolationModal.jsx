import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { X, Trash2, AlertCircle, AlertTriangle } from 'lucide-react';

const DeleteViolationModal = ({ violation, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      const res = await api.delete(`/violations/${violation.id}`);
      toast.success(res.data.message || 'Catatan pelanggaran berhasil dihapus');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menghapus pelanggaran';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3.5 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-red-900 flex items-center">
            <AlertCircle className="mr-2 text-red-600 text-2xl" />
            Hapus Catatan Pelanggaran
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1 rounded-full hover:bg-white transition"
          >
            <X className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-zinc-600">
            Apakah Anda yakin ingin menghapus data pelanggaran berikut?
          </p>

          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-sm space-y-1.5">
            <div>
              <span className="text-xs text-zinc-500 block">Nama Siswa:</span>
              <strong className="text-zinc-900 text-base">{violation?.student_name}</strong>
            </div>
            <div className="text-xs text-zinc-600">
              NIPD: <span className="font-mono font-medium">{violation?.nipd || violation?.nisn || '-'}</span>
            </div>
            <div className="text-xs text-zinc-600">
              Pelanggaran: <span className="font-semibold text-zinc-800">{violation?.category_name}</span>
            </div>
            <div className="text-xs text-zinc-600">
              Poin Pelanggaran: <span className="font-bold text-red-600">+{violation?.point_deduction} Poin</span>
            </div>
            <div className="text-xs text-zinc-600">
              Tanggal: <span>{new Date(violation?.violation_date).toLocaleDateString('id-ID')}</span>
            </div>
          </div>

          <div className="p-3 bg-zinc-100 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start space-x-2">
            <AlertTriangle className="text-lg text-zinc-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Efek Pengurangan:</strong> Menghapus pelanggaran ini akan <strong>mengurangi total poin siswa sebanyak {violation?.point_deduction} poin</strong> secara otomatis.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 text-sm font-medium transition"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmDelete}
              className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium shadow disabled:opacity-50 transition flex items-center space-x-1.5"
            >
              {loading ? (
                <span>Menghapus...</span>
              ) : (
                <>
                  <Trash2 />
                  <span>Ya, Hapus Pelanggaran</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteViolationModal;
