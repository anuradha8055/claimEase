import React, { useState, useEffect } from 'react';
import { PageTransition } from '../../components/layout/PageTransition';
import { GlassCard } from '../../components/ui/GlassCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { QueryResponse } from '../../types';
import { MessageCircle, Send, Clock, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import * as mrs from '../../api/mrs';

type EmployeeQuery = QueryResponse;

export const QueriesPage: React.FC = () => {
  const [queries, setQueries] = useState<EmployeeQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<EmployeeQuery | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) setUploadFile(file);
};
  useEffect(() => {
    const fetchQueries = async () => {
      try {
        setLoading(true);
        const data = await mrs.getMyQueries();
        setQueries(data);
      } catch (error) {
        console.error('Error fetching employee queries:', error);
        toast.error('Failed to load queries');
      } finally {
        setLoading(false);
      }
    };

    fetchQueries();
  }, []);

  const handleRespond = async () => {
    if (!responseText.trim() || !selectedQuery) return;

    try {
      setSubmitting(true);
      await mrs.respondToQuery(String(selectedQuery.query_id), responseText.trim());
      setQueries((prev) => prev.filter((q) => q.query_id !== selectedQuery.query_id));
      setSelectedQuery(null);
      setResponseText('');
      toast.success('Response submitted successfully');
    } catch (error) {
      console.error('Error submitting query response:', error);
      toast.error('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const getClaimNumber = (claimId: string) => String(claimId).slice(0, 8).toUpperCase();

  const getRaisedByStage = (raisedStage: number) => {
    const stageMap: Record<number, string> = {
      2: 'SCRUTINY OFFICER',
      3: 'MEDICAL OFFICER',
      4: 'FINANCE OFFICER',
      5: 'DDO',
    };
    return stageMap[raisedStage] || 'OFFICER';
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Queries</h1>
            <p className="text-text-secondary text-sm">View and respond to queries raised by officers for your claims.</p>
          </div>
          <div className="px-4 py-2 bg-accent-orange/10 border border-accent-orange/20 rounded-xl text-accent-orange font-bold text-sm">
            {queries.length} Total
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-10 h-10 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
                <p className="text-text-secondary mt-4">Loading queries...</p>
              </motion.div>
            ) : queries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-text-muted mb-4">
                  <MessageCircle size={40} />
                </div>
                <h3 className="text-xl font-bold text-white font-space">No Queries Found</h3>
                <p className="text-text-secondary">No queries are available for your claims yet.</p>
              </motion.div>
            ) : (
              queries.map((query) => (
                <motion.div
                  key={query.query_id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <GlassCard className="p-0 overflow-hidden border-l-4 border-l-accent-orange">
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-accent-purple font-bold">{getClaimNumber(String(query.claim_id))}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-muted font-bold uppercase tracking-wider flex items-center gap-1">
                            <User size={10} /> Raised by {getRaisedByStage(query.raised_stage)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold">
                          <Clock size={12} /> {format(new Date(query.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>

                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-sm text-text-primary leading-relaxed">{query.query_text}</p>
                      </div>

                      <div className="flex justify-end gap-3">
                        
                        <GradientButton 
                          variant="warning" 
                          className="text-xs px-6 py-2 gap-2"
                          onClick={() => setSelectedQuery(query)}
                        >
                          Respond <ArrowRight size={14} />
                        </GradientButton>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Respond Modal (Slide-up) */}
        <AnimatePresence>
          {selectedQuery && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedQuery(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 flex items-center justify-center z-[70]"
              >
                {/* <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" /> */}
                {/* <div className="bg-secondary-bg border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl"></div> */}
                
                {/* <div className="space-y-6"> */}

                <div className="bg-secondary-bg border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-6">
                
                  <header>
                    <h2 className="text-xl font-bold text-white font-space">Respond to Query</h2>
                    <p className="text-sm text-text-secondary">Claim: {getClaimNumber(String(selectedQuery.claim_id))}</p>
                  </header>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Query Message</label>
                    <div className="p-4 bg-accent-orange/10 border border-accent-orange/20 rounded-xl">
                      <p className="text-sm text-text-primary italic">"{selectedQuery.query_text}"</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Your Response</label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={5}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-purple transition-all resize-none"
                      placeholder="Type your response here..."
                    />
                  </div>

                  {/* ✅ ADD UPLOAD SECTION HERE */}
<div className="space-y-2">
  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
    Upload Document
  </label>

  <div
    onClick={() => document.getElementById('fileInput')?.click()}
    className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center cursor-pointer hover:border-accent-purple transition"
  >
    <input
      id="fileInput"
      type="file"
      className="hidden"
      onChange={(e) => {
        if (e.target.files) {
          setUploadFile(e.target.files[0]);
        }
      }}
    />

    <p className="text-sm text-white">
      {uploadFile ? uploadFile.name : "Click to upload document"}
    </p>

    <p className="text-xs text-text-muted">
      PDF, JPG, PNG — max 10MB
    </p>
  </div>
</div>

{/* Buttons */}
<div className="flex gap-4 pt-2"></div>

                  <div className="flex gap-4 pt-2">
                    <GradientButton 
                      variant="outline" 
                      fullWidth 
                      onClick={() => setSelectedQuery(null)}
                    >
                      Cancel
                    </GradientButton>
                    <GradientButton 
                      fullWidth 
                      loading={submitting}
                      onClick={handleRespond}
                      className="gap-2"
                    >
                      Submit Response <Send size={18} />
                    </GradientButton>
                  </div>
                </div>
              </motion.div>
            </>
          )}
          <AnimatePresence>
 
</AnimatePresence>
          
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};