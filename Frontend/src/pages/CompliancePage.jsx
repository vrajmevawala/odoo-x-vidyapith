import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert, AlertTriangle, Clock, Users, Truck,
  ChevronRight, Shield,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { SkeletonCard } from '../components/ui/Skeleton';
import { complianceAPI } from '../api/compliance';
import { formatDate } from '../utils/helpers';

const containerV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemV = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function CompliancePage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await complianceAPI.getReport();
        setReport(res.data.data);
      } catch { /* handled */ } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Compliance" subtitle="Fleet compliance & safety overview" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const expired = report?.expiredLicenses || [];
  const expiring = report?.expiringLicenses || [];
  const lowSafety = report?.lowSafetyScores || [];
  const highMileage = report?.highMileageVehicles || [];

  const sections = [
    {
      key: 'expired',
      title: 'Expired Licenses',
      subtitle: 'Drivers with expired licenses — immediate action required',
      icon: ShieldAlert,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      badge: expired.length,
      badgeColor: 'bg-red-500',
      items: expired,
      renderItem: (d) => (
        <div className="flex items-center justify-between py-3 px-4 hover:bg-red-50/50 transition-colors rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600">
              {d.name?.charAt(0)}
            </div>
            <div>
              <span className="text-sm font-medium text-surface-900 block">{d.name}</span>
              <span className="text-xs text-surface-400">License: {d.licenseNumber}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-red-600 block">Expired</span>
            <span className="text-xs text-surface-400">{formatDate(d.licenseExpiryDate)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'expiring',
      title: 'Expiring Soon',
      subtitle: 'Licenses expiring within 30 days',
      icon: Clock,
      iconBg: 'bg-brand-50',
      iconColor: 'text-brand-600',
      badge: expiring.length,
      badgeColor: 'bg-brand-500',
      items: expiring,
      renderItem: (d) => (
        <div className="flex items-center justify-between py-3 px-4 hover:bg-brand-50/50 transition-colors rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600">
              {d.name?.charAt(0)}
            </div>
            <div>
              <span className="text-sm font-medium text-surface-900 block">{d.name}</span>
              <span className="text-xs text-surface-400">License: {d.licenseNumber}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-brand-600 block">Expiring</span>
            <span className="text-xs text-surface-400">{formatDate(d.licenseExpiryDate)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'safety',
      title: 'Low Safety Scores',
      subtitle: 'Drivers with safety scores below 70',
      icon: AlertTriangle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      badge: lowSafety.length,
      badgeColor: 'bg-red-500',
      items: lowSafety,
      renderItem: (d) => (
        <div className="flex items-center justify-between py-3 px-4 hover:bg-surface-50 transition-colors rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-xs font-bold text-surface-600">
              {d.name?.charAt(0)}
            </div>
            <div>
              <span className="text-sm font-medium text-surface-900 block">{d.name}</span>
              <span className="text-xs text-surface-400">{d.email}</span>
            </div>
          </div>
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
            d.safetyScore < 50 ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-700'
          }`}>
            {d.safetyScore}
          </span>
        </div>
      ),
    },
    {
      key: 'mileage',
      title: 'High Mileage Vehicles',
      subtitle: 'Vehicles exceeding mileage thresholds',
      icon: Truck,
      iconBg: 'bg-surface-100',
      iconColor: 'text-surface-600',
      badge: highMileage.length,
      badgeColor: 'bg-surface-500',
      items: highMileage,
      renderItem: (v) => (
        <div className="flex items-center justify-between py-3 px-4 hover:bg-surface-50 transition-colors rounded-xl">
          <div className="flex items-center gap-3">
            <Truck size={16} className="text-surface-400" />
            <div>
              <span className="text-sm font-medium text-surface-900 block">{v.name}</span>
              <span className="text-xs text-surface-400">{v.licensePlate}</span>
            </div>
          </div>
          <span className="text-sm font-semibold text-surface-700">{(v.odometer || 0).toLocaleString()} km</span>
        </div>
      ),
    },
  ];

  const totalIssues = expired.length + expiring.length + lowSafety.length + highMileage.length;

  return (
    <div>
      <PageHeader title="Compliance" subtitle="Fleet compliance & safety overview" />

      {/* Summary Banner */}
      <motion.div
        className={`rounded-2xl p-5 mb-6 flex items-center gap-4 ${
          totalIssues === 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'
        }`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          totalIssues === 0 ? 'bg-emerald-100' : 'bg-red-100'
        }`}>
          <Shield size={22} className={totalIssues === 0 ? 'text-emerald-600' : 'text-red-600'} />
        </div>
        <div>
          <h3 className={`text-base font-bold ${totalIssues === 0 ? 'text-emerald-900' : 'text-red-900'}`}>
            {totalIssues === 0 ? 'All Clear' : `${totalIssues} Compliance Issue${totalIssues > 1 ? 's' : ''} Found`}
          </h3>
          <p className={`text-sm ${totalIssues === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {totalIssues === 0
              ? 'Your fleet is fully compliant. No issues detected.'
              : 'Review the issues below and take necessary actions.'}
          </p>
        </div>
      </motion.div>

      {/* Sections */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        variants={containerV}
        initial="hidden"
        animate="show"
      >
        {sections.map((section) => (
          <motion.div
            key={section.key}
            variants={itemV}
            className="bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden"
          >
            {/* Section Header */}
            <div className="px-5 py-4 border-b border-surface-50 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${section.iconBg} flex items-center justify-center`}>
                <section.icon size={18} className={section.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-surface-900">{section.title}</h3>
                <p className="text-xs text-surface-400 truncate">{section.subtitle}</p>
              </div>
              <span className={`${section.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center`}>
                {section.badge}
              </span>
            </div>

            {/* Section Body */}
            <div className="p-2 max-h-[320px] overflow-y-auto">
              {section.items.length === 0 ? (
                <div className="text-center py-8 text-xs text-surface-300">No issues</div>
              ) : (
                <div className="space-y-0.5">
                  {section.items.map((item, i) => (
                    <div key={item._id || i}>{section.renderItem(item)}</div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
