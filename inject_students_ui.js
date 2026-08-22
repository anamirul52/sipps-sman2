const fs = require('fs');
const path = 'frontend/src/pages/StudentsPage.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Desktop Table Header Checkbox
const desktopHeader = `                  <tr>
                    <th className="px-2 py-3 text-center w-10">
                      <input
                        type="checkbox"
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        checked={currentStudents.length > 0 && selectedIds.length === currentStudents.length}
                        onChange={handleSelectAll}
                        title="Pilih Semua"
                      />
                    </th>
                    <th className="px-2 py-3 text-center w-10">No</th>`;
code = code.replace(/                  <tr>\s*<th className="px-2 py-3 text-center w-10">No<\/th>/, desktopHeader);

// Adjust colSpan for empty states
code = code.replace(/<td colSpan="7"/g, '<td colSpan="8"');

// 2. Desktop Table Row Checkbox
// We look for:
// <tr key={s.id} className="hover:bg-zinc-100/30 transition">
//   <td className="px-2 py-3.5 text-center text-zinc-500 font-semibold">{index + 1}</td>
const desktopRow = `<tr key={s.id} className={\`transition \${selectedIds.includes(s.id) ? 'bg-indigo-50/40' : 'hover:bg-zinc-100/30'}\`}>
                    <td className="px-2 py-3.5 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        checked={selectedIds.includes(s.id)}
                        onChange={() => handleSelectOne(s.id)}
                      />
                    </td>
                    <td className="px-2 py-3.5 text-center text-zinc-500 font-semibold">{index + 1}</td>`;
code = code.replace(/<tr key=\{s\.id\} className="hover:bg-zinc-100\/30 transition">\s*<td className="px-2 py-3\.5 text-center text-zinc-500 font-semibold">\{index \+ 1\}<\/td>/, desktopRow);


// 3. Mobile Cards
// Find mobile cards container:
// {/* Mobile View: Cards */}
// <div className="md:hidden space-y-3">
//   {loading ? (
const mobileHeader = `{/* Mobile View: Cards */}
            <div className="md:hidden space-y-3">
              {currentStudents.length > 0 && !loading && (
                <div className="flex items-center gap-2 px-1 mb-1">
                  <input
                    type="checkbox"
                    id="selectAllMobile"
                    className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={selectedIds.length === currentStudents.length}
                    onChange={handleSelectAll}
                  />
                  <label htmlFor="selectAllMobile" className="text-xs font-semibold text-zinc-700 cursor-pointer">
                    Pilih Semua ({currentStudents.length})
                  </label>
                </div>
              )}
              {loading ? (`;
code = code.replace(/\{\/\* Mobile View: Cards \*\/\}\s*<div className="md:hidden space-y-3">\s*\{loading \? \(/, mobileHeader);

// 4. Mobile Card Checkbox
// <div key={s.id} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-3">
//   {/* Mobile Header: Nama & Kelas */}
//   <div className="flex items-start justify-between gap-3">
//     <div className="min-w-0">
const mobileCard = `<div key={s.id} className={\`p-4 rounded-xl border shadow-sm space-y-3 transition \${selectedIds.includes(s.id) ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white border-zinc-200'}\`}>
                    {/* Mobile Header: Nama & Kelas */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          className="mt-0.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                          checked={selectedIds.includes(s.id)}
                          onChange={() => handleSelectOne(s.id)}
                        />
                        <div className="min-w-0">`;
code = code.replace(/<div key=\{s\.id\} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-3">\s*\{\/\* Mobile Header: Nama & Kelas \*\/\}\s*<div className="flex items-start justify-between gap-3">\s*<div className="min-w-0">/, mobileCard);

// 5. Batch Delete Action Button
// Add before: <button onClick={handleExportExcel}
const actionButton = `{selectedIds.length > 0 && (
                <button
                  onClick={handleBatchDelete}
                  disabled={isDeletingBatch}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium px-4 py-2 sm:py-2.5 rounded-xl shadow-sm transition disabled:opacity-50 whitespace-nowrap"
                >
                  <Trash2 className="text-lg" />
                  <span className="hidden sm:inline">{isDeletingBatch ? 'Menghapus...' : \`Hapus (\${selectedIds.length}) Data\`}</span>
                  <span className="sm:hidden">{selectedIds.length}</span>
                </button>
              )}
              <button
                onClick={handleExportExcel}`;
code = code.replace(/<button\s*onClick=\{handleExportExcel\}/, actionButton);

fs.writeFileSync(path, code);
console.log('UI updated');
