import { useState } from 'react';
import Modal from './Modal';

export default function StockChangeModal({ open, onClose, medication, mode, onSubmit, submitting, error }) {
  const [quantity, setQuantity] = useState('');
  const [department, setDepartment] = useState(medication?.department || '');

  if (!medication) return null;

  const isWithdraw = mode === 'withdraw';
  const title = isWithdraw ? `Withdraw ${medication.name}` : `Add stock: ${medication.name}`;

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(Number(quantity), department);
  }

  function handleClose() {
    setQuantity('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500">Current stock: {medication.currentStock}</p>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium text-slate-700">
            Department
          </label>
          <input
            id="department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 ${
              isWithdraw ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'
            }`}
          >
            {submitting ? 'Saving…' : isWithdraw ? 'Withdraw' : 'Add stock'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
