import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Fuel, Receipt, Truck,
  IndianRupee,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { SelectFilter } from '../components/ui/Filters';
import Pagination from '../components/ui/Pagination';
import { SkeletonTable } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import KPICard from '../components/ui/KPICard';
import { expensesAPI } from '../api/expenses';
import { vehiclesAPI } from '../api/vehicles';
import { formatCurrency, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'Fuel', label: 'Fuel' },
  { value: 'Toll', label: 'Toll' },
  { value: 'Misc', label: 'Miscellaneous' },
];

const EMPTY_FORM = { vehicle: '', type: 'Fuel', cost: '', liters: '', date: '' };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (typeFilter) params.type = typeFilter;
      const res = await expensesAPI.getAll(params);
      setExpenses(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch { /* handled */ } finally { setLoading(false); }
  }, [page, typeFilter]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { setPage(1); }, [typeFilter]);

  // Summary KPIs
  const totalCost = expenses.reduce((s, e) => s + (e.cost || 0), 0);
  const fuelCost = expenses.filter((e) => e.type === 'Fuel').reduce((s, e) => s + (e.cost || 0), 0);
  const tollCost = expenses.filter((e) => e.type === 'Toll').reduce((s, e) => s + (e.cost || 0), 0);
  const totalLiters = expenses.filter((e) => e.type === 'Fuel').reduce((s, e) => s + (e.liters || 0), 0);

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
      await expensesAPI.create({
        ...form,
        cost: Number(form.cost) || 0,
        liters: Number(form.liters) || undefined,
      });
      toast.success('Expense recorded');
      setModalOpen(false);
      fetchExpenses();
    } catch { /* handled */ } finally { setSubmitting(false); }
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const typeIcon = (type) => {
    if (type === 'Fuel') return <Fuel size={14} className="text-brand-500" />;
    if (type === 'Toll') return <Receipt size={14} className="text-surface-500" />;
    return <IndianRupee size={14} className="text-surface-400" />;
  };

  const typeStyle = (type) => {
    if (type === 'Fuel') return 'bg-brand-50 text-brand-700';
    if (type === 'Toll') return 'bg-surface-100 text-surface-600';
    return 'bg-surface-50 text-surface-500';
  };

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Track fleet-related costs">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-surface-900 text-white text-sm font-semibold rounded-xl hover:bg-surface-800 transition-colors">
          <Plus size={16} /> Record Expense
        </button>
      </PageHeader>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Page Total" value={totalCost} prefix="₹" icon={IndianRupee} color="text-surface-700" bg="bg-surface-100" />
        <KPICard label="Fuel Cost" value={fuelCost} prefix="₹" icon={Fuel} color="text-brand-600" bg="bg-brand-50" />
        <KPICard label="Toll Cost" value={tollCost} prefix="₹" icon={Receipt} color="text-surface-600" bg="bg-surface-100" />
        <KPICard label="Fuel (Liters)" value={totalLiters} suffix="L" icon={Fuel} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SelectFilter value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : expenses.length === 0 ? (
        <EmptyState title="No expenses found" message="Start tracking fleet expenses" actionLabel="Record Expense" onAction={openCreate} />
      ) : (
        <motion.div className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-surface-400 border-b border-surface-100">
                  <th className="px-6 py-3.5 font-medium">Vehicle</th>
                  <th className="px-6 py-3.5 font-medium">Type</th>
                  <th className="px-6 py-3.5 font-medium">Date</th>
                  <th className="px-6 py-3.5 font-medium text-right">Liters</th>
                  <th className="px-6 py-3.5 font-medium text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, i) => (
                  <motion.tr
                    key={exp._id}
                    className="border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-surface-400" />
                        <span className="font-medium text-surface-900">{exp.vehicle?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyle(exp.type)}`}>
                        {typeIcon(exp.type)} {exp.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-surface-600">{formatDate(exp.date)}</td>
                    <td className="px-6 py-3.5 text-right text-surface-600">{exp.liters ? `${exp.liters} L` : '—'}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-surface-900">{formatCurrency(exp.cost)}</td>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Expense" size="md">
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
              <select value={form.type} onChange={(e) => setField('type', e.target.value)} className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300">
                <option value="Fuel">Fuel</option>
                <option value="Toll">Toll</option>
                <option value="Misc">Misc</option>
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
          {form.type === 'Fuel' && (
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Liters</label>
              <input type="number" value={form.liters} onChange={(e) => setField('liters', e.target.value)} className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-surface-900 text-white text-sm font-semibold rounded-xl hover:bg-surface-800 transition-colors disabled:opacity-60">
              {submitting ? 'Saving...' : 'Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
