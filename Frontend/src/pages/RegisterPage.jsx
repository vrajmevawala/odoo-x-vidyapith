import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = [
  { value: 'fleet_manager', label: 'Fleet Manager' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'safety_officer', label: 'Safety Officer' },
  { value: 'financial_analyst', label: 'Financial Analyst' },
];

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await authAPI.register({ name, email, password, role });
      toast.success('Account created! Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-surface-900 rounded-xl flex items-center justify-center">
            <Truck size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-surface-900 tracking-tight">FleetFlow</span>
        </div>

        <motion.div
          className="bg-white rounded-2xl border border-surface-200 p-8 shadow-sm"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <div className="mb-6">
            <h1 className="text-xl font-bold text-surface-900">Create account</h1>
            <p className="text-sm text-surface-400 mt-1">Fill in the details to register</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 text-sm bg-surface-50 border border-surface-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300 focus:bg-white
                  placeholder:text-surface-300 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 text-sm bg-surface-50 border border-surface-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300 focus:bg-white
                  placeholder:text-surface-300 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 text-sm bg-surface-50 border border-surface-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300 focus:bg-white
                    placeholder:text-surface-300 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300 hover:text-surface-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-surface-50 border border-surface-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-surface-900/10 focus:border-surface-300 focus:bg-white
                  text-surface-700 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Select a role</option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-surface-900 text-white text-sm font-medium rounded-xl
                hover:bg-surface-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                transition-all mt-2"
            >
              {loading ? 'Creating account…' : 'Register'}
            </button>
          </form>

          <p className="text-center text-sm text-surface-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-surface-900 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}