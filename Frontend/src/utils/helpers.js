export const formatCurrency = (value) => {
  if (value == null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value) => {
  if (value == null) return '0';
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const statusColors = {
  Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'On Trip': 'bg-amber-50 text-amber-700 border-amber-200',
  'In Shop': 'bg-orange-50 text-orange-700 border-orange-200',
  Retired: 'bg-surface-100 text-surface-500 border-surface-200',
  'Out of Service': 'bg-red-50 text-red-700 border-red-200',
  'Off Duty': 'bg-surface-100 text-surface-500 border-surface-200',
  Suspended: 'bg-red-50 text-red-700 border-red-200',
  Draft: 'bg-surface-100 text-surface-600 border-surface-200',
  Dispatched: 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-red-50 text-red-600 border-red-200',
};

export const getStatusColor = (status) => statusColors[status] || 'bg-surface-100 text-surface-600 border-surface-200';
