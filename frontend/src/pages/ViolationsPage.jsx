import { useState } from 'react';
import Layout from '../components/Layout';
import ViolationForm from '../components/ViolationForm';
import ViolationTable from '../components/ViolationTable';
import SanctionLetterModal from '../components/SanctionLetterModal';
import EditViolationModal from '../components/EditViolationModal';
import DeleteViolationModal from '../components/DeleteViolationModal';

const ViolationsPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isSanctionModalOpen, setIsSanctionModalOpen] = useState(false);
  
  // Edit & Delete State
  const [violationToEdit, setViolationToEdit] = useState(null);
  const [violationToDelete, setViolationToDelete] = useState(null);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleOpenSanctions = (studentId) => {
    setSelectedStudentId(studentId);
    setIsSanctionModalOpen(true);
  };

  const handleCloseSanctionModal = () => {
    setIsSanctionModalOpen(false);
    setSelectedStudentId(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Form Input Pelanggaran Baru */}
        <ViolationForm onSuccess={handleSuccess} />

        {/* Tabel Daftar Pelanggaran */}
        <ViolationTable 
          refreshKey={refreshKey} 
          onViewSanction={handleOpenSanctions}
          onEditViolation={(violation) => setViolationToEdit(violation)}
          onDeleteViolation={(violation) => setViolationToDelete(violation)}
        />

        {/* Modal Surat Sanksi */}
        {isSanctionModalOpen && (
          <SanctionLetterModal 
            studentId={selectedStudentId} 
            onClose={handleCloseSanctionModal} 
          />
        )}

        {/* Modal Edit Pelanggaran */}
        {violationToEdit && (
          <EditViolationModal
            violation={violationToEdit}
            onClose={() => setViolationToEdit(null)}
            onSuccess={handleSuccess}
          />
        )}

        {/* Modal Hapus Pelanggaran */}
        {violationToDelete && (
          <DeleteViolationModal
            violation={violationToDelete}
            onClose={() => setViolationToDelete(null)}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </Layout>
  );
};

export default ViolationsPage;
