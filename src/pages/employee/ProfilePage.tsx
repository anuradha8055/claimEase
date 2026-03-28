import React from 'react';
import { PageTransition } from '../../components/layout/PageTransition';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Briefcase, 
  Calendar,
  ShieldCheck,
  IdCard,
  History
} from 'lucide-react';
import { format } from 'date-fns';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  // Mock employee data based on ER diagram
  const employeeData = {
    employee_id: 1,
    name: 'Rajesh Kumar',
    email: user?.email || 'rajesh.kumar@maharashtra.gov.in',
    phone: '+91 98765 43210',
    designation: 'Senior Administrative Officer',
    department: 'Revenue & Forest Department',
    date_of_joining: '2015-06-12',
    office_address: 'Mantralaya, Madam Cama Road, Hutatma Rajguru Square, Nariman Point, Mumbai, Maharashtra 400032',
    grade_pay: '₹6,600',
    basic_pay: '₹67,700',
    pan_number: 'ABCDE1234F',
    account_number: 'XXXX XXXX 1234',
    ifsc_code: 'SBIN0000300'
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white font-space">Employee Profile</h1>
          <p className="text-text-muted mt-2">Manage your personal and professional information</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Basic Info */}
          <div className="space-y-8">
            <GlassCard className="p-8 text-center">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-accent-purple to-accent-violet mx-auto mb-6 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-accent-purple/20">
                {employeeData.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h2 className="text-xl font-bold text-white">{employeeData.name}</h2>
              <p className="text-accent-purple font-medium text-sm mt-1">{employeeData.designation}</p>
              <div className="mt-6 pt-6 border-t border-white/5 space-y-4 text-left">
                <div className="flex items-center gap-3 text-text-secondary">
                  <Mail size={16} className="text-accent-purple" />
                  <span className="text-sm">{employeeData.email}</span>
                </div>
                <div className="flex items-center gap-3 text-text-secondary">
                  <Phone size={16} className="text-accent-purple" />
                  <span className="text-sm">{employeeData.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-text-secondary">
                  <MapPin size={16} className="text-accent-purple" />
                  <span className="text-sm line-clamp-2">{employeeData.office_address}</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck size={16} className="text-accent-green" />
                Account Security
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-muted">Role</span>
                  <span className="text-xs font-bold text-accent-purple bg-accent-purple/10 px-2 py-1 rounded-md">
                    {user?.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-muted">Last Login</span>
                  <span className="text-xs text-text-primary">Today, 10:24 AM</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right Column: Detailed Info */}
          <div className="lg:col-span-2 space-y-8">
            <GlassCard className="p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Briefcase size={20} className="text-accent-purple" />
                Employment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Department</p>
                  <p className="text-sm text-text-primary font-medium">{employeeData.department}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Employee ID</p>
                  <p className="text-sm text-text-primary font-medium">EMP-{employeeData.employee_id.toString().padStart(4, '0')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Date of Joining</p>
                  <p className="text-sm text-text-primary font-medium">{format(new Date(employeeData.date_of_joining), 'MMMM dd, yyyy')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Office Location</p>
                  <p className="text-sm text-text-primary font-medium">Mumbai HQ</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <IdCard size={20} className="text-accent-orange" />
                Financial Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Basic Pay</p>
                  <p className="text-sm text-text-primary font-medium">{employeeData.basic_pay}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Grade Pay</p>
                  <p className="text-sm text-text-primary font-medium">{employeeData.grade_pay}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">PAN Number</p>
                  <p className="text-sm text-text-primary font-medium font-mono">{employeeData.pan_number}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Bank Account</p>
                  <p className="text-sm text-text-primary font-medium font-mono">{employeeData.account_number}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <History size={20} className="text-accent-green" />
                Recent Activity
              </h3>
              <div className="space-y-4">
                {[
                  { action: 'Claim Submitted', date: '2026-03-20', details: 'Claim #CLM-2026-003 for Fracture Treatment' },
                  { action: 'Document Uploaded', date: '2026-03-19', details: 'Hospital Bill uploaded for Claim #CLM-2026-003' },
                  { action: 'Profile Updated', date: '2026-03-15', details: 'Updated contact phone number' },
                ].map((activity, i) => (
                  <div key={i} className="flex gap-4 items-start p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-accent-purple mt-2 shadow-lg shadow-accent-purple/50" />
                    <div>
                      <p className="text-sm font-bold text-white">{activity.action}</p>
                      <p className="text-xs text-text-muted mt-1">{activity.details}</p>
                      <p className="text-[10px] text-accent-purple font-bold mt-2">{format(new Date(activity.date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
