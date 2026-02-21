import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Truck, Fuel, Gauge, DollarSign,
  MoreVertical, Edit2, Trash2, Power, X,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import Pagination from '../components/ui/Pagination';
import { SearchInput, SelectFilter } from '../components/ui/Filters';
import { SkeletonTable } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { vehiclesAPI } from '../api/vehicles';
import { formatCurrency, formatNumber } from '../utils/helpers';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Available', label: 'Available' },
  { value: 'On Trip', label: 'On Trip' },
  { value: 'In Shop', label: 'In Shop' },
  { value: 'Out of Service', label: 'Out of Service' },
  { value: 'Retired', label: 'Retired' },
];

const EMPTY_FORM = {
  name: '', model: '', licensePlate: '', maxLoadCapacity: '', odometer: '', acquisitionCost: '',
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await vehiclesAPI.getAll(params);
      setVehicles(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  // reset page on filter change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (v) => {
    setEditing(v);
    setForm({
      name: v.name, model: v.model, licensePlate: v.licensePlate,
      maxLoadCapacity: v.maxLoadCapacity ?? '', odometer: v.odometer ?? '',
      acquisitionCost: v.acquisitionCost ?? '',
    });
    setModalOpen(true);
    setActionMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        maxLoadCapacity: Number(form.maxLoadCapacity) || 0,
        odometer: Number(form.odometer) || 0,
        acquisitionCost: Number(form.acquisitionCost) || 0,
      };
      if (editing) {
        await vehiclesAPI.update(editing._id, payload);
        toast.success('Vehicle updated');
      } else {
        await vehiclesAPI.create(payload);
        toast.success('Vehicle created');
      }
      setModalOpen(false);
      fetchVehicles();
    } catch {
      // handled
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await vehiclesAPI.remove(deleteTarget._id);
      toast.success('Vehicle deleted');
      setDeleteTarget(null);
      fetchVehicles();
    } catch {
      // handled
    }
  };

  const handleRetire = async (v) => {
    try {
      await vehiclesAPI.retire(v._id);
      toast.success('Vehicle retired');
      setActionMenu(null);
      fetchVehicles();
    } catch {
      // handled
    }
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <PageHeader title="Vehicles" subtitle="Manage your fleet vehicles">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-surface-900 text-white text-sm font-semibold rounded-xl hover:bg-surface-800 transition-colors">
          <Plus size={16} /> Add Vehicle
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search vehicles..." />
        <SelectFilter value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : vehicles.length === 0 ? (
        <EmptyState title="No vehicles found" message="Add your first vehicle to get started" actionLabel="Add Vehicle" onAction={openCreate} />
      ) : (
        <motion.div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-surface-400 border-b border-surface-100">
                  <th className="px-6 py-3.5 font-medium">Vehicle</th>
                  <th className="px-6 py-3.5 font-medium">Plate</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium text-right">Load (kg)</th>
                  <th className="px-6 py-3.5 font-medium text-right">Odometer</th>
                  <th className="px-6 py-3.5 font-medium text-right">Cost</th>
                  <th className="px-6 py-3.5 font-medium w-12"></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v, i) => (
                  <motion.tr
                    key={v._id}
                    className="border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="px-6 py-3.5">
                      <div>
                        <span className="font-medium text-surface-900">{v.name}</span>
                        <span className="block text-xs text-surface-400">{v.model}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-surface-600">{v.licensePlate}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={v.status} size="sm" /></td>
                    <td className="px-6 py-3.5 text-right text-surface-600">{formatNumber(v.maxLoadCapacity)}</td>
                    <td className="px-6 py-3.5 text-right text-surface-600">{formatNumber(v.odometer)} km</td>
                    <td className="px-6 py-3.5 text-right text-surface-600">{formatCurrency(v.acquisitionCost)}</td>
                    <td className="px-6 py-3.5 relative">
                      <button onClick={() => setActionMenu(actionMenu === v._id ? null : v._id)} className="p-1 rounded-lg hover:bg-surface-100 transition-colors text-surface-400 hover:text-surface-600">
                        <MoreVertical size={16} />
                      </button>
                      <AnimatePresence>
                        {actionMenu === v._id && (
                          <motion.div
                            className="absolute right-6 top-10 z-30 bg-white rounded-xl shadow-elevated border border-surface-100 py-1 w-40"
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                          >
                            <button onClick={() => openEdit(v)} className="flex items-center gap-2 px-4 py-2 text-sm text-surface-600 hover:bg-surface-50 w-full text-left">
                              <Edit2 size={14} /> Edit
                            </button>
                            {v.status !== 'Retired' && (
                              <button onClick={() => handleRetire(v)} className="flex items-center gap-2 px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 w-full text-left">
                                <Power size={14} /> Retire
                              </button>
                            )}
                            <button onClick={() => { setDeleteTarget(v); setActionMenu(null); }} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                              <Trash2 size={14} /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-surface-100">
              <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </div>
          )}
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vehicle' : 'Add Vehicle'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Name *</label>
              <input value={form.name} onChange={(e) => setField('name', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Model *</label>
              <input value={form.model} onChange={(e) => setField('model', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">License Plate *</label>
            <input value={form.licensePlate} onChange={(e) => setField('licensePlate', e.target.value.toUpperCase())} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300 font-mono" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Max Load (kg)</label>
              <input type="number" value={form.maxLoadCapacity} onChange={(e) => setField('maxLoadCapacity', e.target.value)} className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Odometer</label>
              <input type="number" value={form.odometer} onChange={(e) => setField('odometer', e.target.value)} className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Acq. Cost ($)</label>
              <input type="number" value={form.acquisitionCost} onChange={(e) => setField('acquisitionCost', e.target.value)} className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-surface-900 text-white text-sm font-semibold rounded-xl hover:bg-surface-800 transition-colors disabled:opacity-60">
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />

      {/* Click-away for action menu */}
      {actionMenu && <div className="fixed inset-0 z-20" onClick={() => setActionMenu(null)} />}
    </div>
  );
}
