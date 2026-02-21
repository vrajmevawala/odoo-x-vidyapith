import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Users, Shield, Calendar, MoreVertical, Edit2, AlertTriangle, TrendingUp,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import Pagination from '../components/ui/Pagination';
import { Toolbar } from '../components/ui/Filters';
import { SkeletonTable } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { driversAPI } from '../api/drivers';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'Available', label: 'Available' },
  { value: 'On Trip', label: 'On Trip' },
  { value: 'Off Duty', label: 'Off Duty' },
  { value: 'Suspended', label: 'Suspended' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: '-name', label: 'Name (Z–A)' },
  { value: '-safetyScore', label: 'Safety (High–Low)' },
  { value: 'safetyScore', label: 'Safety (Low–High)' },
];

const PERFORMANCE_FILTER_OPTIONS = [
  { value: 'Excellent', label: 'Excellent' },
  { value: 'Good', label: 'Good' },
  { value: 'Average', label: 'Average' },
  { value: 'Below Average', label: 'Below Average' },
  { value: 'Poor', label: 'Poor' },
];

const PERFORMANCE_OPTIONS = [
  { value: 'Excellent', label: 'Excellent' },
  { value: 'Good', label: 'Good' },
  { value: 'Average', label: 'Average' },
  { value: 'Below Average', label: 'Below Average' },
  { value: 'Poor', label: 'Poor' },
];

const EMPTY_FORM = {
  name: '', email: '', phone: '', licenseNumber: '', licenseExpiryDate: '', licenseCategory: 'C', performance: 'Good',
};

