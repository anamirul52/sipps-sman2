const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

// Fix Table 1: All Violations Modal
code = code.replace(
  `<table className="w-full text-left border-collapse text-xs table-fixed">
                        <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500 tracking-wider">
                          <tr>
                            <th className="px-2 py-3 text-center w-10">No</th>
                            <th className="px-3 py-3 w-[26%]">Nama Siswa</th>
                            <th className="px-2 py-3 text-center w-16">Kelas</th>
                            <th className="px-2 py-3 text-center w-[18%]">Total Kasus</th>
                            <th className="px-2 py-3 text-center w-[16%]">Akumulasi Poin</th>
                            <th className="px-2 py-3 text-center w-[12%]">Tanggal</th>
                            <th className="px-2 py-3 text-center w-[16%]">Aksi</th>
                          </tr>
                        </thead>`,
  `<div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs table-fixed min-w-[850px]">
                          <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500 tracking-wider">
                            <tr>
                              <th className="px-2 py-3 text-center w-10">No</th>
                              <th className="px-3 py-3 w-[24%]">Nama Siswa</th>
                              <th className="px-2 py-3 text-center w-16">Kelas</th>
                              <th className="px-2 py-3 text-center w-[15%]">Total Kasus</th>
                              <th className="px-2 py-3 text-center w-[18%]">Akumulasi Poin</th>
                              <th className="px-2 py-3 text-center w-[13%]">Tanggal</th>
                              <th className="px-2 py-3 text-center w-[180px]">Aksi</th>
                            </tr>
                          </thead>`
);

// Add the closing </div> for the first table
code = code.replace(
  `                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}`,
  `                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  </>
                )}`
);


// Fix Table 2: Needs Attention List
code = code.replace(
  `<table className="w-full text-left border-collapse text-xs table-fixed">
                      <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500">
                        <tr>
                          <th className="px-2 py-3 text-center w-10">No</th>
                          <th className="px-3 py-3 w-[35%]">Nama Siswa</th>
                          <th className="px-2 py-3 text-center w-16">Kelas</th>
                          <th className="px-2 py-3 text-center w-[25%]">Status Akumulasi Poin</th>
                          <th className="px-2 py-3 text-center w-[25%]">Aksi Tindakan</th>
                        </tr>
                      </thead>`,
  `<div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs table-fixed min-w-[700px]">
                        <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500">
                          <tr>
                            <th className="px-2 py-3 text-center w-10">No</th>
                            <th className="px-3 py-3 w-[35%]">Nama Siswa</th>
                            <th className="px-2 py-3 text-center w-16">Kelas</th>
                            <th className="px-2 py-3 text-center w-[25%]">Status Akumulasi Poin</th>
                            <th className="px-2 py-3 text-center w-[120px]">Aksi Tindakan</th>
                          </tr>
                        </thead>`
);

// Add closing </div> for Table 2
code = code.replace(
  `                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}`,
  `                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  </>
                )}`
);

fs.writeFileSync('src/components/Dashboard.jsx', code);
console.log('Tables fixed!');
