import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, 
  FilePlus, 
  Upload, 
  MessageCircle, 
  Inbox, 
  Stethoscope, 
  Calculator, 
  Stamp, 
  CheckCircle,
  LogOut,
  Search,
  User as UserIcon
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const toastId = toast.loading(`Searching for "${searchQuery}"...`);
    
    setTimeout(() => {
      setIsSearching(false);
      toast.success('Search results updated', { id: toastId });
    }, 1000);
  };

  const navItems = {
    EMPLOYEE: [
      { icon: LayoutDashboard, label: 'Home', path: '/employee/dashboard' },
      { icon: FilePlus, label: 'New Claim', path: '/employee/new-claim' },
      { icon: Upload, label: 'Upload Document', path: '/employee/documents' },
      { icon: MessageCircle, label: 'Queries', path: '/employee/queries' },
      { icon: UserIcon, label: 'Profile', path: '/employee/profile' },
    ],
    SCRUTINY_OFFICER: [
      { icon: Inbox, label: 'Claim Queue', path: '/scrutiny/queue' },
    ],
    MEDICAL_OFFICER: [
      { icon: Stethoscope, label: 'Medical Queue', path: '/medical/queue' },
    ],
    FINANCE_OFFICER: [
      { icon: Calculator, label: 'Finance Queue', path: '/finance/queue' },
    ],
    DDO: [
      { icon: Stamp, label: 'Sanction Queue', path: '/ddo/queue' },
      { icon: CheckCircle, label: 'Sanctioned Claims', path: '/ddo/sanctioned' },
    ],
  };

  const items = user ? navItems[user.role] : [];

  return (
    <aside className="w-[260px] fixed left-0 top-0 h-full bg-[#070621]/95 backdrop-blur-[20px] border-r border-white/5 flex flex-col z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent-purple to-accent-violet flex items-center justify-center shadow-lg shadow-accent-purple/20">
            <CheckCircle className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-space font-bold text-lg text-white leading-tight">MedReimburse</h1>
            <span className="text-[10px] text-accent-purple font-bold tracking-widest uppercase">Maharashtra Govt</span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative mb-6 group">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
            isSearching ? "text-accent-purple animate-pulse" : "text-text-muted group-focus-within:text-accent-purple"
          )} size={16} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Claim (Cmd+K)"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-text-primary focus:outline-none focus:border-accent-purple transition-colors"
          />
        </form>

        <div className="space-y-1">
          {items.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive 
                    ? 'bg-accent-purple/10 text-accent-purple border-l-2 border-accent-purple' 
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-white/5">
        <button 
          onClick={() => navigate(user?.role === 'EMPLOYEE' ? '/employee/profile' : '#')}
          className="flex items-center gap-3 mb-4 w-full text-left group"
        >
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-accent-purple to-accent-violet flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
            {user?.email[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent-purple transition-colors">{user?.email}</p>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{user?.role.replace('_', ' ')}</p>
          </div>
        </button>
        <button 
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-accent-red bg-accent-red/10 hover:bg-accent-red/20 transition-all duration-200"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
