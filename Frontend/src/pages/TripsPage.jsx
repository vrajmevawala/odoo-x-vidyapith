import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Send, CheckCircle2, XCircle, FileText,
  MapPin, Package, DollarSign, User, Truck,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { Toolbar } from '../components/ui/Filters';
import { tripsAPI } from '../api/trips';
import { vehiclesAPI } from '../api/vehicles';
import { driversAPI } from '../api/drivers';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

const COLUMNS = [
  { key: 'Draft', label: 'Draft', icon: FileText, color: 'bg-surface-400', lightBg: 'bg-surface-50' },
  { key: 'Dispatched', label: 'Dispatched', icon: Send, color: 'bg-brand-500', lightBg: 'bg-brand-50' },
  { key: 'Completed', label: 'Completed', icon: CheckCircle2, color: 'bg-emerald-500', lightBg: 'bg-emerald-50' },
  { key: 'Cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-500', lightBg: 'bg-red-50' },
];

const EMPTY_FORM = {
  vehicle: '', driver: '', origin: '', destination: '', distanceKm: '', cargoWeight: '', revenue: '',
};

const STATUS_FILTER_OPTIONS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Dispatched', label: 'Dispatched' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: '-revenue', label: 'Revenue (High)' },
  { value: 'revenue', label: 'Revenue (Low)' },
];

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [tripSearch, setTripSearch] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState('');
  const [tripSort, setTripSort] = useState('');

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tripsAPI.getAll({ limit: 100 });
      setTrips(res.data.data || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const loadFormOptions = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        vehiclesAPI.getAll({ limit: 100, status: 'Available' }),
        driversAPI.getAll({ limit: 100, status: 'Available' }),
      ]);
      setVehicles(vRes.data.data || []);
      setDrivers(dRes.data.data || []);
    } catch {
      // handled
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    loadFormOptions();
    setModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        distanceKm: Number(form.distanceKm) || 0,
        cargoWeight: Number(form.cargoWeight) || 0,
        revenue: Number(form.revenue) || 0,
      };
      await tripsAPI.create(payload);
      toast.success('Trip created');
      setModalOpen(false);
      fetchTrips();
    } catch {
      // handled
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatch = async (trip) => {
    try {
      await tripsAPI.dispatch(trip._id);
      toast.success('Trip dispatched');
      fetchTrips();
    } catch {
      // handled
    }
  };

  const handleComplete = async (trip) => {
    try {
      await tripsAPI.complete(trip._id);
      toast.success('Trip completed');
      fetchTrips();
    } catch {
      // handled
    }
  };

  const handleCancel = async (trip) => {
    try {
      await tripsAPI.cancel(trip._id);
      toast.success('Trip cancelled');
      fetchTrips();
    } catch {
      // handled
    }
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const filteredTrips = useMemo(() => {
    let result = trips;
    if (tripStatusFilter) {
      result = result.filter((t) => t.status === tripStatusFilter);
    }
    if (tripSearch) {
      const q = tripSearch.toLowerCase();
      result = result.filter((t) =>
        (t.origin || '').toLowerCase().includes(q) ||
        (t.destination || '').toLowerCase().includes(q) ||
        (t.vehicle?.name || '').toLowerCase().includes(q) ||
        (t.driver?.name || '').toLowerCase().includes(q)
      );
    }
    if (tripSort) {
      const desc = tripSort.startsWith('-');
      const key = desc ? tripSort.slice(1) : tripSort;
      result = [...result].sort((a, b) => {
        const av = a[key] ?? '';
        const bv = b[key] ?? '';
        if (typeof av === 'number') return desc ? bv - av : av - bv;
        return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
      });
    }
    return result;
  }, [trips, tripSearch, tripStatusFilter, tripSort]);

  const groupedTrips = COLUMNS.reduce((acc, col) => {
    acc[col.key] = filteredTrips.filter((t) => t.status === col.key);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Trips" subtitle="Kanban board — drag-free workflow">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-surface-900 text-white text-sm font-semibold rounded-xl hover:bg-surface-800 transition-colors">
          <Plus size={16} /> New Trip
        </button>
      </PageHeader>

      {/* Toolbar */}
      <Toolbar
        search={tripSearch}
        onSearchChange={setTripSearch}
        searchPlaceholder="Search trips..."
        filterOptions={STATUS_FILTER_OPTIONS}
        filterValue={tripStatusFilter}
        onFilterChange={setTripStatusFilter}
        sortOptions={SORT_OPTIONS}
        sortValue={tripSort}
        onSortChange={setTripSort}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const Icon = col.icon;
            const colTrips = groupedTrips[col.key] || [];
            return (
              <motion.div
                key={col.key}
                className="flex flex-col"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Column Header */}
                <div className={`rounded-xl px-4 py-3 mb-3 flex items-center gap-2 ${col.lightBg}`}>
                  <div className={`w-6 h-6 rounded-lg ${col.color} flex items-center justify-center`}>
                    <Icon size={13} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-surface-900">{col.label}</span>
                  <span className="ml-auto text-xs font-bold text-surface-400 bg-white px-2 py-0.5 rounded-full">{colTrips.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-2.5 flex-1 min-h-[120px]">
                  <AnimatePresence mode="popLayout">
                    {colTrips.length === 0 ? (
                      <motion.div key="empty" className="text-center py-8 text-xs text-surface-300" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        No trips
                      </motion.div>
                    ) : (
                      colTrips.map((trip) => (
                        <motion.div
                          key={trip._id}
                          layout
                          className="bg-white rounded-xl shadow-card border border-surface-100 p-4"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          {/* Route */}
                          <div className="flex items-start gap-2 mb-3">
                            <MapPin size={14} className="text-surface-400 mt-0.5 shrink-0" />
                            <div className="text-sm min-w-0">
                              <span className="font-medium text-surface-900 block truncate">{trip.origin}</span>
                              <span className="text-surface-400 text-xs">→ {trip.destination}</span>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-2 gap-2 text-xs text-surface-500 mb-3">
                            <div className="flex items-center gap-1.5">
                              <Truck size={12} className="text-surface-300" />
                              <span className="truncate">{trip.vehicle?.name || '—'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User size={12} className="text-surface-300" />
                              <span className="truncate">{trip.driver?.name || '—'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Package size={12} className="text-surface-300" />
                              <span>{trip.cargoWeight || 0} kg</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <DollarSign size={12} className="text-surface-300" />
                              <span className="font-medium text-surface-700">{formatCurrency(trip.revenue || 0)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {trip.status === 'Draft' && (
                              <>
                                <button onClick={() => handleDispatch(trip)} className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors">
                                  Dispatch
                                </button>
                                <button onClick={() => handleCancel(trip)} className="text-xs font-semibold py-1.5 px-3 rounded-lg bg-surface-50 text-surface-500 hover:bg-surface-100 transition-colors">
                                  Cancel
                                </button>
                              </>
                            )}
                            {trip.status === 'Dispatched' && (
                              <>
                                <button onClick={() => handleComplete(trip)} className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                                  Complete
                                </button>
                                <button onClick={() => handleCancel(trip)} className="text-xs font-semibold py-1.5 px-3 rounded-lg bg-surface-50 text-surface-500 hover:bg-surface-100 transition-colors">
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Trip Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Trip" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Vehicle *</label>
              <select value={form.vehicle} onChange={(e) => setField('vehicle', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300">
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Driver *</label>
              <select value={form.driver} onChange={(e) => setField('driver', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300">
                <option value="">Select driver</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Origin *</label>
              <input value={form.origin} onChange={(e) => setField('origin', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Destination *</label>
              <input value={form.destination} onChange={(e) => setField('destination', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Distance (km) *</label>
              <input type="number" value={form.distanceKm} onChange={(e) => setField('distanceKm', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Cargo (kg) *</label>
              <input type="number" value={form.cargoWeight} onChange={(e) => setField('cargoWeight', e.target.value)} required className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Revenue (₹)</label>
              <input type="number" value={form.revenue} onChange={(e) => setField('revenue', e.target.value)} className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-surface-900 text-white text-sm font-semibold rounded-xl hover:bg-surface-800 transition-colors disabled:opacity-60">
              {submitting ? 'Creating...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
