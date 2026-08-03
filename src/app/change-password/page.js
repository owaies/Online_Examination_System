"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ForcedChangePassword() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password cannot be the same as your current temporary password.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');

      setSuccess('Password updated successfully!');
      setTimeout(() => {
        if (data.role === 'super_admin') router.push('/superadmin');
        else if (data.role === 'admin') router.push('/admin');
        else if (data.role === 'teacher') router.push('/teacher');
        else router.push('/student');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white bg-background flex flex-col justify-between relative z-10 p-6">
      
      {/* Navbar header */}
      <nav className="py-4 flex justify-between items-center max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2.5 text-base font-heading font-black tracking-wider text-white">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-teal to-accent-teal-light flex items-center justify-center">
            <Lock className="text-white w-4 h-4" />
          </div>
          <span>E-EXAMINER SECURITY</span>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-rose-500 hover:underline cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Abort Logout
        </button>
      </nav>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-zinc-950 border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden space-y-6"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-accent-teal to-transparent" />
          
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <ShieldAlert className="w-6 h-6 text-amber-500" />
            </div>
            <h1 className="text-xl font-heading font-black">Reset Temporary Password</h1>
            <p className="text-text-muted text-xs leading-relaxed max-w-xs">
              For platform security, you must update your temporary credentials before gaining access to E-Examiner features.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted uppercase font-bold">Temporary Password *</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter temporary password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-11 text-xs focus:outline-none focus:border-accent-teal/50 transition-all text-white placeholder:text-text-subtle"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-3 text-text-subtle hover:text-white transition-colors cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted uppercase font-bold">New Secure Password *</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-11 text-xs focus:outline-none focus:border-accent-teal/50 transition-all text-white placeholder:text-text-subtle"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-3 text-text-subtle hover:text-white transition-colors cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted uppercase font-bold">Confirm New Password *</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-11 text-xs focus:outline-none focus:border-accent-teal/50 transition-all text-white placeholder:text-text-subtle"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-3 text-text-subtle hover:text-white transition-colors cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-rose-400 text-xs font-semibold text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">
                {error}
              </div>
            )}

            {success && (
              <div className="text-emerald-400 text-xs font-semibold text-center bg-emerald-500/10 py-2 rounded-lg flex items-center justify-center gap-1.5 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4" />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center shadow-lg shadow-accent-teal/20 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
            >
              {loading ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-text-muted text-[9px] tracking-widest">
        <p>e-EXAMINER &copy; 2026. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}
