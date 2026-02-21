import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Fuel, DollarSign, Truck, Route, Users, Gauge,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import PageHeader from '../components/ui/PageHeader';
import KPICard from '../components/ui/KPICard';
import { SkeletonCard } from '../components/ui/Skeleton';
import { analyticsAPI } from '../api/analytics';
import { formatCurrency } from '../utils/helpers';

const CHART_COLORS = {
  bar: '#292524',
  grid: '#f5f5f4',
  text: '#a8a29e',
  positive: '#059669',
  negative: '#dc2626',
};

const PIE_COLORS = ['#059669', '#ea580c', '#dc2626', '#78716c', '#292524'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-900 text-white text-xs px-3 py-2 rounded-lg shadow-elevated">
      <p className="font-medium mb-1">{label || payload[0]?.name}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-surface-300">
          {p.name}: <span className="text-white font-medium">{typeof p.value === 'number' && p.value > 100 ? formatCurrency(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analyticsAPI.getDashboard();
        setData(res.data.data);
      } catch { /* handled */ } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Fleet performance insights" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  const fleet = data?.fleet || {};
  const financials = data?.financials || {};
  const trips = data?.trips || {};
  const drivers = data?.drivers || {};

  const kpis = [
    { label: 'Total Revenue', value: financials.totalRevenue ?? 0, prefix: '$', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Net Profit', value: financials.netProfit ?? 0, prefix: '$', icon: DollarSign, color: financials.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600', bg: financials.netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
    { label: 'Completed Trips', value: trips.completedTrips ?? 0, icon: Route, color: 'text-surface-700', bg: 'bg-surface-100' },
    { label: 'Utilization Rate', value: parseFloat(fleet.utilizationRate) || 0, suffix: '%', icon: Gauge, color: 'text-brand-600', bg: 'bg-brand-50' },
  ];

  // Vehicle status pie data
  const vehicleStatusData = [
    { name: 'Available', value: fleet.availableVehicles || 0 },
    { name: 'On Trip', value: fleet.onTripVehicles || 0 },
    { name: 'In Shop', value: fleet.inShopVehicles || 0 },
    { name: 'Retired', value: fleet.retiredVehicles || 0 },
  ].filter((d) => d.value > 0);

  // Financial breakdown bar data
  const finBarData = [
    { name: 'Revenue', value: financials.totalRevenue || 0, fill: CHART_COLORS.positive },
    { name: 'Expenses', value: financials.totalExpenses || 0, fill: CHART_COLORS.negative },
    { name: 'Maintenance', value: financials.totalMaintenanceCost || 0, fill: '#ea580c' },
    { name: 'Net Profit', value: financials.netProfit || 0, fill: financials.netProfit >= 0 ? CHART_COLORS.positive : CHART_COLORS.negative },
  ];

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Fleet performance insights" />

      {/* KPIs */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        initial="hidden"
        animate="show"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
      >
        {kpis.map((k) => (
          <motion.div key={k.label} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
            <KPICard {...k} />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Financial Breakdown */}
        <motion.div
          className="bg-white rounded-2xl shadow-card border border-surface-100 p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-semibold text-surface-900 mb-1">Financial Breakdown</h3>
          <p className="text-xs text-surface-400 mb-6">Revenue vs costs overview</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={finBarData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: CHART_COLORS.text }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: CHART_COLORS.text }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Amount" radius={[6, 6, 0, 0]} maxBarSize={50}>
                {finBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Vehicle Status Distribution */}
        <motion.div
          className="bg-white rounded-2xl shadow-card border border-surface-100 p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold text-surface-900 mb-1">Fleet Distribution</h3>
          <p className="text-xs text-surface-400 mb-6">Vehicle status breakdown</p>
          {vehicleStatusData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-surface-300">No fleet data</div>
          ) : (
            <div className="flex items-center">
              <ResponsiveContainer width="60%" height={240}>
                <PieChart>
                  <Pie
                    data={vehicleStatusData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {vehicleStatusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {vehicleStatusData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-surface-500 flex-1">{d.name}</span>
                    <span className="text-xs font-bold text-surface-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-white rounded-2xl shadow-card border border-surface-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Truck size={16} className="text-surface-400" />
            <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">Fleet</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-surface-500">Total</span><span className="font-bold text-surface-900">{fleet.totalVehicles}</span></div>
            <div className="flex justify-between"><span className="text-surface-500">Active</span><span className="font-bold text-surface-900">{fleet.activeFleetCount}</span></div>
            <div className="flex justify-between"><span className="text-surface-500">Utilization</span><span className="font-bold text-brand-600">{fleet.utilizationRate}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-surface-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-surface-400" />
            <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">Drivers</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-surface-500">Total</span><span className="font-bold text-surface-900">{drivers.totalDrivers}</span></div>
            <div className="flex justify-between"><span className="text-surface-500">Available</span><span className="font-bold text-emerald-600">{drivers.availableDrivers}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-surface-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Route size={16} className="text-surface-400" />
            <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">Trips</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-surface-500">Total</span><span className="font-bold text-surface-900">{trips.totalTrips}</span></div>
            <div className="flex justify-between"><span className="text-surface-500">Completed</span><span className="font-bold text-emerald-600">{trips.completedTrips}</span></div>
            <div className="flex justify-between"><span className="text-surface-500">Active</span><span className="font-bold text-brand-600">{trips.activeTrips}</span></div>
            <div className="flex justify-between"><span className="text-surface-500">Distance</span><span className="font-bold text-surface-900">{(trips.totalDistanceKm || 0).toLocaleString()} km</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-surface-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-surface-400" />
            <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">Financials</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-surface-500">Revenue</span><span className="font-bold text-emerald-600">{formatCurrency(financials.totalRevenue)}</span></div>
            <div className="flex justify-between"><span className="text-surface-500">Expenses</span><span className="font-bold text-red-600">{formatCurrency(financials.totalExpenses)}</span></div>
            <div className="flex justify-between"><span className="text-surface-500">Maintenance</span><span className="font-bold text-brand-600">{formatCurrency(financials.totalMaintenanceCost)}</span></div>
            <div className="flex justify-between border-t border-surface-100 pt-2"><span className="text-surface-700 font-medium">Net Profit</span><span className={`font-bold ${financials.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(financials.netProfit)}</span></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
