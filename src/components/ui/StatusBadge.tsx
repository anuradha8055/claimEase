import React from 'react';
import { ClaimStatus } from '../../types';
import { cn } from '../../lib/utils';
import { 
  FileText, 
  Send, 
  CheckCircle2, 
  Stethoscope, 
  Calculator, 
  Stamp, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Clock
} from 'lucide-react';

interface StatusBadgeProps {
  status: ClaimStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config: Record<ClaimStatus, { label: string; color: string; icon: any; pulse?: boolean; shimmer?: boolean }> = {
    DRAFT: { label: 'DRAFT', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: FileText },
    SUBMITTED: { label: 'SUBMITTED', color: 'bg-accent-purple/20 text-accent-purple border-accent-purple/30', icon: Send },
    SCRUTINY_PENDING: { label: 'SCRUTINY PENDING', color: 'bg-accent-amber/20 text-accent-amber border-accent-amber/30', icon: Clock },
    SCRUTINY_APPROVED: { label: 'SCRUTINY APPROVED', color: 'bg-accent-amber/20 text-accent-amber border-accent-amber/30', icon: CheckCircle2 },
    MEDICAL_PENDING: { label: 'MEDICAL PENDING', color: 'bg-accent-green/20 text-accent-green border-accent-green/30', icon: Clock },
    MEDICAL_APPROVED: { label: 'MEDICAL APPROVED', color: 'bg-accent-green/20 text-accent-green border-accent-green/30', icon: Stethoscope },
    FINANCE_PENDING: { label: 'FINANCE PENDING', color: 'bg-accent-blue/20 text-accent-blue border-accent-blue/30', icon: Clock },
    FINANCE_APPROVED: { label: 'FINANCE APPROVED', color: 'bg-accent-blue/20 text-accent-blue border-accent-blue/30', icon: Calculator },
    DDO_PENDING: { label: 'DDO PENDING', color: 'bg-accent-violet/20 text-accent-violet border-accent-violet/30', icon: Clock },
    DDO_SANCTIONED: { label: 'DDO SANCTIONED', color: 'bg-accent-violet/20 text-accent-violet border-accent-violet/30', icon: Stamp },
    PAYMENT_PROCESSED: { label: 'PAYMENT PROCESSED', color: 'bg-accent-green/20 text-accent-green border-accent-green/30', icon: CheckCircle, shimmer: true, pulse: true },
    QUERY_RAISED: { label: 'QUERY RAISED', color: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30', icon: AlertCircle, pulse: true },
    REJECTED: { label: 'REJECTED', color: 'bg-accent-red/20 text-accent-red border-accent-red/30', icon: XCircle },
  };

  const { label, color, icon: Icon, pulse, shimmer } = config[status];

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border tracking-wider',
      color,
      pulse && 'animate-pulse-orange',
      shimmer && 'animate-shimmer',
      className
    )}>
      <Icon size={12} />
      {label}
    </div>
  );
};
