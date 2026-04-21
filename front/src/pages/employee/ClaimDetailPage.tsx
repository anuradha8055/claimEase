import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTransition } from '../../components/layout/PageTransition';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency, cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import * as mrs from '../../api/mrs';
import { Claim, Document } from '../../types';
import { 
  ArrowLeft, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  FileCheck,
  Calendar,
  Stethoscope,
  IndianRupee,
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

export const ClaimDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    const fetchClaimAndDocuments = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // Fetch claim details
        const claimData = await mrs.getClaimDetails(id);
        setClaim(claimData);

        // Fetch documents for this claim
        setLoadingDocs(true);
        try {
          const docsData = await mrs.getClaimDocuments(id);
          setDocuments(docsData);
        } catch (err) {
          console.log('No documents found for this claim or fetch failed');
          setDocuments([]);
        }
      } catch (error) {
        console.error('Error fetching claim:', error);
        toast.error('Failed to load claim details');
      } finally {
        setLoading(false);
        setLoadingDocs(false);
      }
    };

    fetchClaimAndDocuments();
  }, [id]);

  const handleViewDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await mrs.getDocumentViewUrl(documentId);
      window.open(response.url, '_blank');
    } catch (error) {
      console.error('Error generating view URL:', error);
      toast.error('Failed to generate view link for document');
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-screen">
          <motion.div 
            className="w-16 h-16 border-4 border-accent-purple border-t-transparent rounded-full animate-spin"
          />
        </div>
      </PageTransition>
    );
  }

  if (!claim) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-screen">
          <GlassCard className="p-8 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-accent-red" />
            <h1 className="text-xl font-bold text-white mb-2">Claim not found</h1>
            <button
              onClick={() => navigate('/employee')}
              className="text-accent-blue hover:text-accent-purple transition-colors mt-4"
            >
              Go back to dashboard
            </button>
          </GlassCard>
        </div>
      </PageTransition>
    );
  }

  // Type guard for required fields
  if (!claim.claim_status || !claim.claim_number || !claim.total_bill_amount || !claim.admission_date || !claim.discharge_date) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-screen">
          <GlassCard className="p-8 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-accent-red" />
            <h1 className="text-xl font-bold text-white mb-2">Invalid claim data</h1>
            <button
              onClick={() => navigate('/employee')}
              className="text-accent-blue hover:text-accent-purple transition-colors mt-4"
            >
              Go back to dashboard
            </button>
          </GlassCard>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/employee')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold font-space text-white">Claim Details</h1>
            <p className="text-text-muted text-sm">Claim #{claim.claim_number}</p>
          </div>
        </div>

        {/* Claim Information */}
        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-space text-white">Claim Information</h2>
            <StatusBadge status={claim.claim_status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Claim Number</p>
              <p className="text-lg font-mono text-accent-purple">{claim.claim_number}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                <Stethoscope size={14} />
                Diagnosis
              </p>
              <p className="text-white">{claim.diagnosis}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                <IndianRupee size={14} />
                Total Bill Amount
              </p>
              <p className="text-xl font-bold text-white">{formatCurrency(claim.total_bill_amount)}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                <Calendar size={14} />
                Admission Date
              </p>
              <p className="text-white">{format(new Date(claim.admission_date), 'MMM dd, yyyy')}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                <Calendar size={14} />
                Discharge Date
              </p>
              <p className="text-white">{format(new Date(claim.discharge_date), 'MMM dd, yyyy')}</p>
            </div>

            {claim.eligible_reimbursement_amount && (
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-accent-green" />
                  Eligible Amount
                </p>
                <p className="text-xl font-bold text-accent-green">{formatCurrency(claim.eligible_reimbursement_amount)}</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Documents Section */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-space text-white flex items-center gap-2">
              <FileText size={24} />
              Documents
            </h2>
            {documents.length > 0 && (
              <div className="flex items-center gap-2 text-accent-green">
                <CheckCircle2 size={20} />
                <span className="text-sm font-bold">{documents.length} document(s)</span>
              </div>
            )}
          </div>

          {loadingDocs ? (
            <div className="flex items-center justify-center py-8">
              <motion.div 
                className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"
              />
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <FileText size={32} className="mx-auto mb-3 text-text-muted opacity-50" />
              <p className="text-text-muted">No documents uploaded for this claim</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <motion.div
                  key={doc.document_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-accent-blue/20 rounded-lg text-accent-blue">
                      <FileCheck size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{doc.document_type || 'Document'}</p>
                      <p className="text-xs text-text-muted">
                        {doc.file_name || 'Uploaded document'} 
                        {doc.file_size && ` • ${(doc.file_size / 1024).toFixed(2)} KB`}
                      </p>
                      {doc.upload_timestamp && (
                        <p className="text-[10px] text-text-muted/70 mt-1">
                          Uploaded on {format(new Date(doc.upload_timestamp), 'MMM dd, yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewDocument(String(doc.document_id), doc.file_name || 'document')}
                    className="p-2 hover:bg-accent-blue/20 rounded-lg transition-colors text-accent-blue flex items-center gap-2 text-xs font-bold opacity-0 group-hover:opacity-100"
                  >
                    <LinkIcon size={16} />
                    View
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Timeline / Additional Info */}
        {claim.submission_timestamp && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold font-space text-white mb-4">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent-blue"></div>
                <div>
                  <p className="text-sm font-semibold text-white">Submitted</p>
                  <p className="text-xs text-text-muted">
                    {format(new Date(claim.submission_timestamp), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
              {claim.last_updated_timestamp && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent-purple"></div>
                  <div>
                    <p className="text-sm font-semibold text-white">Last Updated</p>
                    <p className="text-xs text-text-muted">
                      {format(new Date(claim.last_updated_timestamp), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        )}
      </div>
    </PageTransition>
  );
};
