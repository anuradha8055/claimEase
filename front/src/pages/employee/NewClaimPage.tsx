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
  Info
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import { address } from 'motion/react-client';

export const NewClaimPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // new 
    patient_name: '',
    relation: '',
    birth_date: '',
    gender: '',
    diagnosis: '',

    // EXISTING
    hospital_id: '',
    hospital_name: '',
    hospital_address: '',
    doctor_name: '',
    doctor_qualification: '',
    treatment_details: '',

    admission_date: '',
    discharge_date: '',
    total_bill_amount: '',
  });

  const duration = formData.admission_date && formData.discharge_date 
    ? differenceInDays(new Date(formData.discharge_date), new Date(formData.admission_date))
    : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (Number(formData.total_bill_amount) <= 0) {
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

  // const steps = [
    // { id: 1, title: 'Hospital & Dates', icon: Hospital },
    // { id: 2, title: 'Financial Details', icon: IndianRupee },
    // { id: 3, title: 'Review & Submit', icon: CheckCircle2 },
  // ];
  const steps = [
  { id: 1, title: 'Patient Details', icon: Info },
  { id: 2, title: 'Hospital & Dates', icon: Hospital },
  { id: 3, title: 'Financial Details', icon: IndianRupee },
  { id: 4, title: 'Review & Submit', icon: CheckCircle2 },
    ];
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
            {step === 1 && (
  <motion.div
    key="step0"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      <div className="space-y-2">
        <label className="text-xs font-bold text-text-muted uppercase">Patient Name</label>
        <input
          type="text"
          name="patient_name"
          value={formData.patient_name}
          onChange={handleInputChange}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary"
          placeholder="Enter patient name"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-text-muted uppercase">Relation</label>
        <input
          type="text"
          name="relation"
          value={formData.relation}
          onChange={handleInputChange}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary"
          placeholder="e.g. Father, Mother"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-text-muted uppercase">Birth Date</label>
        <input
          type="date"
          name="birth_date"
          value={formData.birth_date}
          onChange={handleInputChange}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-text-muted uppercase">Gender</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleInputChange}
          // className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-purple"
        >
          {/* <option value="">Select Gender</option> */}
          {/* <option value="Male">Male</option> */}
          {/* <option value="Female">Female</option> */}
          <option value="" className="text-black">Select Gender</option>
          <option value="Male" className="text-black">Male</option>
          <option value="Female" className="text-black">Female</option>
        </select>
      </div>

      <div className="md:col-span-2 space-y-2">
        <label className="text-xs font-bold text-text-muted uppercase">Diagnosis</label>
        <input
          type="text"
          name="diagnosis"
          value={formData.diagnosis}
          onChange={handleInputChange}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary"
          placeholder="Enter diagnosis"
        />
      </div>

    </div>

    <div className="flex justify-end pt-4">
      <GradientButton onClick={nextStep}>
        Next Step <ChevronRight size={18} />
      </GradientButton>
    </div>
  </motion.div>
)}
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
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Hospital ID</label>
                    <input
                      type="number"
                      name="hospital_id"
                      value={formData.hospital_id}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                      placeholder="Enter Hospital ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Diagnosis</label>
                    <input
                      type="text"
                      name="diagnosis"
                      value={formData.diagnosis}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                      placeholder="e.g. Acute Appendicitis"
                    />
                  </div>
                  {/* Hospital Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Hospital Name</label>
                    <input
    type="text"
    name="hospital_name"
    value={formData.hospital_name}
    onChange={handleInputChange}
    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary"
    placeholder="Enter hospital name"
  />
</div>

{/* Hospital Address */}
<div className="space-y-2">
  <label className="text-xs font-bold text-text-muted uppercase">Hospital Address</label>
  <input
    type="text"
    name="hospital_address"
    value={formData.hospital_address}
    onChange={handleInputChange}
    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary"
    placeholder="Enter hospital address"
  />
</div>

{/* Doctor Name */}
<div className="space-y-2">
  <label className="text-xs font-bold text-text-muted uppercase">Doctor Name</label>
  <input
    type="text"
    name="doctor_name"
    value={formData.doctor_name}
    onChange={handleInputChange}
    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary"
    placeholder="Enter doctor name"
  />
</div>

{/* Doctor Qualification */}
<div className="space-y-2">
  <label className="text-xs font-bold text-text-muted uppercase">Doctor Qualification</label>
  <input
    type="text"
    name="doctor_qualification"
    value={formData.doctor_qualification}
    onChange={handleInputChange}
    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary"
    placeholder="e.g. MBBS, MD"
  />
</div>

{/* Treatment Taken */}
<div className="md:col-span-2 space-y-2">
  <label className="text-xs font-bold text-text-muted uppercase">Treatment Taken</label>
  <textarea
    name="treatment_taken"
    value={formData.treatment_taken}
    onChange={handleInputChange}
    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary"
    placeholder="Describe treatment"
  />
</div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Admission Date</label>
                    <input
                      type="date"
                      name="admission_date"
                      value={formData.admission_date}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Discharge Date</label>
                    <input
                      type="date"
                      name="discharge_date"
                      value={formData.discharge_date}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                    />
                  </div>
                </div>

                {duration > 0 && (
                  <div className="p-4 bg-accent-purple/10 border border-accent-purple/20 rounded-xl flex items-center gap-3">
                    <Calendar className="text-accent-purple" size={20} />
                    <p className="text-sm text-text-primary">
                      Calculated Stay Duration: <span className="font-bold text-accent-purple">{duration} days</span>
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <GradientButton onClick={nextStep} className="gap-2">
                    Next Step <ChevronRight size={18} />
                  </GradientButton>
                
                </div>
              </motion.div>
              
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Total Bill Amount (₹)</label>
                    <input
                      type="number"
                      name="total_bill_amount"
                      value={formData.total_bill_amount}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all text-xl font-bold font-space"
                      placeholder="0.00"
                    />
                    {formData.total_bill_amount && (
                      <p className="text-xs text-text-muted">Preview: {formatCurrency(formData.total_bill_amount)}</p>
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

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-6">
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Hospital ID</p>
                      <p className="text-sm text-text-primary font-medium">{formData.hospital_id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Diagnosis</p>
                      <p className="text-sm text-text-primary font-medium">{formData.diagnosis}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Admission</p>
                      <p className="text-sm text-text-primary font-medium">{formData.admission_date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Discharge</p>
                      <p className="text-sm text-text-primary font-medium">{formData.discharge_date}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Bill Amount</p>
                      <p className="text-xl text-accent-green font-bold font-space">{formatCurrency(formData.total_bill_amount)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <div className="flex justify-between gap-4">
                    <GradientButton variant="outline" onClick={prevStep} className="flex-1 gap-2">
                      <ChevronLeft size={18} /> Back
                    </GradientButton>
                    <GradientButton variant="outline" onClick={() => handleSubmit('DRAFT')} className="flex-1">
                      Save as Draft
                    </GradientButton>
                  </div>
                  <GradientButton onClick={() => handleSubmit('SUBMITTED')} className="w-full py-4 text-lg">
                    Submit Claim
                  </GradientButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </PageTransition>
  );
};