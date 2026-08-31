import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import MedicineBottleIcon from '../components/icons/MedicineBottleIcon';
import { useAuth } from '../context/AuthContext';
import * as medsApi from '../api/medications';
import MedicationTile from '../components/MedicationTile';
import AlertsPanel from '../components/AlertsPanel';
import StockChangeModal from '../components/StockChangeModal';
import CreateMedicationModal from '../components/CreateMedicationModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [stockModal, setStockModal] = useState(null); 
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  const medicationsQuery = useQuery({
    queryKey: ['medications', department],
    queryFn: () => medsApi.listMedications(department || undefined),
  });

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: medsApi.listDepartments,
  });

  const alertsQuery = useQuery({
    queryKey: ['alerts'],
    queryFn: medsApi.listAlerts,
    refetchInterval: 60_000, 
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['medications'] });
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
    queryClient.invalidateQueries({ queryKey: ['departments'] });
  }

  const withdrawMutation = useMutation({
    mutationFn: ({ id, quantity }) => medsApi.withdrawMedication(id, quantity),
    onSuccess: () => {
      invalidateAll();
      setStockModal(null);
      setActionError('');
    },
    onError: (err) => setActionError(err.response?.data?.error || 'Withdraw failed'),
  });

  const restockMutation = useMutation({
    mutationFn: ({ id, quantity }) => medsApi.restockMedication(id, quantity),
    onSuccess: () => {
      invalidateAll();
      setStockModal(null);
      setActionError('');
    },
    onError: (err) => setActionError(err.response?.data?.error || 'Add stock failed'),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => medsApi.createMedication(payload),
    onSuccess: () => {
      invalidateAll();
      setCreateOpen(false);
      setActionError('');
    },
    onError: (err) => setActionError(err.response?.data?.error || 'Create failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => medsApi.deleteMedication(id),
    onSuccess: () => {
      invalidateAll();
      setDeleteTarget(null);
      setActionError('');
    },
    onError: (err) => setActionError(err.response?.data?.error || 'Delete failed'),
  });

  const medications = medicationsQuery.data || [];
  const departments = departmentsQuery.data || [];
  const alerts = alertsQuery.data || [];

  const filteredMedications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return medications
      .filter((m) => !query || m.name.toLowerCase().includes(query))
      .filter((m) => !status || m.status === status);
  }, [medications, search, status]);

  const activeMutation = useMemo(() => {
    if (stockModal?.mode === 'withdraw') return withdrawMutation;
    if (stockModal?.mode === 'restock') return restockMutation;
    return null;
  }, [stockModal, withdrawMutation, restockMutation]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 pb-12 lg:h-screen lg:overflow-hidden lg:pb-0">
      <header className="shrink-0 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-sm">
              <MedicineBottleIcon className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-900">MediTrack</h1>
              <p className="text-xs text-slate-500">Signed in as {user?.username} ({user?.role})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => logout()}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="flex w-full flex-col gap-6 px-4 pt-6 sm:px-6 lg:min-h-0 lg:flex-1 lg:flex-row lg:px-8">
        <div className="flex flex-col lg:min-h-0 lg:flex-1">
          <div className="mb-5 shrink-0">
            <label htmlFor="name-search" className="sr-only">
              Search medications
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="name-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by medication name…"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
            <label htmlFor="dept-filter" className="text-sm font-medium text-slate-700">
              Department
            </label>
            <select
              id="dept-filter"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <label htmlFor="status-filter" className="text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="status-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All statuses</option>
              <option value="green">Green — sufficient stock</option>
              <option value="yellow">Yellow — predicted shortage</option>
              <option value="red">Red — out of stock</option>
            </select>

            <button
              onClick={() => setCreateOpen(true)}
              className="ml-auto flex items-center justify-center gap-1.5 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
            >
              <PlusIcon className="h-4 w-4" />
              New medication
            </button>
          </div>

          <div className="scroll-pane -mr-2 overflow-y-auto pb-6 pr-2 lg:min-h-0 lg:flex-1">
            {medicationsQuery.isLoading && <p className="text-sm text-slate-500">Loading medications…</p>}
            {medicationsQuery.isError && (
              <p className="text-sm text-red-600">Failed to load medications. Try refreshing.</p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredMedications.map((med) => (
                <MedicationTile
                  key={med.medicationId}
                  medication={med}
                  onWithdraw={(m) => {
                    setActionError('');
                    setStockModal({ medication: m, mode: 'withdraw' });
                  }}
                  onRestock={(m) => {
                    setActionError('');
                    setStockModal({ medication: m, mode: 'restock' });
                  }}
                  onDelete={(m) => {
                    setActionError('');
                    setDeleteTarget(m);
                  }}
                />
              ))}
            </div>

            {!medicationsQuery.isLoading && medications.length === 0 && (
              <p className="mt-6 text-sm text-slate-500">
                No medications yet. Use "New medication" to add the first one.
              </p>
            )}
            {!medicationsQuery.isLoading && medications.length > 0 && filteredMedications.length === 0 && (
              <p className="mt-6 text-sm text-slate-500">
                No medications match the current filters
                {search ? ` (search: "${search}")` : ''}.
              </p>
            )}
          </div>
        </div>

        <AlertsPanel alerts={alerts} isLoading={alertsQuery.isLoading} />
      </main>

      <StockChangeModal
        open={!!stockModal}
        onClose={() => setStockModal(null)}
        medication={stockModal?.medication}
        mode={stockModal?.mode}
        submitting={activeMutation?.isPending}
        error={actionError}
        onSubmit={(quantity) => {
          const id = stockModal.medication.medicationId;
          if (stockModal.mode === 'withdraw') {
            withdrawMutation.mutate({ id, quantity });
          } else {
            restockMutation.mutate({ id, quantity });
          }
        }}
      />

      <CreateMedicationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        submitting={createMutation.isPending}
        error={actionError}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        medication={deleteTarget}
        submitting={deleteMutation.isPending}
        error={actionError}
        onConfirm={() => deleteMutation.mutate(deleteTarget.medicationId)}
      />
    </div>
  );
}
