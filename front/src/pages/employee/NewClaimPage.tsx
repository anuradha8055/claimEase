import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { createClaim, submitClaimWorkflow, getClaimDetails, updateClaim } from '@/src/api/mrs';

const RELATIONS = ['Father', 'Mother', 'Husband', 'Wife', 'Son', 'Daughter', 'Brother', 'Sister', 'Self'];

export const NewClaimPage: React.FC = () => {
  const navigate = useNavigate();
  const { claimId } = useParams<{ claimId?: string }>();
  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState(!!claimId);
  const [loading, setLoading] = useState(!!claimId);
  const [formData, setFormData] = useState({
    // Patient details
    patient_name: '',
    relation: '',
    patient_dob: '',
    patient_gender: '',
    diagnosis: '',

    // Hospital details
    hospital_id: '',
    hospital_name: '',
    hospital_address: '',
    hospital_type: 'Private', // default value
    hospital_city: '',
    hospital_state: '',
    hospital_pincode: '',
    hospital_contact_number: '',

    // Treatment and doctor details
    doctor_name: '',
    doctor_qualification: '',
    treatment_details: '',
    admission_date: '',
    discharge_date: '',
    is_emergency: false,

    //financial details
    total_bill_amount: '',
  });

  // Load claim data if editing
  useEffect(() => {
    const loadClaimData = async () => {
      if (!claimId) {
        setLoading(false);
        return;
      }
      try {
        const claimData = await getClaimDetails(claimId);
        setFormData({
          patient_name: claimData.patient?.patientName || '',
          relation: claimData.patient?.relation || '',
          patient_dob: claimData.patient?.birthDate ? new Date(claimData.patient.birthDate).toISOString().split('T')[0] : '',
          patient_gender: claimData.patient?.gender || '',
          diagnosis: claimData.patient?.diagnosis || '',
          hospital_id: '', // hospital_id is not returned in response, user must re-enter or we fetch from hospital_details
          hospital_name: claimData.hospital?.hospitalName || '',
          hospital_address: claimData.hospital?.hospitalAddress || '',
          hospital_type: claimData.hospital?.hospitalType || 'Private',
          hospital_city: claimData.hospital?.hospitalCity || '',
          hospital_state: claimData.hospital?.hospitalState || '',
          hospital_pincode: claimData.hospital?.hospitalPincode || '',
          hospital_contact_number: claimData.hospital?.hospitalContactNo || '',
          doctor_name: claimData.hospital?.doctorName || '',
          doctor_qualification: claimData.hospital?.doctorQualification || '',
          treatment_details: claimData.hospital?.treatmentDetails || '',
          admission_date: claimData.hospital?.admissionDate ? new Date(claimData.hospital.admissionDate).toISOString().split('T')[0] : '',
          discharge_date: claimData.hospital?.dischargeDate ? new Date(claimData.hospital.dischargeDate).toISOString().split('T')[0] : '',
          is_emergency: claimData.isEmergency || false,
          total_bill_amount: claimData.totalBillAmount ? claimData.totalBillAmount.toString() : '',
        });
        setLoading(false);
      } catch (error) {
        toast.error('Failed to load claim details');
        console.error('Error loading claim:', error);
        setLoading(false);
      }
    };
    loadClaimData();
  }, [claimId]);

  // Helper: Live Age Calculation
  const patientAge = useMemo(() => {
    if (!formData.patient_dob) return null;
    const birth = new Date(formData.patient_dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : 0;
  }, [formData.patient_dob]);

  // Helper: Stay Duration Calculation
  const duration = formData.admission_date && formData.discharge_date 
    ? differenceInDays(new Date(formData.discharge_date), new Date(formData.admission_date))
    : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value,type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (!formData.hospital_id || Number(formData.hospital_id) <= 0) {
      toast.error('Please enter a valid Hospital ID (e.g., 1)');
      return;
    }
    if (Number(formData.total_bill_amount) <= 0) {
      toast.error('Please enter a valid bill amount');
      return;
    }
    if (!formData.patient_name.trim()) {
      toast.error('Patient name is required');
      return;
    }
    if (!formData.admission_date || !formData.discharge_date) {
      toast.error('Admission and discharge dates are required');
      return;
    }
    if (!formData.relation) {
      toast.error('Relation is required');
      return;
    }

    const toastId=toast.loading(status === 'DRAFT' ? 'Saving draft...' : 'Submitting claim...', { id: 'claim-action' });
    
    try{
      // Transform frontend snake_case fields to backend camelCase schema
      const claim_payload = {
        patientName: formData.patient_name.trim(),
        relation: formData.relation,
        patientGender: formData.patient_gender,
        patientBirthDate: formData.patient_dob,
        diagnosis: formData.diagnosis.trim(),
        hospitalName: formData.hospital_name.trim(),
        hospitalType: formData.hospital_type,
        hospitalAddress: formData.hospital_address.trim(),
        hospitalCity: formData.hospital_city.trim(),
        hospitalState: formData.hospital_state.trim(),
        hospitalPincode: formData.hospital_pincode.trim(),
        hospitalContactNumber: formData.hospital_contact_number.trim(),
        admissionDate: formData.admission_date,
        dischargeDate: formData.discharge_date,
        treatmentDetails: formData.treatment_details.trim(),
        doctorName: formData.doctor_name.trim(),
        doctorQualification: formData.doctor_qualification.trim(),
        totalBillAmount: Number(formData.total_bill_amount),
        isEmergency: !!formData.is_emergency
      };  

      let claim;
      if (isEditing && claimId) {
        // Update existing claim
        claim = await updateClaim(claimId, claim_payload);
      } else {
        // Create new claim
        claim = await createClaim(claim_payload);
      }
      
      toast.dismiss(toastId);

      // Attempt to trigger workflow transition if submitted
      if (status === 'SUBMITTED' && claim.claim_id) {
        try {
          await submitClaimWorkflow(claim.claim_id.toString());
        } catch (workflowError) {
          console.warn('Workflow submission had an issue, but claim was created:', workflowError);
          toast.success('Claim saved! Workflow will be processed.');
        }
      } else {
        toast.success(status === 'DRAFT' ? 'Draft saved!' : 'Claim submitted!');
      }
      
      // Navigate to dashboard after successful claim creation
      setTimeout(() => navigate('/employee/dashboard'), 500);
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error('Error creating claim:', error);
      const errorDetail = error?.response?.data?.detail || 'Failed to create claim. Please check all fields and try again.';
      toast.error(errorDetail);
    }
  };


  const steps = [
    { id: 1, title: 'Patient Details', icon: Info },
    { id: 2, title: 'Hospital Details', icon: Hospital },
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
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit Reimbursement Claim' : 'New Reimbursement Claim'}
          </h1>
        </header>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full"
            />
          </div>
        )}

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
                key="step1"
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
                      name="patient_dob"
                      value={formData.patient_dob}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Gender</label>
                    <select
                      name="patient_gender"
                      value={formData.patient_gender}
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
                      <option value="Other" className="text-black">Other</option>
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
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Hospital Name</label>
                    <input
                      type="text"
                      name="hospital_name"
                      value={formData.hospital_name}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                      placeholder="e.g. Apollo Hospital"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Hospital Type</label>
                    <input
                      type="text"
                      name="hospital_type"
                      value={formData.hospital_type}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                      placeholder="Enter Hospital Type"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Hospital Address</label>
                    <input
                      type="text"
                      name="hospital_address"
                      value={formData.hospital_address}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                      placeholder="e.g. 123 Main Street"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Hospital City</label>
                    <input
                      type="text"
                      name="hospital_city"
                      value={formData.hospital_city}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                      placeholder="e.g. Mumbai"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Hospital State</label>
                    <input
                      type="text"
                      name="hospital_state"
                      value={formData.hospital_state}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                      placeholder="e.g. Maharashtra"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Hospital Pincode</label>
                    <input
                      type="text"
                      name="hospital_pincode"
                      value={formData.hospital_pincode}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                      placeholder="e.g. 123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Hospital Contact Number</label>
                    <input
                      type="text"
                      name="hospital_contact_number"
                      value={formData.hospital_contact_number}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                      placeholder="e.g. 123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Doctor Name</label>
                    <input
                      type="text"
                      name="doctor_name"
                      value={formData.doctor_name}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                      placeholder="e.g. Dr. John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Doctor Qualification</label>
                    <input
                      type="text"
                      name="doctor_qualification"
                      value={formData.doctor_qualification}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                      placeholder="e.g. MBBS, MD"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Treatment Details</label>
                    <input
                      type="text"
                      name="treatment_details"
                      value={formData.treatment_details}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                      placeholder="e.g. Acute Appendicitis"
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

                  {duration > 0 && (
                    <div className="p-4 bg-accent-purple/10 border border-accent-purple/20 rounded-xl flex items-center gap-3">
                      <Calendar className="text-accent-purple" size={20} />
                      <p className="text-sm text-text-primary">
                        Calculated Stay Duration: <span className="font-bold text-accent-purple">{duration} days</span>
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between pt-4">
                    <GradientButton onClick={prevStep} variant="outline" className="gap-2"><ChevronLeft size={18} /> Previous</GradientButton>
                    <GradientButton onClick={nextStep} className="gap-2">Next Step <ChevronRight size={18} /></GradientButton>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className='space-y-6'>
                <div className="space-y-6"  >
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Total Bill Amount (₹)</label>
                    <input
                      type="number"
                      name="total_bill_amount"
                      value={formData.total_bill_amount}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all"
                      placeholder="Enter total bill amount"
                    />
                  </div>
                  <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" name="is_emergency" checked={formData.is_emergency} onChange={handleInputChange} className="w-5 h-5 rounded border-white/10 bg-white/5 text-accent-purple" />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">This was an emergency admission</span>
                  </label>
                  </div>
                  <div className="flex justify-between pt-4">
                    <GradientButton onClick={prevStep} variant="outline" className="gap-2"><ChevronLeft size={18} /> Previous</GradientButton>
                    <GradientButton onClick={nextStep} className="gap-2">Next Step <ChevronRight size={18} /></GradientButton>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className='space-y-6'>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                  <div className='grid grid-cols-2 gap-4'>
                    <div><p className="text-[10px] font-bold text-text-muted uppercase">Patient</p><p className="text-sm text-white">{formData.patient_name} ({formData.relation})</p></div>
                    <div><p className="text-[10px] font-bold text-text-muted uppercase">Hospital</p><p className="text-sm text-white">{formData.hospital_name}</p></div>
                    <div><p className="text-[10px] font-bold text-text-muted uppercase">Location</p><p className="text-sm text-white">{formData.hospital_city}, {formData.hospital_state}</p></div>
                    <div><p className="text-[10px] font-bold text-text-muted uppercase">Diagnosis</p><p className="text-sm text-white">{formData.diagnosis}</p></div>
                    <div className='col-span-2 border-t border-white/5 pt-3'>
                      <p className="text-[10px] font-bold text-text-muted uppercase">Total amount</p>
                      <p className="text-sm text-white">{formData.total_bill_amount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-accent-purple/10 border border-accent-purple/30 rounded-xl p-4 flex gap-3">
                  <Info size={20} className="text-accent-purple flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-accent-purple">Important: Documents Required</p>
                    <p className="text-xs text-text-secondary">You must upload at least one supporting document (Hospital Bill, Discharge Summary, etc.) before you can submit this claim. After saving as draft, go to the Document Upload section to upload your documents.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className='flex gap-4'>
                    <GradientButton onClick={prevStep} variant="outline" className="flex-1"><ChevronLeft size={18} /> Back</GradientButton>
                    <GradientButton onClick={() => handleSubmit('DRAFT')} className="flex-1"> Save as Draft</GradientButton>
                  </div>
                  <GradientButton onClick={() => handleSubmit('SUBMITTED')} className="w-full py-4 text-lg"> Submit Claim</GradientButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </PageTransition>
  );
};
