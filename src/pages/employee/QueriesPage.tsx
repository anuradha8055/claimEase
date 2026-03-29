
import React, { useState, useEffect } from 'react';
import { PageTransition } from '../../components/layout/PageTransition';
import { GlassCard } from '../../components/ui/GlassCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { QueryResponse } from '../../types';
import { MessageCircle, Send, Clock, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export const QueriesPage: React.FC = () => {
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<any | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadQuery, setUploadQuery] = useState<any | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) setUploadFile(file);
};
  useEffect(() => {
    // Mock data
    const mockQueries: any[] = [
      {
        query_id: 1,
        claim_id: 103,
        claim_number: 'CLM-2026-003',
        raised_stage: 'SCRUTINY_OFFICER',
        query_description: 'The hospital bill is missing the official stamp and signature from the medical superintendent. Please upload a stamped copy.',
        response_text: null,
        query_status: 'OPEN',
        created_timestamp: '2026-03-22T14:30:00Z',
      }
    ];
    setQueries(mockQueries);
    setLoading(false);
  }, []);

  const handleRespond = async () => {
    if (!responseText.trim() || !selectedQuery) return;

    setSubmitting(true);
    // Mock API call
    setTimeout(() => {
      setQueries(prev => prev.filter(q => q.query_id !== selectedQuery.query_id));
      setSelectedQuery(null);
      setResponseText('');
      setSubmitting(false);
      toast.success('Response submitted successfully');
    }, 1500);
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Pending Queries</h1>
            <p className="text-text-secondary text-sm">Respond to queries raised by officers to proceed with your claim.</p>
          </div>
          <div className="px-4 py-2 bg-accent-orange/10 border border-accent-orange/20 rounded-xl text-accent-orange font-bold text-sm">
            {queries.length} Pending
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {queries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-text-muted mb-4">
                  <MessageCircle size={40} />
                </div>
                <h3 className="text-xl font-bold text-white font-space">No Pending Queries</h3>
                <p className="text-text-secondary">All your claims are currently in processing.</p>
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
                          <span className="text-xs font-mono text-accent-purple font-bold">{query.claim_number}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-muted font-bold uppercase tracking-wider flex items-center gap-1">
                            <User size={10} /> Raised by {query.raised_stage.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold">
                          <Clock size={12} /> {format(new Date(query.created_timestamp), 'MMM dd, yyyy')}
                        </div>
                      </div>

                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-sm text-text-primary leading-relaxed">{query.query_description}</p>
                      </div>

                      <div className="flex justify-end gap-3">
                        <GradientButton 
                        variant="outline"
                        className="text-xs px-6 py-2 gap-2"
                        onClick={() => setUploadQuery(query)}
                        >
                          Upload Document
                         </GradientButton>

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
                <div className="bg-secondary-bg border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl"></div>
                <div className="space-y-6">
                  <header>
                    <h2 className="text-xl font-bold text-white font-space">Respond to Query</h2>
                    <p className="text-sm text-text-secondary">Claim: {selectedQuery.claim_number}</p>
                  </header>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Query Message</label>
                    <div className="p-4 bg-accent-orange/10 border border-accent-orange/20 rounded-xl">
                      <p className="text-sm text-text-primary italic">"{selectedQuery.query_description}"</p>
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
  {uploadQuery && (
    <>
      {/* Background Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setUploadQuery(null)}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
      />

      {/* CENTER WRAPPER */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 flex items-center justify-center z-[70]"
      >
        {/* ACTUAL BOX */}
        <div className="bg-secondary-bg border border-white/10 rounded-2xl p-8 w-full max-w-xl shadow-2xl space-y-6">

          <h2 className="text-xl font-bold text-white text-center">
            Upload Document for {uploadQuery.claim_number}
          </h2>

          {/* Drag Drop */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) setUploadFile(file);
            }}
            onClick={() => document.getElementById('queryFileInput')?.click()}
            className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center cursor-pointer hover:border-white/20 transition"
          >
            <input 
              id="queryFileInput"
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />

            <p className="text-sm font-bold text-text-primary">
              {uploadFile ? uploadFile.name : "Click or drag to upload"}
            </p>

            <p className="text-xs text-text-muted mt-1">
              PDF, JPG, PNG — max 10MB
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <GradientButton 
              variant="outline" 
              fullWidth 
              onClick={() => setUploadQuery(null)}
            >
              Cancel
            </GradientButton>

            <GradientButton 
              fullWidth 
              onClick={() => {
                if (!uploadFile) {
                  toast.error("Please select a file");
                  return;
                }
                toast.success("Document uploaded successfully");
                setUploadQuery(null);
                setUploadFile(null);
              }}
            >
              Upload
            </GradientButton>
          </div>

        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
          
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};
