import { MinusCircleIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

const STATUS_STYLES = {
  green: 'bg-status-greenBg border-status-green text-green-900',
  yellow: 'bg-status-yellowBg border-status-yellow text-yellow-900',
  red: 'bg-status-redBg border-status-red text-red-900',
};

const STATUS_LABEL = {
  green: 'Sufficient stock',
  yellow: 'Predicted shortage',
  red: 'Out of stock',
};

export default function MedicationTile({ medication, onWithdraw, onRestock, onDelete }) {
  const styles = STATUS_STYLES[medication.status] || STATUS_STYLES.green;

  return (
    <div className={`flex min-h-56 w-full flex-col justify-between rounded-xl border-2 p-4 shadow-sm ${styles}`}>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-2xl font-semibold leading-tight break-words">{medication.name}</h3>
          <span className="shrink-0 rounded-full bg-white/60 px-3 py-1 text-sm font-medium text-center">
            {STATUS_LABEL[medication.status]}
          </span>
        </div>
        <p className="mt-2 text-5xl font-bold">{medication.currentStock}</p>
        <p className="truncate text-base opacity-80">
          {medication.department || 'No department'}
          {medication.daysRemaining !== null && ` · ~${Math.floor(medication.daysRemaining)}d remaining`}
        </p>
      </div>

      <div className="mt-4 flex justify-between gap-2 text-sm font-medium">
        <button
          onClick={() => onWithdraw(medication)}
          className="flex items-center justify-center gap-1.5 rounded-md bg-white/70 px-3 py-2 hover:bg-white"
        >
          <MinusCircleIcon className="h-5 w-5" />
          Withdraw
        </button>
        <button
          onClick={() => onRestock(medication)}
          className="flex items-center justify-center gap-1.5 rounded-md bg-white/70 px-3 py-2 hover:bg-white"
        >
          <PlusCircleIcon className="h-5 w-5" />
          Add stock
        </button>
        <button
          onClick={() => onDelete(medication)}
          className="flex items-center justify-center gap-1.5 rounded-md bg-white/70 px-3 py-2 hover:bg-white"
        >
          <TrashIcon className="h-5 w-5" />
          Delete
        </button>
      </div>
    </div>
  );
}
