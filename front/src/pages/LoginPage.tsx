import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientButton } from '../components/ui/GradientButton';
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Mock login for demo purposes as per instructions
      // In a real app, this would call POST /auth/login
      const mockToken = btoa(JSON.stringify({
        sub: 1,
        email: email,
        role: email.split('@')[0].toUpperCase().replace('OFFICER', '_OFFICER'),
        type: 'access'
      }));
      
      // Special case for scrutiny officer role mapping
      let role = email.split('@')[0].toUpperCase();
      if (role === 'SCRUTINY') role = 'SCRUTINY_OFFICER';
      if (role === 'MEDICAL') role = 'MEDICAL_OFFICER';
      if (role === 'FINANCE') role = 'FINANCE_OFFICER';

      const token = `header.${btoa(JSON.stringify({ sub: 1, email, role, type: 'access' }))}.signature`;
      
      login(token);
      toast.success('Welcome back!');
      
      if (role === 'EMPLOYEE') navigate('/employee/dashboard');
      else if (role === 'SCRUTINY_OFFICER') navigate('/scrutiny/queue');
      else if (role === 'MEDICAL_OFFICER') navigate('/medical/queue');
      else if (role === 'FINANCE_OFFICER') navigate('/finance/queue');
      else if (role === 'DDO') navigate('/ddo/queue');
      else navigate('/employee/dashboard');

    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen w-full bg-primary-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-purple/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-orange/10 blur-[120px] rounded-full" />
      <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-accent-green/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-accent-purple to-accent-violet flex items-center justify-center shadow-xl shadow-accent-purple/20 mb-4">
            <CheckCircle className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold font-space text-white mb-1">MedReimburse</h1>
          <p className="text-text-secondary font-medium">Maharashtra Government Portal</p>
        </div>

        <GlassCard className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                placeholder="name@gov.in"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                placeholder="••••••••"
              />
            </div>

            <GradientButton fullWidth loading={loading} type="submit">
              Sign In
            </GradientButton>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5">
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="flex items-center justify-between w-full text-text-secondary hover:text-text-primary transition-colors"
            >
              <span className="text-sm font-medium">Demo Accounts</span>
              {showDemo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            <AnimatePresence>
              {showDemo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 gap-2 mt-4">
                    {[
                      { role: 'Employee', email: 'employee@gov.in' },
                      { role: 'Scrutiny Officer', email: 'scrutiny@gov.in' },
                      { role: 'Medical Officer', email: 'medical@gov.in' },
                      { role: 'Finance Officer', email: 'finance@gov.in' },
                      { role: 'DDO', email: 'ddo@gov.in' },
                    ].map((demo) => (
                      <button
                        key={demo.email}
                        onClick={() => fillDemo(demo.email)}
                        className="flex items-center justify-between px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-text-secondary hover:text-text-primary transition-all"
                      >
                        <span>{demo.role}</span>
                        <span className="text-[10px] opacity-50">{demo.email}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
