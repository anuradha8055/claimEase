import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientButton } from '../components/ui/GradientButton';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    department: '',
    profession: '',
    employeeId: '',
    contact: '',
    email: '',
    role: '',
    password: '',
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = (e: any) => {
    e.preventDefault();

    console.log('Signup Data:', form);

    toast.success('Account created successfully!');
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full bg-primary-bg flex items-center justify-center p-6 relative overflow-hidden">

      {/* Background same as login */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-purple/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-orange/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-violet flex items-center justify-center mb-4">
            <CheckCircle className="text-white" size={30} />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
        </div>

        <GlassCard className="p-6 space-y-4">

          <form onSubmit={handleSignup} className="space-y-4">

            {/* Name */}
            <input
              name="name"
              placeholder="Full Name"
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            />

            {/* Department */}
            <input
              name="department"
              placeholder="Department"
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            />

            {/* Profession */}
            <input
              name="profession"
              placeholder="Profession"
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            />

            {/* Employee ID */}
            <input
              name="employeeId"
              placeholder="Employee ID"
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            />

            {/* Contact */}
            <input
              name="contact"
              placeholder="Contact Number"
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            />

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            />

            {/* Role Dropdown */}
            <select
              name="role"
              onChange={handleChange}
              className="w-full bg-[#1A1F2E] text-white border border-white/10 rounded-xl px-4 py-3"
            >
              <option value="">Select Role</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="SCRUTINY_OFFICER">Scrutiny Officer</option>
              <option value="MEDICAL_OFFICER">Medical Officer</option>
              <option value="FINANCE_OFFICER">Finance Officer</option>
              <option value="DDO">DDO</option>
            </select>

            {/* Password */}
            <input
              type="password"
              name="password"
              placeholder="Set Password"
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            />

            {/* Submit */}
            <GradientButton fullWidth type="submit">
              Sign Up
            </GradientButton>

          </form>

          {/* Back to Login */}
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-accent-purple w-full text-center mt-2"
          >
            Already have an account? Login
          </button>

        </GlassCard>
      </motion.div>
    </div>
  );
};