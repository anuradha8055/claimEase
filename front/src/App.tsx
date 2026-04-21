/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { NewClaimPage } from './pages/employee/NewClaimPage';
import { EditClaimPage } from './pages/employee/EditClaimPage';
import { ClaimDetailPage } from './pages/employee/ClaimDetailPage';
import { DocumentUploadPage } from './pages/employee/DocumentUploadPage';
import { QueriesPage } from './pages/employee/QueriesPage';
import { ProfilePage } from './pages/employee/ProfilePage';
import { OfficerQueue } from './pages/officer/OfficerQueue';
import { ClaimReviewPage } from './pages/officer/ClaimReviewPage';
import { DDOSanctionedPage } from './pages/officer/DDOSanctionedPage';
import { AnimatePresence } from 'motion/react';
import { SignupPage } from './pages/signupPage';


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f0d2a',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              backdropFilter: 'blur(16px)',
            },
          }}
        />
        <AnimatePresence mode="wait">
          <Routes>

            
            <Route path="/login" element={<LoginPage />} />

            <Route path="/signup" element={<SignupPage />} />

            
            {/* Employee Routes */}
            <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
              <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
              <Route path="/employee" element={<EmployeeDashboard />} />
              <Route path="/employee/new-claim" element={<NewClaimPage />} />
              <Route path="/employee/edit-claim/:id" element={<EditClaimPage />} />
              <Route path="/employee/claims/:id" element={<ClaimDetailPage />} />
              <Route path="/employee/document-upload" element={<DocumentUploadPage />} />
              <Route path="/employee/documents" element={<DocumentUploadPage />} />
              <Route path="/employee/queries" element={<QueriesPage />} />
              <Route path="/employee/profile" element={<ProfilePage />} />
            </Route>

            {/* Scrutiny Officer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['SCRUTINY_OFFICER']} />}>
              <Route path="/scrutiny/queue" element={<OfficerQueue />} />
              <Route path="/scrutiny/review/:id" element={<ClaimReviewPage />} />
            </Route>

            {/* Medical Officer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['MEDICAL_OFFICER']} />}>
              <Route path="/medical/queue" element={<OfficerQueue />} />
              <Route path="/medical/review/:id" element={<ClaimReviewPage />} />
            </Route>

            {/* Finance Officer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['FINANCE_OFFICER']} />}>
              <Route path="/finance/queue" element={<OfficerQueue />} />
              <Route path="/finance/review/:id" element={<ClaimReviewPage />} />
            </Route>

            {/* DDO Routes */}
            <Route element={<ProtectedRoute allowedRoles={['DDO']} />}>
              <Route path="/ddo/queue" element={<OfficerQueue />} />
              <Route path="/ddo/review/:id" element={<ClaimReviewPage />} />
              <Route path="/ddo/sanctioned" element={<DDOSanctionedPage />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </AuthProvider>
  );
}
