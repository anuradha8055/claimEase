import React from 'react';
import { differenceInDays } from 'date-fns';
import { cn } from '../../lib/utils';
import { Flame, AlertTriangle } from 'lucide-react';

interface SLABadgeProps {
  updatedAt: string;
}

export const SLABadge: React.FC<SLABadgeProps> = ({ updatedAt }) => {
  const days = differenceInDays(new Date(), new Date(updatedAt));

  if (days <= 2) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green text-[10px] font-bold border border-accent-green/20">
        Fresh
      </span>
    );
  }

  if (days <= 4) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber text-[10px] font-bold border border-accent-amber/20">
        {days}d
      </span>
    );
  }

  if (days <= 6) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-accent-orange/10 text-accent-orange text-[10px] font-bold border border-accent-orange/20 flex items-center gap-1">
        {days}d <AlertTriangle size={10} />
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red text-[10px] font-bold border border-accent-red/20 flex items-center gap-1 animate-pulse">
      {days}d <Flame size={10} />
    </span>
  );
};
