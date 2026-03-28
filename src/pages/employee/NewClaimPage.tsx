
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../../components/layout/PageTransition';
import { GlassCard } from '../../components/ui/GlassCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { cn, formatCurrency } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Hospital, 
  Calendar, 
  IndianRupee, 
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Info,
  User
} from 'lucide-react';
import { differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

export const NewClaimPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    // PATIENT
    patient_name: '',
    relation: '',
    birth_date: '',
    gender: '',
    diagnosis: '',

    // HOSPITAL
    hospital_name: '',
    hospital_address: '',
    doctor_name: '',
    doctor_qualification: '',
    treatment: '',
    admission_date: '',
    discharge_date: '',

    // FINANCIAL
    total_bill_amount: '',
  });

  const duration = formData.admission_date && formData.discharge_date 
    ? differenceInDays(new Date(formData.discharge_date), new Date(formData.admission_date))
    : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (Number(formData.total_bill_amount) <= 0 && status === 'SUBMITTED') {
      toast.error('Please enter a valid bill amount');
      return;
    }

    toast.loading(status === 'DRAFT' ? 'Saving draft...' : 'Submitting claim...', { id: 'claim-action' });
    
    // Mock API call
    setTimeout(() => {
      toast.success(status === 'DRAFT' ? 'Draft saved successfully' : 'Claim submitted successfully', { id: 'claim-action' });
      navigate('/employee/dashboard');
    }, 1500);
  };

  const steps = [
    { id: 1, title: 'Patient', icon: User },
    { id: 2, title: 'Hospital', icon: Hospital },
    { id: 3, title: 'Financial', icon: IndianRupee },
    { id: 4, title: 'Review', icon: CheckCircle2 },
  ];

  // Common Input Style
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all";
  const labelClass = "text-xs font-bold text-text-muted uppercase tracking-widest";

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-white">New Reimbursement Claim</h1>
        </header>

        {/* Step Indicator */}
        <div className="relative flex justify-between items-center px-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-white/5 -z-10" />
          <motion.div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-accent-purple -z-10"
            initial={{ width: '0%' }}
            animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                step >= s.id ? 'bg-accent-purple border-accent-purple text-white' : 'bg-secondary-bg border-white/10 text-text-muted'
              )}>
                {step > s.id ? <CheckCircle2 size={20} /> : <s.icon size={20} />}
              </div>
              <span className={cn(
                'text-[10px] font-bold uppercase tracking-wider',
                step >= s.id ? 'text-accent-purple' : 'text-text-muted'
              )}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        <GlassCard className="p-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: PATIENT DETAILS */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={labelClass}>Patient Name</label>
                    <input name="patient_name" value={formData.patient_name} onChange={handleInputChange} className={inputClass} placeholder="Full Name" />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Relation</label>
                    <input name="relation" value={formData.relation} onChange={handleInputChange} className={inputClass} placeholder="e.g. Self, Spouse" />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Date of Birth</label>
                    <input type="date" name="birth_date" value={formData.birth_date} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className={inputClass}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className={labelClass}>Diagnosis</label>
                    <input name="diagnosis" value={formData.diagnosis} onChange={handleInputChange} className={inputClass} placeholder="Reason for admission" />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <GradientButton onClick={nextStep} className="gap-2">
                    Next <ChevronRight size={18} />
                  </GradientButton>
                </div>
              </motion.div>
            )}

            {/* STEP 2: HOSPITAL DETAILS */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={labelClass}>Hospital Name</label>
                    <input name="hospital_name" value={formData.hospital_name} onChange={handleInputChange} className={inputClass} placeholder="Enter hospital name" />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Doctor Name</label>
                    <input name="doctor_name" value={formData.doctor_name} onChange={handleInputChange} className={inputClass} placeholder="Dr. Name" />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Admission Date</label>
                    <input type="date" name="admission_date" value={formData.admission_date} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Discharge Date</label>
                    <input type="date" name="discharge_date" value={formData.discharge_date} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className={labelClass}>Treatment Description</label>
                    <textarea name="treatment" value={formData.treatment} onChange={handleInputChange} className={cn(inputClass, "h-24 resize-none")} placeholder="Briefly describe treatment..." />
                  </div>
                </div>

                {duration > 0 && (
                  <div className="p-4 bg-accent-purple/10 border border-accent-purple/20 rounded-xl flex items-center gap-3">
                    <Calendar className="text-accent-purple" size={20} />
                    <p className="text-sm text-text-primary"> Calculated Stay: <span className="font-bold text-accent-purple">{duration} days</span> </p>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <GradientButton variant="outline" onClick={prevStep} className="gap-2">
                    <ChevronLeft size={18} /> Back
                  </GradientButton>
                  <GradientButton onClick={nextStep} className="gap-2">
                    Next <ChevronRight size={18} />
                  </GradientButton>
                </div>
              </motion.div>
            )}

            {/* STEP 3: FINANCIAL DETAILS */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={labelClass}>Total Bill Amount (₹)</label>
                    <input
                      type="number"
                      name="total_bill_amount"
                      value={formData.total_bill_amount}
                      onChange={handleInputChange}
                      className={cn(inputClass, "text-2xl font-bold")}
                      placeholder="0.00"
                    />
                    {formData.total_bill_amount && (
                      <p className="text-xs text-text-muted">In Words: {formatCurrency(Number(formData.total_bill_amount))}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <GradientButton variant="outline" onClick={prevStep} className="gap-2">
                    <ChevronLeft size={18} /> Back
                  </GradientButton>
                  <GradientButton onClick={nextStep} className="gap-2">
                    Review Claim <ChevronRight size={18} />
                  </GradientButton>
                </div>
              </motion.div>
            )}

            {/* STEP 4: REVIEW & SUBMIT */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-6">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <p className={labelClass}>Patient</p>
                      <p className="text-sm text-text-primary font-medium">{formData.patient_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className={labelClass}>Hospital</p>
                      <p className="text-sm text-text-primary font-medium">{formData.hospital_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className={labelClass}>Admission</p>
                      <p className="text-sm text-text-primary font-medium">{formData.admission_date || 'N/A'}</p>
                    </div>
                    <div>
                      <p className={labelClass}>Discharge</p>
                      <p className="text-sm text-text-primary font-medium">{formData.discharge_date || 'N/A'}</p>
                    </div>
                    <div className="col-span-2 pt-4 border-t border-white/5">
                      <p className={labelClass}>Total Claim Amount</p>
                      <p className="text-2xl text-accent-green font-bold">{formatCurrency(Number(formData.total_bill_amount))}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between gap-4">
                    <GradientButton variant="outline" onClick={prevStep} className="flex-1 gap-2">
                      <ChevronLeft size={18} /> Back
                    </GradientButton>
                    <GradientButton variant="outline" onClick={() => handleSubmit('DRAFT')} className="flex-1">
                      Save as Draft
                    </GradientButton>
                  </div>
                  <button 
                    onClick={() => handleSubmit('SUBMITTED')}
                    className="w-full bg-accent-purple hover:bg-opacity-90 py-4 rounded-xl text-white font-bold text-lg transition-all"
                  >
                    Submit Claim
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </PageTransition>
  );
};