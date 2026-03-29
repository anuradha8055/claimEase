import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageTransition } from '../../components/layout/PageTransition';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SLABadge } from '../../components/ui/SLABadge';
import { GradientButton } from '../../components/ui/GradientButton';
import { formatCurrency, cn } from '../../lib/utils';
import { Claim, UserRole } from '../../types';
import { 
  RefreshCw, 
  Inbox, 
  AlertTriangle, 
  ChevronRight,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export const OfficerQueue: React.FC = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOverdue, setShowOverdue] = useState(true);

  const roleTitles: Record<UserRole, string> = {
    EMPLOYEE: 'Employee',
    SCRUTINY_OFFICER: 'Scrutiny Officer',
    MEDICAL_OFFICER: 'Medical Officer',
    FINANCE_OFFICER: 'Finance Officer',
    DDO: 'DDO',
  };

  const rolePrefix: Record<UserRole, string> = {
    EMPLOYEE: '',
    SCRUTINY_OFFICER: 'scrutiny',
    MEDICAL_OFFICER: 'medical',
    FINANCE_OFFICER: 'finance',
    DDO: 'ddo',
  };

  useEffect(() => {
    // Mock data
    const mockClaims: Claim[] = [
      {
        claim_id: 201,
        employee_id: 10,
        hospital_id: 601,
        claim_number: 'CLM-2026-045',
        // patient_name: 'Rahul Sharma',   // ✅ ADD THIS
        admission_date: '2026-03-01',
        discharge_date: '2026-03-05',
        diagnosis: 'Cardiac Procedure',
        total_bill_amount: 185000,
        eligible_reimbursement_amount: null,
        claim_status: 'SUBMITTED',
        current_workflow_stage: 'SUBMITTED',
        submission_timestamp: '2026-03-06T10:00:00Z',
        last_updated_timestamp: '2026-03-15T10:00:00Z', // 10 days idle
      },
      {
        claim_id: 202,
        employee_id: 11,
        hospital_id: 602,
        claim_number: 'CLM-2026-048',
        // patient_name: 'Sneha Patil',   // ✅ ADD THIS
        admission_date: '2026-03-10',
        discharge_date: '2026-03-12',
        diagnosis: 'Maternity Care',
        total_bill_amount: 55000,
        eligible_reimbursement_amount: null,
        claim_status: 'SUBMITTED',
        current_workflow_stage: 'SUBMITTED',
        submission_timestamp: '2026-03-13T10:00:00Z',
        last_updated_timestamp: '2026-03-23T10:00:00Z', // 2 days idle
      }
    ];
    setClaims(mockClaims);
    setLoading(false);
  }, []);

  const overdueClaims = claims.filter(c => differenceInDays(new Date(), new Date(c.last_updated_timestamp)) >= 5);
  const regularClaims = claims.filter(c => differenceInDays(new Date(), new Date(c.last_updated_timestamp)) < 5);

  const calculateUrgency = (updatedAt: string) => {
    const days = differenceInDays(new Date(), new Date(updatedAt));
    return Math.min(days * 10, 100);
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white font-space">{roleTitles[user?.role || 'EMPLOYEE']} Queue</h1>
            <p className="text-text-secondary text-sm">Claims awaiting your review and approval.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-text-primary font-bold text-sm">
              {claims.length} Pending
            </div>
            <button 
              onClick={() => setLoading(true)}
              className="p-2 rounded-xl bg-white/5 text-text-secondary hover:text-text-primary transition-all hover:rotate-180 duration-500"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </header>

        {/* SLA Priority Section */}
        <div className="space-y-4">
          <button 
            onClick={() => setShowOverdue(!showOverdue)}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-2xl transition-all",
              overdueClaims.length > 0 
                ? "bg-linear-to-r from-accent-red/20 to-accent-orange/10 border border-accent-red/30" 
                : "bg-accent-green/10 border border-accent-green/20"
            )}
          >
            <div className="flex items-center gap-3">
              {overdueClaims.length > 0 ? (
                <div className="p-2 bg-accent-red/20 rounded-lg text-accent-red">
                  <AlertTriangle size={20} />
                </div>
              ) : (
                <div className="p-2 bg-accent-green/20 rounded-lg text-accent-green">
                  <Clock size={20} />
                </div>
              )}
              <span className="font-bold text-sm text-text-primary">
                {overdueClaims.length > 0 
                  ? `⚠ Overdue — ${overdueClaims.length} Claims Need Immediate Attention` 
                  : '✓ All claims are within SLA'}
              </span>
            </div>
            {overdueClaims.length > 0 && (
              showOverdue ? <ChevronUp size={20} /> : <ChevronDown size={20} />
            )}
          </button>

          <AnimatePresence>
            {showOverdue && overdueClaims.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
              >
                {overdueClaims.map((claim) => (
                  <GlassCard key={claim.claim_id} className="p-5 border-l-4 border-l-accent-red">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs font-mono text-accent-purple font-bold">{claim.claim_number}</p>
                        <p className="text-sm font-bold text-white mt-1">
                          {differenceInDays(new Date(), new Date(claim.last_updated_timestamp))} days idle 🔥
                        </p>
                      </div>
                      <Link to={`/${rolePrefix[user?.role || 'EMPLOYEE']}/review/${claim.claim_id}`}>
                        <GradientButton className="text-[10px] px-3 py-1.5">Review Now</GradientButton>
                      </Link>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        <span>Urgency</span>
                        <span>{calculateUrgency(claim.last_updated_timestamp)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${calculateUrgency(claim.last_updated_timestamp)}%` }}
                          className="h-full bg-linear-to-r from-accent-orange to-accent-red"
                        />
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Queue Table */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
                  <th className="px-6 py-4">Claim #</th>
                  <th className="px-6 py-4">Patient Name</th> {/* ✅ NEW */}
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Hospital</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">⏱ Days in Queue</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {claims.map((claim, index) => (
                  <motion.tr
                    key={claim.claim_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-accent-purple font-medium">{claim.claim_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-primary font-medium">
                        {claim.patient_name}
                        </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-text-primary">EMP-{claim.employee_id}</p>
                      <p className="text-[10px] text-text-muted">ID: {claim.employee_id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-primary">Hosp-{claim.hospital_id}</p>
                      <p className="text-[10px] text-text-muted truncate max-w-[120px]">{claim.diagnosis}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{formatCurrency(claim.total_bill_amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={claim.claim_status} />
                    </td>
                    <td className="px-6 py-4">
                      <SLABadge updatedAt={claim.last_updated_timestamp} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/${rolePrefix[user?.role || 'EMPLOYEE']}/review/${claim.claim_id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-accent-purple hover:text-accent-violet transition-colors"
                      >
                        Review <ChevronRight size={14} />
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