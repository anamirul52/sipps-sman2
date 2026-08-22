const fs = require('fs');
const path = 'frontend/src/pages/StudentsPage.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove the button from the top Action Bar (around line 353)
const actionBarRegex = /\{selectedIds\.length > 0 && \([\s\S]*?<span className="sm:hidden">\{selectedIds\.length\}<\/span>[\s\S]*?<\/button>\s*\)\}\s*/;
code = code.replace(actionBarRegex, '');

// 2. Add the button to Mobile 'Pilih Semua' header
const mobilePilihSemuaRegex = /<div className="flex items-center gap-2 px-1 mb-1">[\s\S]*?<label htmlFor="selectAllMobile"[\s\S]*?<\/label>\s*<\/div>/;
const newMobilePilihSemua = `<div className="flex items-center justify-between px-1 mb-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selectAllMobile"
                    className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={selectedIds.length === students.length}
                    onChange={handleSelectAll}
                  />
                  <label htmlFor="selectAllMobile" className="text-xs font-semibold text-zinc-700 cursor-pointer">
                    Pilih Semua ({students.length})
                  </label>
                </div>
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleBatchDelete}
                    disabled={isDeletingBatch}
                    className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    <Trash2 className="text-sm" />
                    <span>{isDeletingBatch ? 'Hapus...' : \`Hapus (\${selectedIds.length})\`}</span>
                  </button>
                )}
              </div>`;
code = code.replace(mobilePilihSemuaRegex, newMobilePilihSemua);

// 3. Add the button to Desktop 'Aksi' Column Header
const aksiHeaderRegex = /<th className="px-2 py-3 text-center w-32">Aksi<\/th>/;
const newAksiHeader = `<th className="px-2 py-2 text-center w-32">
                    {selectedIds.length > 0 ? (
                      <button
                        onClick={handleBatchDelete}
                        disabled={isDeletingBatch}
                        className="inline-flex items-center justify-center w-full gap-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-2 py-1.5 rounded-lg shadow-sm transition disabled:opacity-50"
                      >
                        <Trash2 className="text-[13px]" />
                        <span>{isDeletingBatch ? 'Hapus...' : \`Hapus (\${selectedIds.length})\`}</span>
                      </button>
                    ) : (
                      'Aksi'
                    )}
                  </th>`;
code = code.replace(aksiHeaderRegex, newAksiHeader);

fs.writeFileSync(path, code);
console.log('UI updated');
