import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const [search, setSearch] = useState('');
  const [stockModal, setStockModal] = useState(null); // { medication, mode: 'withdraw'|'restock' }
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
    mutationFn: ({ id, quantity, dept }) => medsApi.restockMedication(id, quantity, dept),
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
    if (!query) return medications;
    return medications.filter((m) => m.name.toLowerCase().includes(query));
  }, [medications, search]);

  const activeMutation = useMemo(() => {
    if (stockModal?.mode === 'withdraw') return withdrawMutation;
    if (stockModal?.mode === 'restock') return restockMutation;
    return null;
  }, [stockModal, withdrawMutation, restockMutation]);

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">MediTrack Dashboard</h1>
            <p className="text-xs text-slate-500">Signed in as {user?.username} ({user?.role})</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateOpen(true)}
              className="rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
            >
              New medication
            </button>
            <button
              onClick={() => logout()}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-6 flex max-w-6xl flex-col gap-6 px-4 lg:flex-row">
        <div className="flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label htmlFor="name-search" className="sr-only">
              Search medications
            </label>
            <input
              id="name-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by medication name…"
              className="w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />

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
          </div>

          {medicationsQuery.isLoading && <p className="text-sm text-slate-500">Loading medications…</p>}
          {medicationsQuery.isError && (
            <p className="text-sm text-red-600">Failed to load medications. Try refreshing.</p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
            <p className="mt-6 text-sm text-slate-500">No medications match "{search}".</p>
          )}
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
        onSubmit={(quantity, dept) => {
          const id = stockModal.medication.medicationId;
          if (stockModal.mode === 'withdraw') {
            withdrawMutation.mutate({ id, quantity });
          } else {
            restockMutation.mutate({ id, quantity, dept });
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