export default function DriversPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('fleet_manager');
  const canChangeStatus = hasRole('fleet_manager', 'safety_officer');
  const showActions = canManage || canChangeStatus;

  const [drivers, setDrivers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [perfFilter, setPerfFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (perfFilter) params.performance = perfFilter;
      if (sortBy) params.sort = sortBy;
      const res = await driversAPI.getAll(params);
      const data = res.data?.data ?? res.data ?? [];
      setDrivers(Array.isArray(data) ? data : []);
      setPagination(res.data?.pagination || {});
    } catch (err) {
      console.error('Drivers fetch error:', err);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, perfFilter, sortBy]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);
  useEffect(() => { setPage(1); }, [search, statusFilter, perfFilter, sortBy]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({
      name: d.name, email: d.email, phone: d.phone || '',
      licenseNumber: d.licenseNumber, licenseExpiryDate: d.licenseExpiryDate?.split('T')[0] || '',
      licenseCategory: d.licenseCategory || 'C', performance: d.performance || 'Good',
    });
    setModalOpen(true);
    setActionMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await driversAPI.update(editing._id, form);
        toast.success('Driver updated');
      } else {
        await driversAPI.create(form);
        toast.success('Driver created');
      }
      setModalOpen(false);
      fetchDrivers();
    } catch (err) {
      console.error('Driver save error:', err);
      toast.error(editing ? 'Failed to update driver' : 'Failed to create driver');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (driver, status) => {
    try {
      await driversAPI.updateStatus(driver._id, status);
      toast.success(`Driver set to ${status}`);
      setActionMenu(null);
      fetchDrivers();
    } catch (err) {
      console.error('Status change error:', err);
      toast.error('Failed to update status');
    }
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const getSafetyColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-brand-600 bg-brand-50';
    return 'text-red-600 bg-red-50';
  };

  const getPerformanceColor = (perf) => {
    switch (perf) {
      case 'Excellent': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Good': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Average': return 'text-brand-700 bg-brand-50 border-brand-200';
      case 'Below Average': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'Poor': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-surface-600 bg-surface-50 border-surface-200';
    }
  };

  const getPerformanceIcon = (perf) => {
    switch (perf) {
      case 'Excellent': return '★';
      case 'Good': return '●';
      case 'Average': return '◐';
      case 'Below Average': return '◔';
      case 'Poor': return '○';
      default: return '—';
    }
  };

  const isExpired = (date) => date && new Date(date) < new Date();
  const isExpiringSoon = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 30;
  };

  return (
    <div>
      <PageHeader title="Drivers" subtitle="Manage driver roster and compliance">
        {canManage && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-surface-900 text-white text-sm font-semibold rounded-xl hover:bg-surface-800 transition-colors">
            <Plus size={16} /> Add Driver
          </button>
        )}
      </PageHeader>

      {/* Toolbar */}
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search drivers..."
        filterOptions={STATUS_OPTIONS}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        groupOptions={PERFORMANCE_FILTER_OPTIONS}
        groupValue={perfFilter}
        onGroupChange={setPerfFilter}
        sortOptions={SORT_OPTIONS}
        sortValue={sortBy}
        onSortChange={setSortBy}
      />

      {loading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : drivers.length === 0 ? (
        <EmptyState title="No drivers found" message="Add your first driver to get started" actionLabel={canManage ? "Add Driver" : undefined} onAction={canManage ? openCreate : undefined} />
      ) : (
        <motion.div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-surface-400 border-b border-surface-100">
                  <th className="px-6 py-3.5 font-medium">Driver</th>
                  <th className="px-6 py-3.5 font-medium">License</th>
                  <th className="px-6 py-3.5 font-medium">Expiry</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium text-center">Safety</th>
                  <th className="px-6 py-3.5 font-medium text-center">Performance</th>
                  {showActions && <th className="px-6 py-3.5 font-medium w-12"></th>}
                </tr>
              </thead>
              <tbody>
                {drivers.map((d, i) => (
                  <motion.tr
                    key={d._id}
                    className="border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-xs font-bold text-surface-600">
                          {d.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-surface-900 block">{d.name}</span>
                          <span className="text-xs text-surface-400">{d.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs text-surface-600">{d.licenseNumber}</span>
                      <span className="block text-xs text-surface-400">Cat {d.licenseCategory}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {isExpired(d.licenseExpiryDate) && <AlertTriangle size={13} className="text-red-500" />}
                        {isExpiringSoon(d.licenseExpiryDate) && <AlertTriangle size={13} className="text-brand-500" />}
                        <span className={`text-sm ${isExpired(d.licenseExpiryDate) ? 'text-red-600 font-medium' : isExpiringSoon(d.licenseExpiryDate) ? 'text-brand-600' : 'text-surface-600'}`}>
                          {d.licenseExpiryDate ? formatDate(d.licenseExpiryDate) : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5"><StatusBadge status={d.status} size="sm" /></td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${getSafetyColor(d.safetyScore)}`}>
                        {d.safetyScore ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPerformanceColor(d.performance)}`}>
                        <span>{getPerformanceIcon(d.performance)}</span>
                        {d.performance || '—'}
                      </span>
                    </td>
                    {showActions && (
                      <td className="px-6 py-3.5 relative">
                        <button onClick={() => setActionMenu(actionMenu === d._id ? null : d._id)} className="p-1 rounded-lg hover:bg-surface-100 transition-colors text-surface-400 hover:text-surface-600">
                          <MoreVertical size={16} />
                        </button>
                        <AnimatePresence>
                          {actionMenu === d._id && (
                            <motion.div
                              className="absolute right-6 top-10 z-30 bg-white rounded-xl shadow-elevated border border-surface-100 py-1 w-44"
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                            >
                              {canManage && (
                                <button onClick={() => openEdit(d)} className="flex items-center gap-2 px-4 py-2 text-sm text-surface-600 hover:bg-surface-50 w-full text-left">
                                  <Edit2 size={14} /> Edit
                                </button>
                              )}
                              {canChangeStatus && d.status !== 'Suspended' && (
                                <button onClick={() => handleStatusChange(d, 'Suspended')} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                                  <Shield size={14} /> Suspend
                                </button>
                              )}
                              {canChangeStatus && d.status === 'Suspended' && (
                                <button onClick={() => handleStatusChange(d, 'Available')} className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 w-full text-left">
                                  <Shield size={14} /> Activate
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    )}
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Driver' : 'Add Driver'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Full Name *</label>
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">License # *</label>
              <input value={form.licenseNumber} onChange={(e) => setField('licenseNumber', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Expiry Date *</label>
              <input type="date" value={form.licenseExpiryDate} onChange={(e) => setField('licenseExpiryDate', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Category</label>
              <select value={form.licenseCategory} onChange={(e) => setField('licenseCategory', e.target.value)} className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </div>
          </div>
          {/* Performance Field */}
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">
              <span className="flex items-center gap-1.5">
                <TrendingUp size={14} /> Performance Rating
              </span>
            </label>
            <select value={form.performance} onChange={(e) => setField('performance', e.target.value)} className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300">
              {PERFORMANCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-surface-400 mt-1">Rate the driver's overall performance</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-surface-900 text-white text-sm font-semibold rounded-xl hover:bg-surface-800 transition-colors disabled:opacity-60">
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {actionMenu && <div className="fixed inset-0 z-20" onClick={() => setActionMenu(null)} />}
    </div>
  );
}