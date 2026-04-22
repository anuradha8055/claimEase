import React, { useEffect, useMemo, useState } from 'react';
import { PageTransition } from '../../components/layout/PageTransition';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import * as mrs from '../../api/mrs';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  ShieldCheck,
  IdCard,
  Save
} from 'lucide-react';
import { format } from 'date-fns';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    fullName: '',
    emailAddress: '',
    employeeId: '',
    contactNo: '',
    department: '',
    designation: '',
    dateOfJoining: '',
    officeLocation: '',
    basicPay: '',
    gradePay: '',
    panNumber: '',
    bankAccount: '',
    ifscCode: '',
    lastLogin: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await mrs.getEmployeeProfile();
        setForm({
          fullName: data.fullName || '',
          emailAddress: data.emailAddress || '',
          employeeId: data.employeeId || '',
          contactNo: data.contactNo || '',
          department: data.department || '',
          designation: data.designation || '',
          dateOfJoining: data.dateOfJoining || '',
          officeLocation: data.officeLocation || '',
          basicPay: data.basicPay != null ? String(data.basicPay) : '',
          gradePay: data.gradePay != null ? String(data.gradePay) : '',
          panNumber: data.panNumber || '',
          bankAccount: data.bankAccount || '',
          ifscCode: data.ifscCode || '',
          lastLogin: data.lastLogin || '',
        });
      } catch (error) {
        console.error('Error fetching employee profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const initials = useMemo(
    () => (form.fullName || 'Employee').split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
    [form.fullName]
  );

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const pan = form.panNumber.trim();
    const ifsc = form.ifscCode.trim();
    const contact = form.contactNo.trim();
    const basicPay = form.basicPay.trim();
    const gradePay = form.gradePay.trim();

    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(pan)) {
      nextErrors.panNumber = 'PAN must be in format ABCDE1234F';
    }
    if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc)) {
      nextErrors.ifscCode = 'IFSC must be in format ABCD0123456';
    }
    if (contact && !/^\+?[0-9]{10,15}$/.test(contact)) {
      nextErrors.contactNo = 'Contact number must be 10 to 15 digits';
    }
    if (basicPay && Number(basicPay) < 0) {
      nextErrors.basicPay = 'Basic pay cannot be negative';
    }
    if (gradePay && Number(gradePay) < 0) {
      nextErrors.gradePay = 'Grade pay cannot be negative';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      setSaving(true);
      const updated = await mrs.updateEmployeeProfile({
        fullName: form.fullName.trim(),
        contactNo: form.contactNo.trim(),
        department: form.department.trim(),
        designation: form.designation.trim(),
        dateOfJoining: form.dateOfJoining.trim(),
        officeLocation: form.officeLocation.trim(),
        panNumber: form.panNumber.trim(),
        bankAccount: form.bankAccount.trim(),
        ifscCode: form.ifscCode.trim(),
        basicPay: form.basicPay ? Number(form.basicPay) : 0,
        gradePay: form.gradePay ? Number(form.gradePay) : 0,
      });

      setForm((prev) => ({
        ...prev,
        fullName: updated.fullName || '',
        contactNo: updated.contactNo || '',
        department: updated.department || '',
        designation: updated.designation || '',
        dateOfJoining: updated.dateOfJoining || '',
        officeLocation: updated.officeLocation || '',
        panNumber: updated.panNumber || '',
        bankAccount: updated.bankAccount || '',
        ifscCode: updated.ifscCode || '',
        basicPay: updated.basicPay != null ? String(updated.basicPay) : '',
        gradePay: updated.gradePay != null ? String(updated.gradePay) : '',
      }));

      toast.success('Profile saved successfully');
    } catch (error) {
      console.error('Error saving employee profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-screen">
          <div className="w-12 h-12 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
          <h1 className="text-3xl font-bold text-white font-space">Employee Profile</h1>
          <p className="text-text-muted mt-2">Manage your personal and professional information</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-purple hover:bg-accent-violet disabled:opacity-60 text-white text-sm font-bold transition-colors"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Basic Info */}
          <div className="space-y-8">
            <GlassCard className="p-8 text-center">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-accent-purple to-accent-violet mx-auto mb-6 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-accent-purple/20">
                {initials}
              </div>
              <h2 className="text-xl font-bold text-white">{form.fullName || 'Employee'}</h2>
              <p className="text-accent-purple font-medium text-sm mt-1">{form.designation || '-'}</p>
              <div className="mt-6 pt-6 border-t border-white/5 space-y-4 text-left">
                <div className="flex items-center gap-3 text-text-secondary">
                  <Mail size={16} className="text-accent-purple" />
                  <span className="text-sm">{form.emailAddress}</span>
                </div>
                <div className="flex items-center gap-3 text-text-secondary">
                  <Phone size={16} className="text-accent-purple" />
                  <span className="text-sm">{form.contactNo || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-text-secondary">
                  <MapPin size={16} className="text-accent-purple" />
                  <span className="text-sm line-clamp-2">{form.officeLocation || '-'}</span>
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
                  <span className="text-xs text-text-primary">
                    {form.lastLogin ? format(new Date(form.lastLogin), 'MMM dd, yyyy HH:mm') : '-'}
                  </span>
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
                  <input value={form.department} onChange={(e) => handleChange('department', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Employee ID</p>
                  <p className="text-sm text-text-primary font-medium">{form.employeeId || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Date of Joining</p>
                  <input value={form.dateOfJoining} onChange={(e) => handleChange('dateOfJoining', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary" placeholder="YYYY-MM-DD" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Office Location</p>
                  <input value={form.officeLocation} onChange={(e) => handleChange('officeLocation', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Full Name</p>
                  <input value={form.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Contact Number</p>
                  <input value={form.contactNo} onChange={(e) => handleChange('contactNo', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary" />
                  {errors.contactNo && <p className="text-xs text-accent-red mt-1">{errors.contactNo}</p>}
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Designation</p>
                  <input value={form.designation} onChange={(e) => handleChange('designation', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary" />
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
                  <input type="number" value={form.basicPay} onChange={(e) => handleChange('basicPay', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary" />
                  {errors.basicPay && <p className="text-xs text-accent-red mt-1">{errors.basicPay}</p>}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Grade Pay</p>
                  <input type="number" value={form.gradePay} onChange={(e) => handleChange('gradePay', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary" />
                  {errors.gradePay && <p className="text-xs text-accent-red mt-1">{errors.gradePay}</p>}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">PAN Number</p>
                  <input value={form.panNumber} onChange={(e) => handleChange('panNumber', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary font-mono" />
                  {errors.panNumber && <p className="text-xs text-accent-red mt-1">{errors.panNumber}</p>}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Bank Account</p>
                  <input value={form.bankAccount} onChange={(e) => handleChange('bankAccount', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary font-mono" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">IFSC Code</p>
                  <input value={form.ifscCode} onChange={(e) => handleChange('ifscCode', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary font-mono" />
                  {errors.ifscCode && <p className="text-xs text-accent-red mt-1">{errors.ifscCode}</p>}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
