import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTransition } from '../../components/layout/PageTransition';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SLABadge } from '../../components/ui/SLABadge';
import { formatCurrency, cn } from '../../lib/utils';
import { Claim, ClaimStatus, Document } from '../../types';
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  FileText, 
  AlertCircle,
  Stethoscope,
  IndianRupee,
  File,
  ShieldCheck,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export const ClaimDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null);

  useEffect(() => {
    // Mock data
    const mockClaim: Claim = {
      claim_id: Number(id),
      employeeId: 1,
      hospital_id: 501,
      claim_number: 'CLM-2026-001',
      admission_date: '2026-03-01',
      discharge_date: '2026-03-05',
      diagnosis: 'Acute Appendicitis',
      total_bill_amount: 45000,
      eligible_reimbursement_amount: null,
      claim_status: 'SUBMITTED',
      current_workflow_stage: 'SUBMITTED',
      submission_timestamp: '2026-03-06T10:00:00Z',
      last_updated_timestamp: '2026-03-18T10:00:00Z',
    };

    const mockDocs: Document[] = [
      {
        document_id: 1,
        claim_id: Number(id),
        document_type: 'Hospital Bill',
        file_name: 'hospital_bill_001.pdf',
        file_type: 'application/pdf',
        file_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85',
        file_size: 1024 * 1024 * 1.2,
        uploaded_by: 1,
        upload_timestamp: '2026-03-06T10:05:00Z',
        ai_analysis: {
          extracted_amount: 45000,
          extracted_date: '2026-03-05',
          confidence_score: 0.98,
          is_legible: true,
          potential_fraud_flags: [],
          summary: 'Final hospital bill for appendectomy including room charges and surgery fees.'
        }
      },
      {
        document_id: 2,
        claim_id: Number(id),
        document_type: 'Discharge Summary',
        file_name: 'discharge_summary.pdf',
        file_type: 'application/pdf',
        file_hash: '5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03',
        file_size: 1024 * 512,
        uploaded_by: 1,
        upload_timestamp: '2026-03-06T10:06:00Z',
        ai_analysis: {
          extracted_date: '2026-03-05',
          confidence_score: 0.92,
          is_legible: true,
          potential_fraud_flags: ['Signature missing on page 2'],
          summary: 'Discharge summary confirming acute appendicitis diagnosis and successful surgery.'
        }
      }
    ];

    setClaim(mockClaim);
    setDocuments(mockDocs);
    setLoading(false);
  }, [id]);

  if (loading || !claim) return null;

  const workflowNodes: ClaimStatus[] = [
    'DRAFT',
    'SUBMITTED',
    'SCRUTINY_APPROVED',
    'MEDICAL_APPROVED',
    'FINANCE_APPROVED',
    'DDO_SANCTIONED',
    'PAYMENT_PROCESSED'
  ];

  const currentNodeIndex = workflowNodes.indexOf(claim.claim_status === 'QUERY_RAISED' ? 'SUBMITTED' : claim.claim_status);

  return (
    <PageTransition>
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white font-space">{claim.claim_number}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={claim.claim_status} />
                <SLABadge updatedAt={claim.last_updated_timestamp} />
              </div>
            </div>
          </div>
        </header>

        {/* Workflow Journey Tracker */}
        <GlassCard className="p-8">
          <div className="relative flex justify-between items-center px-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 -z-10" />
            <motion.div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent-green -z-10"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentNodeIndex / (workflowNodes.length - 1)) * 100}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
            {workflowNodes.map((node, index) => {
              const isCompleted = index < currentNodeIndex;
              const isCurrent = index === currentNodeIndex;

              return (
                <div key={node} className="flex flex-col items-center gap-3 relative">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500',
                    isCompleted ? 'bg-accent-green text-white' : 
                    isCurrent ? 'bg-accent-purple text-white ring-4 ring-accent-purple/20' : 
                    'bg-secondary-bg border-2 border-white/10 text-text-muted'
                  )}>
                    {isCompleted ? <Check size={16} /> : <span className="text-[10px] font-bold">{index + 1}</span>}
                    {isCurrent && (
                      <motion.div 
                        className="absolute inset-0 rounded-full border-2 border-accent-purple"
                        animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                  <span className={cn(
                    'text-[8px] font-bold uppercase tracking-widest absolute -bottom-6 whitespace-nowrap',
                    isCompleted ? 'text-accent-green' : isCurrent ? 'text-accent-purple' : 'text-text-muted'
                  )}>
                    {node.split('_')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {claim.claim_status === 'QUERY_RAISED' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-accent-orange/10 border border-accent-orange/30 rounded-2xl p-6 flex items-center gap-4 animate-pulse-orange"
          >
            <div className="p-3 bg-accent-orange/20 rounded-xl text-accent-orange">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-space">Query Raised</h3>
              <p className="text-sm text-text-secondary">A query has been raised regarding your claim. Please respond in the Queries section to proceed.</p>
            </div>
            <button 
              onClick={() => navigate('/employee/queries')}
              className="ml-auto px-6 py-2 bg-accent-orange text-white rounded-xl font-bold text-sm"
            >
              View Queries
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GlassCard className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Stethoscope className="text-accent-purple" size={20} />
              <h2 className="text-lg font-bold text-white font-space">Medical Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Hospital ID</p>
                <p className="text-sm text-text-primary font-medium">{claim.hospital_id}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Diagnosis</p>
                <p className="text-sm text-text-primary font-medium">{claim.diagnosis}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Admission Date</p>
                <p className="text-sm text-text-primary font-medium">{format(new Date(claim.admission_date), 'PPP')}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Discharge Date</p>
                <p className="text-sm text-text-primary font-medium">{format(new Date(claim.discharge_date), 'PPP')}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Duration</p>
                <p className="text-sm text-text-primary font-medium">{differenceInDays(new Date(claim.discharge_date), new Date(claim.admission_date))} Days</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <IndianRupee className="text-accent-green" size={20} />
              <h2 className="text-lg font-bold text-white font-space">Financial Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Bill Amount</p>
                <p className="text-sm text-text-primary font-bold">{formatCurrency(claim.total_bill_amount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Claimed Amount</p>
                <p className="text-sm text-accent-purple font-bold">{formatCurrency(claim.total_bill_amount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Eligible Amount</p>
                <p className={cn(
                  "text-sm font-bold",
                  claim.eligible_reimbursement_amount ? "text-accent-green" : "text-text-muted"
                )}>
                  {claim.eligible_reimbursement_amount ? formatCurrency(claim.eligible_reimbursement_amount) : 'Not calculated yet'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Last Updated</p>
                <p className="text-sm text-text-primary font-medium">{format(new Date(claim.last_updated_timestamp), 'PPP')}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <FileText className="text-accent-blue" size={20} />
            <h2 className="text-lg font-bold text-white font-space">Documents Section</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {documents.map((doc) => (
              <div key={doc.document_id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 flex items-start gap-4">
                  <div className="p-3 bg-accent-blue/10 rounded-xl text-accent-blue">
                    <File size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white truncate">{doc.file_name}</p>
                      <button 
                        onClick={() => setExpandedDoc(expandedDoc === doc.document_id ? null : doc.document_id)}
                        className="p-1.5 rounded-lg bg-white/5 text-text-muted hover:text-white transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                      >
                        {expandedDoc === doc.document_id ? <><ChevronUp size={14} /> Hide AI Report</> : <><BrainCircuit size={14} className="text-accent-purple" /> View AI Report</>}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-text-muted bg-white/5 px-1.5 py-0.5 rounded">
                        {doc.file_hash.substring(0, 20)}...
                      </span>
                      <span className="text-[10px] text-text-muted">{(doc.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green text-[10px] font-bold border border-accent-green/20">
                        <ShieldCheck size={10} /> VERIFIED
                      </span>
                      <span className="text-[10px] text-text-muted ml-auto">Uploaded: {format(new Date(doc.upload_timestamp), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedDoc === doc.document_id && doc.ai_analysis && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 bg-accent-purple/[0.02]"
                    >
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-accent-purple uppercase tracking-widest flex items-center gap-2">
                              <BrainCircuit size={14} /> Gemini AI Analysis
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-text-muted">CONFIDENCE</span>
                              <span className="text-xs font-bold text-accent-purple">{(doc.ai_analysis.confidence_score * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Extracted Amount</p>
                              <p className="text-lg font-bold text-white font-space mt-1">
                                {doc.ai_analysis.extracted_amount ? formatCurrency(doc.ai_analysis.extracted_amount) : 'N/A'}
                              </p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Extracted Date</p>
                              <p className="text-sm text-text-primary font-bold mt-1">
                                {doc.ai_analysis.extracted_date || 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex-1">Legibility</p>
                            {doc.ai_analysis.is_legible ? (
                              <span className="text-[10px] font-bold text-accent-green flex items-center gap-1">
                                <CheckCircle2 size={12} /> CLEAR
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-accent-red flex items-center gap-1">
                                <AlertTriangle size={12} /> POOR
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">AI Summary</p>
                            <p className="text-xs text-text-secondary leading-relaxed">{doc.ai_analysis.summary}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Integrity Check</p>
                            <div className="flex flex-wrap gap-2">
                              {doc.ai_analysis.potential_fraud_flags.length > 0 ? (
                                doc.ai_analysis.potential_fraud_flags.map((flag, i) => (
                                  <span key={i} className="px-2 py-1 rounded bg-accent-red/10 text-accent-red text-[10px] font-bold border border-accent-red/20 flex items-center gap-1">
                                    <AlertTriangle size={10} /> {flag}
                                  </span>
                                ))
                              ) : (
                                <span className="px-2 py-1 rounded bg-accent-green/10 text-accent-green text-[10px] font-bold border border-accent-green/20 flex items-center gap-1">
                                  <CheckCircle2 size={10} /> NO ANOMALIES DETECTED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* SLA Timeline */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-2">SLA Timeline</h3>
          <div className="space-y-0 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
            {[
              { status: 'DRAFT', date: claim.submission_timestamp || claim.last_updated_timestamp },
              { status: 'SUBMITTED', date: claim.submission_timestamp || claim.last_updated_timestamp },
              { status: claim.claim_status, date: claim.last_updated_timestamp }
            ].map((log, i) => (
              <div key={i} className="flex items-start gap-6 py-3 relative">
                <div className={cn(
                  "w-6 h-6 rounded-full border-4 border-primary-bg z-10 flex items-center justify-center",
                  i === 2 ? "bg-accent-purple" : "bg-white/10"
                )} />
                <div>
                  <p className="text-xs font-bold text-white">{log.status.replace('_', ' ')}</p>
                  <p className="text-[10px] text-text-muted">{format(new Date(log.date), 'PPP p')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
