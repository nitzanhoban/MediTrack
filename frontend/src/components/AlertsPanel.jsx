const DOT = { red: 'bg-status-red', yellow: 'bg-status-yellow' };

export default function AlertsPanel({ alerts, isLoading }) {
  return (
    <aside className="flex w-full shrink-0 flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:w-72">
      <h2 className="shrink-0 text-sm font-semibold text-slate-900">RESTOCK ALERTS</h2>

      <div className="scroll-pane mt-4 max-h-72 space-y-2 overflow-y-auto">
        {isLoading && <p className="text-xs text-slate-400">Loading…</p>}
        {!isLoading && alerts.length === 0 && (
          <p className="text-xs text-slate-400">No active shortage alerts.</p>
        )}
        {alerts.map((a) => (
          <div key={a.medicationId} className="flex items-start gap-2 rounded-lg border border-slate-100 p-2">
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${DOT[a.status]}`} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{a.name}</p>
              <p className="text-sm text-slate-500">
                {a.status === 'red'
                  ? 'Out of stock'
                  : a.daysRemaining !== null
                  ? `~${Math.floor(a.daysRemaining)} days remaining`
                  : 'Below threshold'}
                {a.department ? ` · ${a.department}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
