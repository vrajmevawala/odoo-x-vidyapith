import { Search, X } from 'lucide-react';

export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-300" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-surface-200 rounded-xl
          focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300
          placeholder:text-surface-300 transition-all"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-300 hover:text-surface-500">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function SelectFilter({ value, onChange, options, placeholder = 'All', label }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs font-medium text-surface-400">{label}</span>}
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2.5 text-sm bg-white border border-surface-200 rounded-xl appearance-none
          focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300
          text-surface-700 transition-all cursor-pointer min-w-[140px]"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
