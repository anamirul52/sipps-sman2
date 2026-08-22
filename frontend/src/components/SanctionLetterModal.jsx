import { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Download, FileText, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const SanctionLetterModal = ({ studentId, onClose }) => {
  const [sanctions, setSanctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSanctions = async () => {
      try {
        const res = await api.get('/sanctions');
        const allSanctions = res.data.data || [];
        const filtered = allSanctions.filter(s => String(s.student_id) === String(studentId));
        setSanctions(filtered);
      } catch (err) {
        toast.error('Gagal memuat data surat peringatan');
        setSanctions([]);
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchSanctions();
  }, [studentId]);

  const handleDownload = async (sanctionId, studentName) => {
    try {
      const response = await api.get(`/sanctions/${sanctionId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Surat_Peringatan_${studentName.replace(/ /g, '_')}_${sanctionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Surat sanksi berhasil diunduh (PDF)');
    } catch (err) {
      toast.error('Gagal mengunduh file surat');
    }
  };

  const getTierBadgeStyle = (threshold) => {
    if (threshold >= 100) return 'bg-red-800 text-white border-red-900';
    if (threshold >= 76) return 'bg-red-100 text-red-800 border-red-300';
    if (threshold >= 51) return 'bg-rose-100 text-rose-800 border-rose-300';
    if (threshold >= 26) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (threshold >= 21) return 'bg-amber-100 text-amber-800 border-amber-300';
    if (threshold >= 11) return 'bg-sky-100 text-sky-800 border-sky-300';
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 flex justify-between items-center bg-indigo-50/70">
          <div className="flex items-center min-w-0 mr-2">
            <FileText className="mr-2 text-indigo-600 text-xl sm:text-2xl flex-shrink-0" /> 
            <h3 className="text-sm sm:text-lg font-bold text-indigo-950 truncate">
              Riwayat Surat & Tindakan Sanksi Siswa
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1.5 rounded-full hover:bg-white flex-shrink-0"
          >
            <X className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 sm:space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
              <span className="text-xs">Memuat data tindakan sanksi...</span>
            </div>
          ) : sanctions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 space-y-2">
              <ShieldAlert className="text-4xl text-emerald-500 mx-auto" />
              <div className="font-semibold text-gray-700 text-sm">Belum ada surat sanksi yang diterbitkan.</div>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Surat tindakan diterbitkan secara otomatis saat poin pelanggaran siswa mencapai ambang batas resmi.
              </p>
            </div>
          ) : (
            sanctions.map((sanction) => (
              <div 
                key={sanction.id} 
                className="border border-gray-200 bg-white rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getTierBadgeStyle(sanction.point_threshold)}`}>
                      Ambang Batas: {sanction.point_threshold} Poin
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {new Date(sanction.generated_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm">
                    {sanction.status_letter}
                  </h4>

                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    {sanction.violation_summary}
                  </p>
                </div>
                
                <div className="flex-shrink-0 pt-1 sm:pt-0">
                  <button
                    onClick={() => handleDownload(sanction.id, sanction.student_name)}
                    className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-indigo-600 text-white hover:bg-indigo-700 px-3.5 py-2 rounded-lg transition font-semibold text-xs shadow-xs"
                  >
                    <Download className="text-sm" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition text-xs sm:text-sm font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default SanctionLetterModal;
