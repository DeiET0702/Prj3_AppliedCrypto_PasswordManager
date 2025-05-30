import Swal from 'sweetalert2';
import '../styles/ConfirmDelete.css';

export async function ConfirmDelete(item) {
  const result = await Swal.fire({
    title: `Delete "${item.domain}"?`,
    text: 'Are you sure you want to delete this item? This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    backdrop: true,
    customClass: {
      popup: 'confirm-delete-popup',
      title: 'confirm-delete-title',
      htmlContainer: 'confirm-delete-content',
      confirmButton: 'confirm-delete-confirm-button',
      cancelButton: 'confirm-delete-cancel-button',
    },
    buttonsStyling: false,
  });

  return result.isConfirmed;
}
