import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientButton } from '../components/ui/GradientButton';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { set } from 'date-fns';
import * as mrs from '../api/mrs';


type SignupRole = 
| 'EMPLOYEE' 
| 'SCRUTINY_OFFICER' 
| 'MEDICAL_OFFICER' 
| 'FINANCE_OFFICER' 
| 'DDO';


const Role_Options: { label: string; value: SignupRole }[] = [
  { label: 'Employee', value: 'EMPLOYEE' },
  { label: 'Scrutiny Officer', value: 'SCRUTINY_OFFICER' },
  { label: 'Medical Officer', value: 'MEDICAL_OFFICER' },
  { label: 'Finance Officer', value: 'FINANCE_OFFICER' },
  { label: 'DDO', value: 'DDO' },
];


const Department_Names = [
  "Administration",
  "Finance and Taxation",
  "Agriculture and Allied Services",
  "Education",
  "Health",
  "Information Technology",
  "Disaster Management",
  "Police and Law Enforcement",
  "Cleanliness and Sanitation",
  "women and child development",
  "Research and Development",
  "Urban Development",
  "Rural Development",
  "Public Works ",
  "Transport and communication",
  "Social Welfare",
  "Energy and Environment",
  "Tourism and Culture",
  "Sports and Youth Affairs",
  "Legal and Judicial",
  "Defense and Security",
  "Labor and Employment",
] as const;


export function SignupPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    profession: '',
    employeeId: '',
    contact: '',
    email: '',
    role: 'EMPLOYEE' as SignupRole,
    password: '',
  });


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ 
      ...prev, [e.target.name]: e.target.value }));
  };


  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    if (!formData) {
      toast.error("Please fill all required fields");
      setBusy(false);
      return;
    }

    const body: Parameters<typeof mrs.register>[0] = {
      name: formData.name.trim(),
      department: formData.department.trim(),
      profession: formData.profession.trim(),
      employeeId: formData.employeeId,
      contact: formData.contact,
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      password: formData.password,
    };

    try {
      await mrs.register(body);
      toast.success("Account created successfully! Please login.");
      navigate('/login');
    } catch (error) {
      toast.error("Failed to create account. Please try again.");
      return;
    }   
    finally {
      setBusy(false);
    }
   
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
            <select
              name="department"
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-black"
            >
              <option value="">Select Department</option>
              {Department_Names.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

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