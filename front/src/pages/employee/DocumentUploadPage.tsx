import React, { useState, useRef, useEffect } from 'react';
import { PageTransition } from '../../components/layout/PageTransition';
import { GlassCard } from '../../components/ui/GlassCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { cn } from '../../lib/utils';
import { analyzeMedicalDocument, AIAnalysisResult } from '../../lib/gemini';
import { 
  Upload, 
  File, 
  X, 
  ShieldCheck, 
  Lock,
  Info,
  ChevronDown,
  ScanText,
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  Loader
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { getEmployeeClaims, getClaimDetails, uploadDocument } from '@/src/api/mrs';

interface ClaimOption {
  id: string;
  claim_number: string;
  patient_name: string;
  hospital_name: string;
}

export const DocumentUploadPage: React.FC = () => {
  const [claims, setClaims] = useState<ClaimOption[]>([]);
  const [claimId, setClaimId] = useState('');
  const [docType, setDocType] = useState('Hospital Bill');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [hash, setHash] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hospitalName, setHospitalName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);
  const [claimStatus, setClaimStatus] = useState('');

  const docTypes = [
    { id: '1', label: 'Hospital Bill' },
    { id: '2', label: 'Discharge Summary' },
    { id: '3', label: 'Prescription / Referral Letter' },
    { id: '4', label: 'Lab / Diagnostic Reports' },
    { id: '5', label: 'Identity Documents' },
    { id: '6', label: 'Other Supporting Documents' },
  ];

  // Fetch employee's claims on component mount
  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setIsLoadingClaims(true);
        console.log('Fetching employee claims...');
        const claimsData = await getEmployeeClaims();
        console.log('Claims fetched:', claimsData);
        
        if (!Array.isArray(claimsData)) {
          console.warn('Invalid claims data format:', claimsData);
          setClaims([]);
          toast.error('Invalid response format from server');
          setIsLoadingClaims(false);
          return;
        }
        
        if (claimsData.length === 0) {
          setClaims([]);
          setIsLoadingClaims(false);
          console.log('No claims available');
          return;
        }
        
        // Filter only DRAFT claims for document upload
        const draftClaims = claimsData.filter(
          claim => claim.claim_status === 'DRAFT' || claim.claimstatus === 'DRAFT'
        );
        
        console.log('Draft claims found:', draftClaims.length);
        
        const formattedClaims: ClaimOption[] = draftClaims.map(claim => ({
          id: claim.claim_id,
          claim_number: claim.claim_id?.substring(0, 8) || 'Unknown', // Show short UUID
          patient_name: claim.patient?.patientName || 'Unknown Patient',
          hospital_name: claim.hospital?.hospitalName || 'Unknown Hospital',
        }));
        
        setClaims(formattedClaims);
        
        if (formattedClaims.length === 0) {
          console.log('No DRAFT claims after filtering');
          toast.info('No DRAFT claims available. Only draft claims can have documents uploaded.');
        }
        
        setIsLoadingClaims(false);
      } catch (error: any) {
        console.error('Error fetching claims:', error);
        setClaims([]);
        setIsLoadingClaims(false);
        const errorMsg = error?.response?.data?.detail || error?.message || 'Failed to load claims';
        toast.error(`Failed to load claims: ${errorMsg}`);
      }
    };

    fetchClaims();
  }, []);

  // Fetch claim details when claim is selected
  const handleClaimSelect = async (selectedClaimId: string) => {
    if (!selectedClaimId) {
      setClaimId('');
      setPatientName('');
      setHospitalName('');
      setClaimStatus('');
      return;
    }

    try {
      setClaimId(selectedClaimId);
      const claimDetails = await getClaimDetails(selectedClaimId);
      
      setPatientName(claimDetails.patient?.patientName || 'N/A');
      setHospitalName(claimDetails.hospital?.hospitalName || 'N/A');
      setClaimStatus(claimDetails.claim_status || 'DRAFT');
      
      toast.success('Claim details loaded');
    } catch (error) {
      console.error('Error fetching claim details:', error);
      toast.error('Failed to load claim details');
      setClaimId('');
      setPatientName('');
      setHospitalName('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, JPG, or PNG.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max size is 10MB.');
      return;
    }
    setFile(file);
    setUploadSuccess(false);
    setAiAnalysis(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!claimId || !file) {
      toast.error('Please select a claim and a file');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading document to Supabase...');

    try {
      // Upload document to backend (which saves to Supabase and database)
      const uploadedDoc = await uploadDocument(claimId, docType, file);
      setHash(uploadedDoc.fileHash);
      
      setIsUploading(false);
      setUploadSuccess(true);
      toast.success('Document uploaded and saved successfully!', { id: toastId });

      // Start AI Analysis
      setIsAnalyzing(true);
      const analysisToastId = toast.loading('Gemini AI is analyzing your document...', { icon: <BrainCircuit className="text-accent-purple animate-pulse" size={18} /> });
      
      const base64 = await fileToBase64(file);
      const analysis = await analyzeMedicalDocument(base64, file.type, docType);
      
      setAiAnalysis(analysis);
      setIsAnalyzing(false);
      toast.success('AI Analysis complete!', { id: analysisToastId });
    } catch (error) {
      console.error(error);
      setIsUploading(false);
      setIsAnalyzing(false);
      toast.error('Upload or analysis failed', { id: toastId });
    }
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ScanText className="text-accent-purple" size={28} />
            Smart Document Upload
          </h1>
          <p className="text-text-secondary text-sm mt-1">Upload your medical bills and reports. Gemini AI will automatically extract key details.</p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          <GlassCard className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Claim Selection Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Select Claim *</label>
                <div className="relative">
                  {isLoadingClaims ? (
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-2 text-text-secondary">
                      <Loader size={16} className="animate-spin" />
                      <span>Loading your claims...</span>
                    </div>
                  ) : claims.length === 0 ? (
                    <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-secondary text-sm">
                      <div className="flex flex-col gap-1">
                        <p>No DRAFT claims available</p>
                        <p className="text-[11px] text-text-muted">Create a new claim to start uploading documents</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <select
                        value={claimId}
                        onChange={(e) => handleClaimSelect(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all appearance-none"
                      >
                        <option value="" className="bg-secondary-bg text-text-muted">Select a claim...</option>
                        {claims.map(claim => (
                          <option key={claim.id} value={claim.id} className="bg-secondary-bg">
                            ID: {claim.claim_number} | {claim.patient_name} | {claim.hospital_name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
                    </>
                  )}
                </div>
                {claims.length > 0 && (
                  <p className="text-[10px] text-text-muted">
                    {claims.length} DRAFT claim{claims.length !== 1 ? 's' : ''} available
                  </p>
                )}
              </div>

              {/* Patient Name (Read-only, auto-populated) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Patient Name</label>
                <input
                  type="text"
                  value={patientName}
                  readOnly
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary opacity-75 cursor-not-allowed"
                  placeholder="Auto-populated from claim"
                />
              </div>

              {/* Hospital Name (Read-only, auto-populated) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Hospital Name</label>
                <input
                  type="text"
                  value={hospitalName}
                  readOnly
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary opacity-75 cursor-not-allowed"
                  placeholder="Auto-populated from claim"
                />
              </div>

              {/* Document Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Document Type</label>
                <div className="relative">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all appearance-none"
                  >
                    {docTypes.map(type => (
                      <option key={type.id} value={type.label} className="bg-secondary-bg">{type.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group',
                isDragging ? 'border-accent-purple bg-accent-purple/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]',
                file && 'border-accent-green/30 bg-accent-green/5'
              )}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png"
              />
              
              <div className={cn(
                'p-4 rounded-full transition-all',
                file ? 'bg-accent-green/20 text-accent-green' : 'bg-white/5 text-text-muted group-hover:text-text-primary'
              )}>
                {file ? <ShieldCheck size={32} /> : <Upload size={32} />}
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-text-primary">
                  {file ? file.name : 'Click or drag to upload'}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF, JPG, PNG — max 10MB'}
                </p>
              </div>

              {file && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setUploadSuccess(false);
                    setAiAnalysis(null);
                  }}
                  className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-text-muted hover:text-accent-red transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <GradientButton 
              fullWidth 
              onClick={handleUpload} 
              loading={isUploading || isAnalyzing}
              disabled={!file || !claimId || uploadSuccess}
              className="gap-2"
            >
              <Lock size={18} /> Upload & Analyze with Gemini AI
            </GradientButton>

            <AnimatePresence>
              {uploadSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="p-4 bg-accent-green/10 border border-accent-green/20 rounded-xl flex items-center gap-3">
                    <ShieldCheck className="text-accent-green" size={20} />
                    <p className="text-sm text-text-primary font-bold">Document uploaded and hashed successfully</p>
                  </div>

                  {/* AI Analysis Results */}
                  {aiAnalysis && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="text-accent-purple" size={20} />
                          <h3 className="text-lg font-bold text-white font-space">AI Analysis Report</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Confidence</span>
                          <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent-purple" 
                              style={{ width: `${aiAnalysis.confidence_score * 100}%` }} 
                            />
                          </div>
                          <span className="text-xs font-bold text-accent-purple">{(aiAnalysis.confidence_score * 100).toFixed(0)}%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Extracted Amount</p>
                            <p className="text-xl font-bold text-white font-space">
                              {aiAnalysis.extracted_amount ? `₹${aiAnalysis.extracted_amount.toLocaleString()}` : 'Not found'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Document Date</p>
                            <p className="text-sm text-text-primary font-medium">{aiAnalysis.extracted_date || 'Not found'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Legibility</p>
                            <div className="flex items-center gap-2 mt-1">
                              {aiAnalysis.is_legible ? (
                                <span className="flex items-center gap-1 text-xs font-bold text-accent-green">
                                  <CheckCircle2 size={14} /> Clear & Legible
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs font-bold text-accent-red">
                                  <AlertTriangle size={14} /> Poor Legibility
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">AI Summary</p>
                            <p className="text-xs text-text-secondary leading-relaxed mt-1">{aiAnalysis.summary}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Fraud / Inconsistency Flags</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {aiAnalysis.potential_fraud_flags.length > 0 ? (
                                aiAnalysis.potential_fraud_flags.map((flag, i) => (
                                  <span key={i} className="px-2 py-1 rounded bg-accent-red/10 text-accent-red text-[10px] font-bold border border-accent-red/20 flex items-center gap-1">
                                    <AlertTriangle size={10} /> {flag}
                                  </span>
                                ))
                              ) : (
                                <span className="px-2 py-1 rounded bg-accent-green/10 text-accent-green text-[10px] font-bold border border-accent-green/20 flex items-center gap-1">
                                  <CheckCircle2 size={10} /> No flags detected
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">SHA-256 Fingerprint</label>
                      <div className="group relative">
                        <Info size={12} className="text-text-muted cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-secondary-bg border border-white/10 rounded-lg text-[10px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                          This hash is a unique fingerprint of your file. Any modification will be detected during verification.
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] text-text-secondary break-all leading-relaxed">
                      {hash}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  );
};