import React, { useEffect, useState } from 'react';
import { PageTransition } from '../../components/layout/PageTransition';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency, cn } from '../../lib/utils';
import { CheckCircle, IndianRupee, FileText, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export const DDOSanctionedPage: React.FC = () => {
  const [sanctionedClaims, setSanctionedClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    const mockData = [
      { claim_id: 301, claim_number: 'CLM-2026-012', eligible_amount: 125000, date: '2026-03-20' },
      { claim_id: 302, claim_number: 'CLM-2026-015', eligible_amount: 45000, date: '2026-03-21' },
      { claim_id: 303, claim_number: 'CLM-2026-018', eligible_amount: 85000, date: '2026-03-22' },
      { claim_id: 304, claim_number: 'CLM-2026-022', eligible_amount: 210000, date: '2026-03-24' },
    ];
    setSanctionedClaims(mockData);
    setLoading(false);
  }, []);

  const totalDisbursed = sanctionedClaims.reduce((sum, c) => sum + c.eligible_amount, 0);

  const stats = [
    { label: 'Total Sanctioned', value: sanctionedClaims.length, icon: CheckCircle, color: 'text-accent-green' },
    { label: 'Total Amount', value: formatCurrency(totalDisbursed), icon: IndianRupee, color: 'text-accent-violet' },
    { label: 'This Month', value: sanctionedClaims.length, icon: TrendingUp, color: 'text-accent-blue' },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-white font-space">Sanctioned Claims</h1>
          <p className="text-text-secondary text-sm">History of claims that have been granted final sanction.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard className="p-6 flex items-center gap-4">
                <div className={cn("p-3 rounded-xl bg-white/5", stat.color)}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-bold text-white font-space">{stat.value}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
                  <th className="px-6 py-4">Claim #</th>
                  <th className="px-6 py-4">Eligible Amount</th>
                  <th className="px-6 py-4">Sanction Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sanctionedClaims.map((claim, index) => (
                  <motion.tr
                    key={claim.claim_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-accent-purple font-medium">{claim.claim_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{formatCurrency(claim.eligible_amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-text-primary">{claim.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status="PAYMENT_PROCESSED" />
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
