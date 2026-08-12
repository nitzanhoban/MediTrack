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
    <div className={`flex flex-col justify-between rounded-xl border-2 p-4 shadow-sm ${styles}`}>
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{medication.name}</h3>
          <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium">
            {STATUS_LABEL[medication.status]}
          </span>
        </div>
        <p className="mt-2 text-2xl font-bold">{medication.currentStock}</p>
        <p className="text-xs opacity-80">
          {medication.department || 'No department'}
          {medication.daysRemaining !== null && ` · ~${Math.floor(medication.daysRemaining)}d remaining`}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
        <button
          onClick={() => onWithdraw(medication)}
          className="rounded-md bg-white/70 px-2 py-1 hover:bg-white"
        >
          Withdraw
        </button>
        <button
          onClick={() => onRestock(medication)}
          className="rounded-md bg-white/70 px-2 py-1 hover:bg-white"
        >
          Add stock
        </button>
        <button
          onClick={() => onDelete(medication)}
          className="rounded-md bg-white/70 px-2 py-1 hover:bg-white"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
