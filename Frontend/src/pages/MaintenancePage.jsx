import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Wrench, CheckCircle, Clock, Truck,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import Pagination from '../components/ui/Pagination';
import { SkeletonTable } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { maintenanceAPI } from '../api/maintenance';
import { vehiclesAPI } from '../api/vehicles';
import { formatCurrency, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Toolbar } from '../components/ui/Filters';

const TYPE_OPTIONS = [
  { value: 'Preventive', label: 'Preventive' },
  { value: 'Corrective', label: 'Corrective' },
  { value: 'Inspection', label: 'Inspection' },
];

const STATUS_OPTIONS = [
  { value: 'false', label: 'Pending' },
  { value: 'true', label: 'Completed' },
];

const SORT_OPTIONS = [
  { value: '-date', label: 'Newest First' },
  { value: 'date', label: 'Oldest First' },
  { value: '-cost', label: 'Cost (High–Low)' },
  { value: 'cost', label: 'Cost (Low–High)' },
];

const EMPTY_FORM = { vehicle: '', type: 'Preventive', cost: '', date: '', notes: '' };

export default function MaintenancePage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [maintSearch, setMaintSearch] = useState('');
  const [sortBy, setSortBy] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.isCompleted = statusFilter;
      if (sortBy) params.sort = sortBy;
      if (maintSearch) params.search = maintSearch;
      const res = await maintenanceAPI.getAll(params);
      setLogs(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, sortBy, maintSearch]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [typeFilter, statusFilter, sortBy, maintSearch]);

  const openCreate = async () => {
    setForm(EMPTY_FORM);
    try {
      const res = await vehiclesAPI.getAll({ limit: 100 });
      setVehicles(res.data.data || []);
    } catch { /* handled */ }
    setModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await maintenanceAPI.create({
        ...form,
        cost: Number(form.cost) || 0,
      });
      toast.success('Maintenance log created');
      setModalOpen(false);
      fetchLogs();
    } catch {
      // handled
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (log) => {
    try {
      await maintenanceAPI.complete(log._id);
      toast.success('Marked as completed');
      fetchLogs();
    } catch {
      // handled
    }
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <PageHeader title="Maintenance" subtitle="Track vehicle maintenance and repairs">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-surface-900 text-white text-sm font-semibold rounded-xl hover:bg-surface-800 transition-colors">
          <Plus size={16} /> Log Maintenance
        </button>
      </PageHeader>

      {/* Toolbar */}
      <Toolbar
        search={maintSearch}
        onSearchChange={setMaintSearch}
        searchPlaceholder="Search maintenance..."
        filterOptions={STATUS_OPTIONS}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        groupOptions={TYPE_OPTIONS}
        groupValue={typeFilter}
        onGroupChange={setTypeFilter}
        sortOptions={SORT_OPTIONS}
        sortValue={sortBy}
        onSortChange={setSortBy}
      />

      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : logs.length === 0 ? (
        <EmptyState title="No maintenance logs" message="Start tracking your fleet maintenance" actionLabel="Log Maintenance" onAction={openCreate} />
      ) : (
        <motion.div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-surface-400 border-b border-surface-100">
                  <th className="px-6 py-3.5 font-medium">Vehicle</th>
                  <th className="px-6 py-3.5 font-medium">Type</th>
                  <th className="px-6 py-3.5 font-medium">Date</th>
                  <th className="px-6 py-3.5 font-medium text-right">Cost</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium">Notes</th>
                  <th className="px-6 py-3.5 font-medium w-28"></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <motion.tr
                    key={log._id}
                    className="border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-surface-400" />
                        <span className="font-medium text-surface-900">{log.vehicle?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.type === 'Preventive' ? 'bg-emerald-50 text-emerald-700' :
                        log.type === 'Corrective' ? 'bg-red-50 text-red-700' :
                        'bg-surface-100 text-surface-600'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-surface-600">{formatDate(log.date)}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-surface-900">{formatCurrency(log.cost)}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {log.isCompleted ? (
                          <><CheckCircle size={14} className="text-emerald-500" /><span className="text-xs text-emerald-600 font-medium">Done</span></>
                        ) : (
                          <><Clock size={14} className="text-brand-500" /><span className="text-xs text-brand-600 font-medium">Pending</span></>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-surface-500 text-xs max-w-[200px] truncate">{log.notes || '—'}</td>
                    <td className="px-6 py-3.5">
                      {!log.isCompleted && (
                        <button onClick={() => handleComplete(log)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                          Complete
                        </button>
                      )}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log Maintenance" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Vehicle *</label>
            <select value={form.vehicle} onChange={(e) => setField('vehicle', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300">
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Type *</label>
              <select value={form.type} onChange={(e) => setField('type', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300">
                <option value="Preventive">Preventive</option>
                <option value="Corrective">Corrective</option>
                <option value="Inspection">Inspection</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Date *</label>
              <input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Cost (₹) *</label>
              <input type="number" value={form.cost} onChange={(e) => setField('cost', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={3} className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-surface-900 text-white text-sm font-semibold rounded-xl hover:bg-surface-800 transition-colors disabled:opacity-60">
              {submitting ? 'Saving...' : 'Create Log'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
