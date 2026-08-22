const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/SanctionLetterModal.jsx', 'utf8');

const oldHandleDownload = `  const handleDownload = async (sanctionId, studentName) => {
    try {
      const response = await api.get(\`/sanctions/\${sanctionId}/pdf\`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', \`Surat_Peringatan_\${studentName.replace(/ /g, '_')}_\${sanctionId}.pdf\`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Surat sanksi berhasil diunduh (PDF)');
    } catch (err) {
      toast.error('Gagal mengunduh file surat');
    }
  };`;

const newHandleDownload = `  const handleDownload = async (sanctionId, studentName) => {
    // Pada mobile (terutama iOS), operasi async bisa memblokir window.open
    // Jadi kita buka window kosong dulu secara sinkron
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let newWindow = null;
    
    if (isMobile) {
      newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write('Memuat dokumen PDF...');
      }
    }

    try {
      const response = await api.get(\`/sanctions/\${sanctionId}/pdf\`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      if (isMobile && newWindow) {
        newWindow.location.href = url;
        toast.success('Surat sanksi dibuka di tab baru');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', \`Surat_Peringatan_\${studentName.replace(/ /g, '_')}_\${sanctionId}.pdf\`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        // Membersihkan memory
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
        toast.success('Surat sanksi berhasil diunduh');
      }
    } catch (err) {
      if (newWindow) newWindow.close();
      toast.error('Gagal memuat file surat');
    }
  };`;

code = code.replace(oldHandleDownload, newHandleDownload);

// Change text on the button to Buka / Unduh PDF
code = code.replace('<span>Download PDF</span>', '<span>Buka / Unduh PDF</span>');

fs.writeFileSync('frontend/src/components/SanctionLetterModal.jsx', code);
console.log('SanctionLetterModal.jsx updated');
