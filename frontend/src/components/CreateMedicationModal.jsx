import { useState } from 'react';
import Modal from './Modal';
import { MEDICATION_UNITS } from '../constants/units';

export default function CreateMedicationModal({ open, onClose, onSubmit, submitting, error }) {
  const [name, setName] = useState('');
  const [currentStock, setCurrentStock] = useState('0');
  const [unit, setUnit] = useState('');
  const [alertThresholdDays, setAlertThresholdDays] = useState('5');
  const [department, setDepartment] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      name,
      currentStock: Number(currentStock),
      unit,
      alertThresholdDays: Number(alertThresholdDays),
      department: department || undefined,
    });
  }

  function handleClose() {
    setName('');
    setCurrentStock('0');
    setUnit('');
    setAlertThresholdDays('5');
    setDepartment('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="New medication">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="med-name" className="block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="med-name"
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="med-stock" className="block text-sm font-medium text-slate-700">
              Initial stock
            </label>
            <input
              id="med-stock"
              type="number"
              min={0}
              required
              value={currentStock}
              onChange={(e) => setCurrentStock(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label htmlFor="med-unit" className="block text-sm font-medium text-slate-700">
              Unit
            </label>
            <select
              id="med-unit"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="" disabled>
                Select a unit…
              </option>
              {MEDICATION_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="med-threshold" className="block text-sm font-medium text-slate-700">
            Alert threshold (days)
          </label>
          <input
            id="med-threshold"
            type="number"
            min={1}
            required
            value={alertThresholdDays}
            onChange={(e) => setAlertThresholdDays(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div>
          <label htmlFor="med-department" className="block text-sm font-medium text-slate-700">
            Department
          </label>
          <input
            id="med-department"
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
            className="rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
