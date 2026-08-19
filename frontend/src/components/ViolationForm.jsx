import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiSearch, HiCheck, HiX } from 'react-icons/hi';

const ViolationForm = ({ onSuccess }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  
  const dropdownRef = useRef(null);

  // Fetch kategori pelanggaran & initial students saat mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, studentRes] = await Promise.all([
          api.get('/categories'),
          api.get('/students?limit=all')
        ]);
        setCategories(catRes.data.data || []);
        const loadedStudents = studentRes.data.data || [];
        setAllStudents(loadedStudents);
        setStudents(loadedStudents);
      } catch (err) {
        toast.error('Gagal memuat data awal');
      }
    };
    fetchInitialData();
  }, []);

  // Search siswa dengan debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setStudents(allStudents);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingStudents(true);
      try {
        const res = await api.get(`/students?search=${encodeURIComponent(searchQuery)}`);
        setStudents(res.data.data || []);
        setShowDropdown(true);
      } catch (err) {
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, allStudents]);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchQuery(student.name);
    setShowDropdown(false);
  };

  const handleClearSelectedStudent = () => {
    setSelectedStudent(null);
    setSearchQuery('');
    setStudents(allStudents);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('Silakan pilih siswa dari daftar terlebih dahulu');
      return;
    }
    if (!selectedCategory) {
      toast.error('Silakan pilih jenis pelanggaran');
      return;
    }
    if (!date) {
      toast.error('Silakan isi tanggal pelanggaran');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/violations', {
        student_id: selectedStudent.id,
        category_id: parseInt(selectedCategory),
        violation_date: date,
        note: notes
      });

      const { data } = response.data;
      let message = '✅ Pelanggaran berhasil dicatat!';
      if (data.sanctions_created && data.sanctions_created.length > 0) {
        const sanctionNames = data.sanctions_created.map(s => s.status).join(', ');
        message += ` ⚠️ Sanksi Terpicu: ${sanctionNames}`;
      }
      toast.success(message, { duration: 6000 });

      // Reset form
      handleClearSelectedStudent();
      setSelectedCategory('');
      setNotes('');
      if (onSuccess) onSuccess();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Gagal mencatat pelanggaran';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-gray-100">
        <h2 className="text-base sm:text-lg font-bold text-gray-800">
          Input Pelanggaran Baru
        </h2>
        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 w-fit">
          Form Pencatatan Siswa
        </span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          
          {/* Pencarian Siswa */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Siswa <span className="text-red-500">*</span>
            </label>
            
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedStudent && e.target.value !== selectedStudent.name) {
                    setSelectedStudent(null);
                  }
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Klik untuk pilih atau ketik nama/NIPD..."
                className={`w-full rounded-lg border px-4 py-2.5 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm ${
                  selectedStudent ? 'border-green-500 bg-green-50/30' : 'border-gray-300'
                }`}
              />
              
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {selectedStudent ? (
                  <button
                    type="button"
                    onClick={handleClearSelectedStudent}
                    className="text-gray-400 hover:text-red-500"
                    title="Hapus pilihan"
                  >
                    <HiX className="text-lg" />
                  </button>
                ) : (
                  <HiSearch className="text-gray-400 text-lg" />
                )}
              </div>
            </div>

            {/* Selected student badge indicator */}
            {selectedStudent && (
              <div className="mt-1.5 flex items-center text-xs text-green-700 font-medium">
                <HiCheck className="mr-1 text-green-600" />
                Terpilih: {selectedStudent.name} (NIPD: {selectedStudent.nipd || selectedStudent.nisn || '-'} - Kelas: {selectedStudent.class_name || '-'}) | Poin: {selectedStudent.total_points || 0}
              </div>
            )}
            
            {/* Dropdown list */}
            {showDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-xl max-h-60 overflow-y-auto border border-gray-200 divide-y divide-gray-100">
                <div className="px-3 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider sticky top-0 flex justify-between items-center">
                  <span>Daftar Siswa ({students.length})</span>
                  {loadingStudents && <span className="text-indigo-600 animate-pulse">Mencari...</span>}
                </div>

                {students.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    Tidak ada siswa yang cocok dengan "{searchQuery}"
                  </div>
                ) : (
                  students.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className={`px-4 py-2.5 hover:bg-indigo-50 cursor-pointer transition flex items-center justify-between ${
                        selectedStudent?.id === student.id ? 'bg-indigo-50/80 font-semibold' : ''
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500">
                          NIPD: {student.nipd || student.nisn || '-'} &bull; Kelas: <span className="text-indigo-600 font-medium">{student.class_name || '-'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono">
                          {student.total_points || 0} Poin
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Select Kategori Pelanggaran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori Pelanggaran <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white text-sm"
            >
              <option value="">-- Pilih Jenis Pelanggaran (29 Kategori Resmi) --</option>
              {categories.map((cat, idx) => (
                <option key={cat.id} value={cat.id}>
                  {idx + 1}. [{cat.point_deduction} Poin] {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Input Tanggal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Pelanggaran <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            />
          </div>

          {/* Textarea Catatan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Kronologi Kejadian</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
              placeholder="Contoh: Terlambat hadir upacara 20 menit, tidak membawa topi..."
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 shadow-md flex items-center justify-center space-x-2 text-sm"
          >
            {loading ? (
              <span>Menyimpan data...</span>
            ) : (
              <span>Simpan Pelanggaran Siswa</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ViolationForm;
