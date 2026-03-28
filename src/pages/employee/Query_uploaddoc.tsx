import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageTransition } from '../../components/layout/PageTransition';
import { GlassCard } from '../../components/ui/GlassCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { UploadCloud, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';



export const Query_uploaddoc: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const claimId = location.state?.claimId || '';

  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('HOSPITAL_BILL');

  const handleUpload = () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    console.log('Uploading:', { claimId, docType, file });
    toast.success('Uploaded successfully!');
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/5"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold text-white">
            Smart Document Upload
          </h1>
        </div>

        <GlassCard className="p-6 space-y-6">

          {/* Claim ID */}
          <input
            value={claimId}
            disabled
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
          />

          {/* Document Type */}
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full bg-[#1A1F2E] text-white border border-white/10 rounded-xl px-4 py-3"
          >
            <option value="HOSPITAL_BILL">Hospital Bill</option>
            <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
            <option value="PRESCRIPTION">Prescription</option>
          </select>

          {/* Upload Box */}
          <label className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent-purple transition-all">
            <UploadCloud size={40} className="text-text-muted mb-3" />
            <p className="text-white font-medium">Click or drag to upload</p>
            <p className="text-xs text-text-muted">
              PDF, JPG, PNG — max 10MB
            </p>

            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  setFile(e.target.files[0]);
                }
              }}
            />
          </label>

          {/* File name */}
          {file && (
            <p className="text-sm text-accent-green">
              Selected: {file.name}
            </p>
          )}

          {/* Upload Button */}
          <GradientButton fullWidth onClick={handleUpload}>
            Upload & Analyze
          </GradientButton>

        </GlassCard>
      </div>
    </PageTransition>
  );
};