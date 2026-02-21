import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Truck, Users, Route, Wrench, TrendingUp, Activity,
  ArrowUpRight, ArrowDownRight, Plus, Package, AlertTriangle,
  Calendar, ChevronRight, Filter, DollarSign,
} from 'lucide-react';
import KPICard from '../components/ui/KPICard';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import { SelectFilter } from '../components/ui/Filters';
import { SkeletonCard } from '../components/ui/Skeleton';
import { analyticsAPI } from '../api/analytics';
import { tripsAPI } from '../api/trips';
import { maintenanceAPI } from '../api/maintenance';
import { formatCurrency, formatDate } from '../utils/helpers';

const containerV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const itemV = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const TIME_RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
];

const TRIP_STATUS_FILTER = [
  { value: '', label: 'All Trips' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Dispatched', label: 'Dispatched' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

// Safely ensure a value is an array
function ensureArray(val) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') return Object.values(val);
  return [];
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [tripStatusFilter, setTripStatusFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { limit: 5, sort: '-createdAt' };
        if (tripStatusFilter) params.status = tripStatusFilter;

        const [dashRes, tripsRes, maintRes] = await Promise.all([
          analyticsAPI.getDashboard({ range: timeRange }),
          tripsAPI.getAll(params),
          maintenanceAPI.getAll({ limit: 5, sort: '-scheduledDate' }).catch(() => ({ data: { data: [] } })),
        ]);

        setMetrics(dashRes.data?.data ?? dashRes.data ?? {});

        const tripsData = tripsRes.data?.data ?? tripsRes.data ?? [];
        setRecentTrips(ensureArray(tripsData));

        const maintData = maintRes.data?.data ?? maintRes.data ?? [];
        setMaintenanceAlerts(ensureArray(maintData));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timeRange, tripStatusFilter]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Fleet overview at a glance" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const fleet = metrics?.fleet || {};
  const drv = metrics?.drivers || {};
  const trp = metrics?.trips || {};
  const fin = metrics?.financials || {};

  const kpi = [
    { label: 'Total Vehicles', value: fleet.totalVehicles ?? 0, icon: Truck, color: 'text-surface-700', bg: 'bg-surface-100' },
    { label: 'Active Drivers', value: drv.totalDrivers ?? 0, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Trips', value: trp.totalTrips ?? 0, icon: Route, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Revenue', value: fin.totalRevenue ?? 0, icon: TrendingUp, prefix: '₹', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const statusCards = [
    { label: 'Available', value: fleet.availableVehicles ?? 0, dot: 'bg-emerald-500' },
    { label: 'On Trip', value: fleet.onTripVehicles ?? 0, dot: 'bg-brand-500' },
    { label: 'In Shop', value: fleet.inShopVehicles ?? 0, dot: 'bg-red-500' },
    { label: 'Retired', value: fleet.retiredVehicles ?? 0, dot: 'bg-surface-400' },
  ];

  const tripStatusCards = [
    { label: 'Completed', value: trp.completedTrips ?? 0, dot: 'bg-emerald-500' },
    { label: 'Active', value: trp.activeTrips ?? 0, dot: 'bg-brand-500' },
  ];

  // Pending cargo = Draft trips
  const pendingCargo = recentTrips.filter((t) => t.status === 'Draft');

  // Maintenance alerts
  const overdueCount = maintenanceAlerts.filter((m) =>
    m.status === 'Overdue' || (m.scheduledDate && new Date(m.scheduledDate) < new Date() && m.status !== 'Completed')
  ).length;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Fleet overview at a glance">
        <div className="flex items-center gap-2">
          <SelectFilter value={timeRange} onChange={setTimeRange} options={TIME_RANGE_OPTIONS} />
          <button
            onClick={() => navigate('/trips?action=create')}
            className="flex items-center gap-2 px-4 py-2 bg-surface-900 text-white text-sm font-semibold rounded-xl hover:bg-surface-800 transition-colors"
          >
            <Route size={15} /> New Trip
          </button>
          <button
            onClick={() => navigate('/vehicles?action=create')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-surface-700 text-sm font-semibold rounded-xl border border-surface-200 hover:bg-surface-50 transition-colors"
          >
            <Truck size={15} /> New Vehicle
          </button>
        </div>
      </PageHeader>

      {/* KPI Row */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={containerV}
        initial="hidden"
        animate="show"
      >
        {kpi.map((k) => (
          <motion.div key={k.label} variants={itemV}>
            <KPICard {...k} />
          </motion.div>
        ))}
      </motion.div>

      {/* Alert Cards Row */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
        variants={containerV}
        initial="hidden"
        animate="show"
      >
        {/* Maintenance Alerts Card */}
        <motion.div
          variants={itemV}
          className="bg-white rounded-2xl shadow-card border border-surface-100 p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/maintenance')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${overdueCount > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                <Wrench size={18} className={overdueCount > 0 ? 'text-red-600' : 'text-emerald-600'} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-surface-900">Maintenance Alerts</h3>
                <p className="text-xs text-surface-400">{maintenanceAlerts.length} upcoming</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-surface-300" />
          </div>
          {overdueCount > 0 ? (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-100">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-xs font-medium text-red-700">{overdueCount} overdue service{overdueCount > 1 ? 's' : ''}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <Activity size={14} className="text-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">All vehicles serviced on time</span>
            </div>
          )}
          {maintenanceAlerts.slice(0, 2).map((m) => (
            <div key={m._id} className="flex items-center justify-between mt-2 text-xs">
              <span className="text-surface-600 truncate flex-1">{m.vehicle?.name || 'Vehicle'} — {m.type || 'Service'}</span>
              <span className="text-surface-400 ml-2">{m.scheduledDate ? formatDate(m.scheduledDate) : '—'}</span>
            </div>
          ))}
        </motion.div>

        {/* Pending Cargo Card */}
        <motion.div
          variants={itemV}
          className="bg-white rounded-2xl shadow-card border border-surface-100 p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/trips')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pendingCargo.length > 0 ? 'bg-brand-50' : 'bg-surface-100'}`}>
                <Package size={18} className={pendingCargo.length > 0 ? 'text-brand-600' : 'text-surface-500'} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-surface-900">Pending Cargo</h3>
                <p className="text-xs text-surface-400">{pendingCargo.length} draft trip{pendingCargo.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-surface-300" />
          </div>
          {pendingCargo.length > 0 ? (
            <div className="space-y-2">
              {pendingCargo.slice(0, 3).map((trip) => (
                <div key={trip._id} className="flex items-center justify-between p-2 rounded-lg bg-brand-50/50 text-xs">
                  <div className="flex items-center gap-1.5 text-surface-700 truncate flex-1">
                    <span className="font-medium">{trip.origin}</span>
                    <span className="text-surface-300">→</span>
                    <span>{trip.destination}</span>
                  </div>
                  {trip.revenue ? (
                    <span className="text-brand-700 font-medium ml-2">{formatCurrency(trip.revenue)}</span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-50 border border-surface-100">
              <span className="text-xs text-surface-400">No pending cargo — all trips dispatched</span>
            </div>
          )}
        </motion.div>

        {/* Financial Summary Card */}
        <motion.div
          variants={itemV}
          className="bg-white rounded-2xl shadow-card border border-surface-100 p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/expenses')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign size={18} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-surface-900">Financials</h3>
                <p className="text-xs text-surface-400">Revenue & expenses</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-surface-300" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50">
              <span className="text-xs text-surface-600 flex items-center gap-1.5">
                <ArrowUpRight size={13} className="text-emerald-500" /> Revenue
              </span>
              <span className="text-sm font-bold text-emerald-700">{formatCurrency(fin.totalRevenue ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/50">
              <span className="text-xs text-surface-600 flex items-center gap-1.5">
                <ArrowDownRight size={13} className="text-red-500" /> Expenses
              </span>
              <span className="text-sm font-bold text-red-700">{formatCurrency(fin.totalExpenses ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-50 border border-surface-100">
              <span className="text-xs font-medium text-surface-600">Net Profit</span>
              <span className={`text-sm font-bold ${(fin.totalRevenue ?? 0) - (fin.totalExpenses ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatCurrency((fin.totalRevenue ?? 0) - (fin.totalExpenses ?? 0))}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Status Breakdowns */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8"
        variants={containerV}
        initial="hidden"
        animate="show"
      >
        {/* Vehicle Status */}
        <motion.div variants={itemV} className="bg-white rounded-2xl shadow-card border border-surface-100 p-6">
          <h3 className="text-sm font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <Truck size={16} className="text-surface-400" /> Vehicle Status
          </h3>
          <div className="space-y-3">
            {statusCards.map((s) => {
              const total = statusCards.reduce((a, b) => a + b.value, 0);
              const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                  <span className="text-sm text-surface-600 flex-1">{s.label}</span>
                  <span className="text-sm font-semibold text-surface-900">{s.value}</span>
                  <div className="w-20 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                    <motion.div className={`h-full rounded-full ${s.dot}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Trip Status */}
        <motion.div variants={itemV} className="bg-white rounded-2xl shadow-card border border-surface-100 p-6">
          <h3 className="text-sm font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <Route size={16} className="text-surface-400" /> Trip Status
          </h3>
          <div className="space-y-3">
            {tripStatusCards.map((s) => {
              const total = tripStatusCards.reduce((a, b) => a + b.value, 0);
              const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                  <span className="text-sm text-surface-600 flex-1">{s.label}</span>
                  <span className="text-sm font-semibold text-surface-900">{s.value}</span>
                  <div className="w-20 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                    <motion.div className={`h-full rounded-full ${s.dot}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Trips Table */}
      <motion.div
        className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-surface-900">Recent Trips</h3>
          <div className="flex items-center gap-2">
            <SelectFilter value={tripStatusFilter} onChange={setTripStatusFilter} options={TRIP_STATUS_FILTER} />
            <button onClick={() => navigate('/trips')} className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View All <ChevronRight size={13} />
            </button>
          </div>
        </div>
        {recentTrips.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-surface-400">No trips found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-surface-400 border-b border-surface-50">
                  <th className="px-6 py-3 font-medium">Route</th>
                  <th className="px-6 py-3 font-medium">Vehicle</th>
                  <th className="px-6 py-3 font-medium">Driver</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((trip, i) => {
                  const statusColor = {
                    Draft: 'bg-surface-100 text-surface-600',
                    Dispatched: 'bg-brand-50 text-brand-700',
                    Completed: 'bg-emerald-50 text-emerald-700',
                    Cancelled: 'bg-red-50 text-red-700',
                  }[trip.status] || 'bg-surface-100 text-surface-600';

                  return (
                    <motion.tr
                      key={trip._id}
                      className="border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/trips`)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                    >
                      <td className="px-6 py-3.5">
                        <span className="font-medium text-surface-900">{trip.origin}</span>
                        <span className="text-surface-300 mx-1.5">→</span>
                        <span className="text-surface-600">{trip.destination}</span>
                      </td>
                      <td className="px-6 py-3.5 text-surface-600">{trip.vehicle?.name || '—'}</td>
                      <td className="px-6 py-3.5 text-surface-600">{trip.driver?.name || '—'}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium text-surface-900">
                        {trip.revenue ? formatCurrency(trip.revenue) : '—'}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}