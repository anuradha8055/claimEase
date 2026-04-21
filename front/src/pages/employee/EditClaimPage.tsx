import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTransition } from '../../components/layout/PageTransition';
import { GlassCard } from '../../components/ui/GlassCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';
import * as mrs from '../../api/mrs';
import { Claim, Document } from '../../types';
import {
  ArrowLeft,
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Link as LinkIcon,
  FileCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { formatCurrency } from '../../lib/utils';

export const EditClaimPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [claim, setClaim] = useState<Claim | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingDocs, setCheckingDocs] = useState(false);

  useEffect(() => {
    const fetchClaimAndDocs = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        // Fetch claim details
        const claimData = await mrs.getClaimDetails(id);
        setClaim(claimData);

        // Fetch documents
        setCheckingDocs(true);
        const docsData = await mrs.getClaimDocuments(id);
        setDocuments(docsData);
      } catch (error) {
        console.error('Error fetching claim/documents:', error);
        toast.error('Failed to load claim details');
      } finally {
        setLoading(false);
        setCheckingDocs(false);
      }
    };

    fetchClaimAndDocs();
  }, [id]);

  const handleSubmitClaim = async () => {
    if (!claim || !id) return;

    if (documents.length === 0) {
      toast.error('Cannot submit claim without documents. Please upload at least one document.');
      return;
    }

    try {
      setSubmitting(true);
      await mrs.submitClaimWorkflow(id);
      toast.success('Claim submitted successfully!');
      navigate('/employee');
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error('Failed to submit claim. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await mrs.getDocumentViewUrl(documentId);
      window.open(response.url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to generate view link');
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
              className="text-accent-blue hover:text-accent-purple transition-colors"
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
            <h1 className="text-3xl font-bold font-space text-white">Edit Claim</h1>
            <p className="text-text-muted text-sm">Claim #{claim.claim_number}</p>
          </div>
        </div>

        {/* Claim Details */}
        <GlassCard className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Claim ID</p>
              <p className="text-lg font-mono text-accent-purple">{claim.claim_number}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Status</p>
              <StatusBadge status={claim.claim_status} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Diagnosis</p>
              <p className="text-white">{claim.diagnosis}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Total Bill Amount</p>
              <p className="text-xl font-bold text-white">{formatCurrency(claim.total_bill_amount)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Admission Date</p>
              <p className="text-white">{format(new Date(claim.admission_date), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Discharge Date</p>
              <p className="text-white">{format(new Date(claim.discharge_date), 'MMM dd, yyyy')}</p>
            </div>
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

          {checkingDocs ? (
            <div className="flex items-center justify-center py-8">
              <motion.div 
                className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"
              />
            </div>
          ) : documents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 flex items-start gap-3"
            >
              <AlertTriangle size={20} className="text-accent-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-accent-red mb-1">No documents found</p>
                <p className="text-sm text-text-secondary">
                  You must upload at least one document before submitting this claim. Go to Document Upload section to upload supporting documents.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <motion.div
                  key={doc.document_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-accent-blue/20 rounded-lg text-accent-blue">
                      <FileCheck size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{doc.document_type || 'Document'}</p>
                      <p className="text-xs text-text-muted">
                        {doc.file_name || 'Uploaded document'} • {doc.file_size ? `${(doc.file_size / 1024).toFixed(2)} KB` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewDocument(doc.document_id, doc.file_name || 'document')}
                    className="p-2 hover:bg-accent-blue/20 rounded-lg transition-colors text-accent-blue flex items-center gap-2 text-xs font-bold"
                  >
                    <LinkIcon size={16} />
                    View
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Upload More Documents Link */}
          <button
            onClick={() => navigate(`/employee/document-upload`)}
            className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-accent-purple/50 hover:border-accent-purple hover:bg-accent-purple/5 transition-all text-accent-purple font-semibold flex items-center justify-center gap-2"
          >
            <FileText size={18} />
            Upload More Documents
          </button>
        </GlassCard>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/employee')}
            className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-semibold text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitClaim}
            disabled={documents.length === 0 || submitting}
            className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              documents.length === 0 || submitting
                ? 'bg-white/10 text-text-muted cursor-not-allowed'
                : 'bg-gradient-to-r from-accent-purple to-accent-violet hover:shadow-lg hover:shadow-accent-purple/50 text-white'
            }`}
          >
            {submitting ? (
              <>
                <motion.div 
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Submit Claim
              </>
            )}
          </button>
        </div>
      </div>
    </PageTransition>
  );
};
