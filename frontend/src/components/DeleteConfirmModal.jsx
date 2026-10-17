import Modal from './Modal';

export default function DeleteConfirmModal({ open, onClose, medication, onConfirm, submitting, error }) {
  if (!medication) return null;

  return (
    <Modal open={open} onClose={onClose} title="Delete medication">
      <p className="text-sm text-slate-600">
        Remove <span className="font-medium">{medication.name}</span> from the dashboard?
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
        >
          {submitting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </Modal>
  );
}
