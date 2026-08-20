import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { 
  HiSearch, 
  HiCheck, 
  HiX, 
  HiChevronDown, 
  HiExclamationCircle, 
  HiSparkles,
  HiTrash
} from 'react-icons/hi';

const ViolationForm = ({ onSuccess }) => {
  // Siswa State
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const studentDropdownRef = useRef(null);
  
  // Kategori Pelanggaran Multi-Select State
  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const categoryDropdownRef = useRef(null);
  
  // Form Field State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch initial categories & students
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
        setShowStudentDropdown(true);
      } catch (err) {
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, allStudents]);

  // Tutup dropdowns saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target)) {
        setShowStudentDropdown(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchQuery(student.name);
    setShowStudentDropdown(false);
  };

  const handleClearSelectedStudent = () => {
    setSelectedStudent(null);
    setSearchQuery('');
    setStudents(allStudents);
  };

  // Toggle Category Checkbox
  const handleToggleCategory = (catId) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(catId)) {
        return prev.filter(id => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  // Remove individual category tag
  const handleRemoveCategory = (catId, e) => {
    e.stopPropagation();
    setSelectedCategoryIds(prev => prev.filter(id => id !== catId));
  };

  // Hitung total poin dari kategori yang dipilih
  const selectedCategoriesList = categories.filter(c => selectedCategoryIds.includes(c.id));
  const totalSelectedPoints = selectedCategoriesList.reduce((sum, c) => sum + (c.point_deduction || 0), 0);

  // Filter kategori berdasarkan input pencarian
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
    String(c.point_deduction).includes(categorySearch)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('Silakan pilih siswa dari daftar terlebih dahulu');
      return;
    }
    if (selectedCategoryIds.length === 0) {
      toast.error('Silakan pilih minimal satu jenis pelanggaran');
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
        category_ids: selectedCategoryIds,
        violation_date: date,
        note: notes
      });

      const { data } = response.data;
      let message = `✅ Berhasil mencatat ${selectedCategoryIds.length} pelanggaran (+${totalSelectedPoints} poin)!`;
      if (data.sanctions_created && data.sanctions_created.length > 0) {
        const sanctionNames = data.sanctions_created.map(s => s.status).join(', ');
        message += ` ⚠️ Sanksi Terpicu: ${sanctionNames}`;
      }
      toast.success(message, { duration: 6000 });

      // Reset form
      handleClearSelectedStudent();
      setSelectedCategoryIds([]);
      setCategorySearch('');
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
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-800">
            Input Pelanggaran Baru
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Pilih siswa dan centang satu atau beberapa bentuk pelanggaran yang dilakukan
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          
          {/* 1. Pencarian Siswa */}
          <div className="relative" ref={studentDropdownRef}>
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
                  setShowStudentDropdown(true);
                }}
                onFocus={() => setShowStudentDropdown(true)}
                placeholder="Ketik nama atau NIPD siswa..."
                className={`w-full rounded-xl border px-4 py-2.5 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm ${
                  selectedStudent ? 'border-green-500 bg-green-50/30' : 'border-gray-300'
                }`}
              />
              
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {selectedStudent ? (
                  <button
                    type="button"
                    onClick={handleClearSelectedStudent}
                    className="text-gray-400 hover:text-red-500 p-1"
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
              <div className="mt-1.5 flex items-center text-xs text-green-700 font-medium bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-200">
                <HiCheck className="mr-1 text-green-600 text-sm flex-shrink-0" />
                <span className="truncate">
                  <strong>{selectedStudent.name}</strong> (NIPD: {selectedStudent.nipd || selectedStudent.nisn || '-'}) &bull; Kelas: {selectedStudent.class_name || '-'} &bull; Akumulasi Saat Ini: <strong>{selectedStudent.total_points || 0} Poin</strong>
                </span>
              </div>
            )}
            
            {/* Student Dropdown list */}
            {showStudentDropdown && (
              <div className="absolute z-30 w-full mt-1 bg-white rounded-xl shadow-2xl max-h-60 overflow-y-auto border border-gray-200 divide-y divide-gray-100 animate-in fade-in">
                <div className="px-3 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider sticky top-0 flex justify-between items-center z-10 border-b border-gray-100">
                  <span>Daftar Siswa ({students.length})</span>
                  {loadingStudents && <span className="text-indigo-600 animate-pulse font-normal">Mencari...</span>}
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

          {/* 2. Kategori Pelanggaran (MULTI-SELECT CHECKBOX DROPDOWN) */}
          <div className="relative" ref={categoryDropdownRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Kategori Pelanggaran <span className="text-red-500">*</span>
              </label>
              {selectedCategoryIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryIds([])}
                  className="text-[11px] text-red-600 hover:text-red-800 font-medium flex items-center gap-0.5"
                >
                  <HiTrash className="text-xs" /> Reset Pilihan
                </button>
              )}
            </div>

            {/* Custom Multi-select Trigger Box */}
            <div
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className={`w-full min-h-[42px] rounded-xl border px-3.5 py-2 cursor-pointer transition flex items-center justify-between text-sm bg-white ${
                selectedCategoryIds.length > 0 
                  ? 'border-indigo-500 ring-1 ring-indigo-500/20' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex-1 flex flex-wrap gap-1.5 items-center mr-2">
                {selectedCategoryIds.length === 0 ? (
                  <span className="text-gray-400 text-xs sm:text-sm">
                    -- Klik untuk memilih satu / beberapa pelanggaran (29 Kategori) --
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-600 text-white shadow-2xs">
                      {selectedCategoryIds.length} Pelanggaran Dipilih
                    </span>
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      +{totalSelectedPoints} Poin
                    </span>
                  </>
                )}
              </div>
              <HiChevronDown className={`text-gray-400 text-lg transition transform flex-shrink-0 ${showCategoryDropdown ? 'rotate-180 text-indigo-600' : ''}`} />
            </div>

            {/* Category Multi-Select Dropdown Content */}
            {showCategoryDropdown && (
              <div className="absolute z-30 w-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-80 flex flex-col overflow-hidden animate-in fade-in">
                {/* Search Bar inside dropdown */}
                <div className="p-2.5 bg-gray-50 border-b border-gray-200 sticky top-0 z-10 flex items-center gap-2">
                  <div className="relative flex-1">
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Cari nama pelanggaran / poin..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCategoryDropdown(false);
                    }}
                    className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex-shrink-0 shadow-2xs"
                  >
                    Selesai
                  </button>
                </div>

                {/* Categories List with Checkboxes */}
                <div className="overflow-y-auto divide-y divide-gray-100 flex-1">
                  {filteredCategories.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      Tidak ada kategori yang cocok dengan "{categorySearch}"
                    </div>
                  ) : (
                    filteredCategories.map((cat, idx) => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          onClick={() => handleToggleCategory(cat.id)}
                          className={`px-3.5 py-2.5 hover:bg-indigo-50/60 cursor-pointer transition flex items-start gap-3 select-none ${
                            isSelected ? 'bg-indigo-50/80 font-medium' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <div className="pt-0.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent onClick
                              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>

                          {/* Detail Pelanggaran */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-gray-900 leading-snug">
                                {idx + 1}. {cat.name}
                              </span>
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap flex-shrink-0">
                                +{cat.point_deduction} Poin
                              </span>
                            </div>
                            {cat.penalty_description && (
                              <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1 italic">
                                {cat.penalty_description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Dropdown Summary Footer */}
                <div className="p-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Terpilih: <strong>{selectedCategoryIds.length}</strong> pelanggaran
                  </span>
                  <span className="font-bold text-red-600">
                    Total: +{totalSelectedPoints} Poin
                  </span>
                </div>
              </div>
            )}

            {/* List Tag Pelanggaran yang Dipilih */}
            {selectedCategoriesList.length > 0 && (
              <div className="mt-2 space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Daftar pelanggaran yang akan dicatat:</span>
                  <span className="font-semibold text-indigo-700">Total Akumulasi: +{totalSelectedPoints} Poin</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-indigo-50/40 rounded-xl border border-indigo-100">
                  {selectedCategoriesList.map(c => (
                    <span 
                      key={c.id}
                      className="inline-flex items-center gap-1.5 bg-white border border-indigo-200 text-gray-800 text-xs px-2.5 py-1 rounded-lg shadow-2xs"
                    >
                      <span className="font-semibold text-red-600 font-mono">+{c.point_deduction}p</span>
                      <span className="truncate max-w-[220px]">{c.name}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveCategory(c.id, e)}
                        className="text-gray-400 hover:text-red-600 ml-0.5 p-0.5 rounded-full hover:bg-gray-100"
                        title="Hapus pilihan ini"
                      >
                        <HiX className="text-xs" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Input Tanggal Pelanggaran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Pelanggaran <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm bg-white"
            />
          </div>

          {/* 4. Textarea Catatan / Kronologi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan / Kronologi Kejadian (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
              placeholder="Contoh: Terlambat 15 menit dan tidak menggunakan kelengkapan seragam..."
            ></textarea>
          </div>
        </div>

        {/* Footer Action & Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 text-center sm:text-left">
            {selectedCategoryIds.length > 0 ? (
              <span className="text-indigo-900 font-semibold flex items-center gap-1">
                <HiSparkles className="text-indigo-600 text-sm" />
                {selectedCategoryIds.length} bentuk pelanggaran akan dicatat sekaligus untuk {selectedStudent ? selectedStudent.name : 'siswa terpilih'}.
              </span>
            ) : (
              <span>Pilih minimal 1 bentuk pelanggaran sebelum menyimpan.</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || selectedCategoryIds.length === 0 || !selectedStudent}
            className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center justify-center space-x-2 text-sm"
          >
            {loading ? (
              <span>Menyimpan {selectedCategoryIds.length} Pelanggaran...</span>
            ) : (
              <span>Simpan Pelanggaran Siswa ({selectedCategoryIds.length})</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ViolationForm;
