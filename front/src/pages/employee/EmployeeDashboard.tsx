import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { PageTransition } from '../../components/layout/PageTransition';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SLABadge } from '../../components/ui/SLABadge';
import { GradientButton } from '../../components/ui/GradientButton';
import { formatCurrency, cn } from '../../lib/utils';
import { Claim } from '../../types';
import { 
  FileText, 
  Clock, 
  IndianRupee, 
  AlertCircle, 
  ChevronRight,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { data, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import * as mrs from '../../api/mrs';



export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSlaBanner, setShowSlaBanner] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        const data = await mrs.getEmployeeClaims();
        setClaims(data);
      } catch (error) {
        console.error('Error fetching claims:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);
  
//calculations for dashboard stats
  const stats = [
    { label: 'Total Claims', value: claims.length, icon: FileText, color: 'text-accent-purple' },
    { label: 'In Progress', value: claims.filter(c => c.claim_status !== 'PAYMENT_PROCESSED' && c.claim_status !== 'REJECTED').length, icon: Clock, color: 'text-accent-amber' },
    { label: 'Payment Received', value: claims.filter(c => c.claim_status === 'PAYMENT_PROCESSED').length, icon: IndianRupee, color: 'text-accent-green' },
    { label: 'Pending Queries', value: claims.filter(c => c.claim_status === 'QUERY_RAISED').length, icon: AlertCircle, color: 'text-accent-orange' },
  ];

  const staleClaimsCount = claims.filter(c => 
    c.claim_status !== 'PAYMENT_PROCESSED' && 
    c.claim_status !== 'REJECTED' && 
    differenceInDays(new Date(), new Date(c.last_updated_timestamp)) >= 5
  ).length;

  //loading state UI
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div 
          className="w-16 h-16 border-4 border-accent-purple border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }


  return (
    <PageTransition>
      <div className="space-y-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-white">Welcome back, {user?.email}</h1>
          <p className="text-text-secondary flex items-center gap-2">
            <Calendar size={16} />
            {format(new Date(), 'EEEE, MMMM do yyyy')}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="flex items-center gap-4 p-5">
                <div className={cn('p-3 rounded-xl bg-white/5', stat.color)}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{stat.label}</p>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-2xl font-bold font-space text-white"
                  >
                    {stat.value}
                  </motion.p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {showSlaBanner && staleClaimsCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="bg-linear-to-r from-accent-orange/20 to-accent-amber/10 border border-accent-orange/30 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-orange/20 rounded-lg text-accent-orange">
                    <AlertTriangle size={20} />
                  </div>
                  <p className="text-sm text-text-primary">
                    <span className="font-bold">SLA Alert:</span> You have <span className="font-bold text-accent-orange">{staleClaimsCount}</span> claims that have been idle for more than 5 days.
                  </p>
                </div>
                <button 
                  onClick={() => setShowSlaBanner(false)}
                  className="text-text-muted hover:text-text-primary transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <GlassCard className="overflow-hidden p-0">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-bold font-space text-white">Recent Claims</h2>
            <Link to="/employee/new-claim">
              <GradientButton className="text-sm px-4 py-2">New Claim</GradientButton>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
                  <th className="px-6 py-4">Claim #</th>
              
                  <th className="px-6 py-4">Diagnosis</th> 
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Idle</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {claims.map((claim, index) => (
                  <motion.tr
                    key={claim.claim_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-accent-purple font-medium">{claim.claim_number}</span>
                    </td>
                    {/* <td className="px-6 py-4">
                      <p className="text-sm text-text-primary">Hosp ID: {claim.hospital_id}</p>
                      <p className="text-xs text-text-muted truncate max-w-[150px]">{claim.diagnosis}</p>
                    </td> */}
                    
                    {/* change */}
                    <td className="px-6 py-4">
  {/* showing diagnosis instead of hospital */}
  <p className="text-sm text-text-primary">{claim.diagnosis}</p>
</td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-text-primary">{format(new Date(claim.admission_date), 'MMM dd')}</p>
                      <p className="text-[10px] text-text-muted">to {format(new Date(claim.discharge_date), 'MMM dd, yyyy')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{formatCurrency(claim.total_bill_amount)}</p>
                      {claim.eligible_reimbursement_amount && (
                        <p className="text-[10px] text-accent-green font-bold">Eligible: {formatCurrency(claim.eligible_reimbursement_amount)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={claim.claim_status} />
                    </td>
                    <td className="px-6 py-4">
                      <SLABadge updatedAt={claim.last_updated_timestamp} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/employee/claims/${claim.claim_id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-accent-purple hover:text-accent-violet transition-colors"
                      >
                        View <ChevronRight size={14} />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  );
};
