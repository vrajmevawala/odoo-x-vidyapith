import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Truck, Users, Route, Wrench, TrendingUp, Activity,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import KPICard from '../components/ui/KPICard';
import PageHeader from '../components/ui/PageHeader';
import { SkeletonCard } from '../components/ui/Skeleton';
import { analyticsAPI } from '../api/analytics';
import { tripsAPI } from '../api/trips';
import { vehiclesAPI } from '../api/vehicles';
import { formatCurrency, formatNumber } from '../utils/helpers';

const containerV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const itemV = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, tripsRes] = await Promise.all([
          analyticsAPI.getDashboard(),
          tripsAPI.getAll({ limit: 5, sort: '-createdAt' }),
        ]);
        setMetrics(dashRes.data.data);
        setRecentTrips(tripsRes.data.data || []);
      } catch {
        // errors handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Fleet overview at a glance" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
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
    {
      label: 'Total Vehicles',
      value: fleet.totalVehicles ?? 0,
      icon: Truck,
      color: 'text-surface-700',
      bg: 'bg-surface-100',
    },
    {
      label: 'Active Drivers',
      value: drv.totalDrivers ?? 0,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Trips',
      value: trp.totalTrips ?? 0,
      icon: Route,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
    },
    {
      label: 'Revenue',
      value: fin.totalRevenue ?? 0,
      icon: TrendingUp,
      prefix: '$',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
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

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Fleet overview at a glance" />

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
            <Truck size={16} className="text-surface-400" />
            Vehicle Status
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
                    <motion.div
                      className={`h-full rounded-full ${s.dot}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Trip Status */}
        <motion.div variants={itemV} className="bg-white rounded-2xl shadow-card border border-surface-100 p-6">
          <h3 className="text-sm font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <Route size={16} className="text-surface-400" />
            Trip Status
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
                    <motion.div
                      className={`h-full rounded-full ${s.dot}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
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
        <div className="px-6 py-4 border-b border-surface-100">
          <h3 className="text-sm font-semibold text-surface-900">Recent Trips</h3>
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
                      className="border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors"
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
