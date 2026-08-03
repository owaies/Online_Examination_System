"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, UserPlus, Trash2, LogOut, ShieldAlert, Mail, Lock,
  GraduationCap, CheckCircle, HelpCircle, Sparkles, Building, Globe, MapPin, Phone,
  Plus, Search, ArrowRight, Eye, EyeOff, CheckSquare
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('institutions'); // 'institutions' | 'add'
  const [institutions, setInstitutions] = useState([]);
  const [stats, setStats] = useState({
    totalInstitutions: 0,
    activeInstitutions: 0,
    suspendedInstitutions: 0,
    totalTeachers: 0,
    totalStudents: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Add Institution state
  const [form, setForm] = useState({
    name: '', institutionCode: '', institutionType: 'School', email: '', phone: '', website: '', address: '', logoUrl: '',
    adminName: '', adminEmail: '', adminPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [addSuccess, setAddSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Details modal state
  const [selectedInstDetails, setSelectedInstDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Custom dialog state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  });

  const showAlert = (message, title = 'Notification') => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title,
        message,
        onConfirm: () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        }
      });
    });
  };

  const showConfirm = (message, title = 'Confirmation') => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        onConfirm: () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  const fetchInstitutions = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (filterType) queryParams.set('type', filterType);
      if (filterStatus) queryParams.set('status', filterStatus);

      const res = await fetch(`/api/superadmin/institutions?${queryParams.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/');
          return;
        }
        throw new Error('Failed to load institutions');
      }
      const json = await res.json();
      setInstitutions(json.institutions || []);
      setStats(json.stats || stats);
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, [search, filterType, filterStatus]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleAddInstitution = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAddSuccess('');

    try {
      const res = await fetch('/api/superadmin/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create institution');

      setAddSuccess('Institution and administrator created successfully!');
      setForm({
        name: '', institutionCode: '', institutionType: 'School', email: '', phone: '', website: '', address: '', logoUrl: '',
        adminName: '', adminEmail: '', adminPassword: ''
      });
      fetchInstitutions();
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleInstitutionStatus = async (inst) => {
    const isSuspended = inst.status === 'suspended';
    const action = isSuspended ? 'activate' : 'suspend';
    
    const confirmed = await showConfirm(
      `Are you sure you want to ${action} "${inst.name}"? Users from this institution will ${isSuspended ? 'regain access' : 'be blocked from access'}.`,
      `${isSuspended ? 'Activate' : 'Suspend'} Institution`
    );

    if (!confirmed) return;

    try {
      const newStatus = isSuspended ? 'active' : 'suspended';
      const res = await fetch(`/api/superadmin/institutions/${inst.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update institution status');
      
      showAlert(`Institution has been successfully ${isSuspended ? 'activated' : 'suspended'}.`, 'Success');
      fetchInstitutions();
    } catch (err) {
      showAlert(err.message, 'Error');
    }
  };

  const viewInstitutionDetails = async (inst) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/superadmin/institutions/${inst.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load details');
      setSelectedInstDetails(data);
    } catch (err) {
      showAlert(err.message, 'Error');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative flex bg-background z-10">
      {/* Sidebar Nav */}
      <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-md p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accent-teal to-teal-500 flex items-center justify-center shadow-lg shadow-accent-teal/20">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-heading font-black tracking-tight text-base leading-none">E-EXAMINER</h2>
              <span className="text-[10px] text-accent-teal font-bold tracking-widest uppercase">PLATFORM SUPERADMIN</span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('institutions')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'institutions'
                  ? 'bg-white/5 border border-white/10 text-white shadow-md'
                  : 'text-text-muted hover:text-white hover:bg-white/2'
              }`}
            >
              <Building className="w-4 h-4" />
              Institutions List
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-white/5 border border-white/10 text-white shadow-md'
                  : 'text-text-muted hover:text-white hover:bg-white/2'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Institution
            </button>
            <button
              onClick={() => setActiveTab('change-password')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'change-password'
                  ? 'bg-white/5 border border-white/10 text-white shadow-md'
                  : 'text-text-muted hover:text-white hover:bg-white/2'
              }`}
            >
              <Lock className="w-4 h-4" />
              Change Password
            </button>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-text-muted hover:text-rose-400 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto max-h-screen">
        {/* Mobile Header Nav */}
        <header className="flex justify-between items-center md:hidden mb-8">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-accent-teal" />
            <span className="text-sm font-heading font-black">E-EXAMINER PLATFORM</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-text-muted hover:text-rose-400 p-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Tab view containers */}
        <AnimatePresence mode="wait">
          {activeTab === 'institutions' && (
            <motion.div
              key="institutions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Heading */}
              <div>
                <h1 className="text-3xl font-heading font-black mb-2">Platform Overview</h1>
                <p className="text-text-muted text-sm">Review collective metrics and manage tenants across the platform.</p>
              </div>

              {/* Statistics Panel */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { title: 'Total Tenants', value: stats.totalInstitutions, color: 'text-white' },
                  { title: 'Active Tenants', value: stats.activeInstitutions, color: 'text-emerald-400' },
                  { title: 'Suspended Tenants', value: stats.suspendedInstitutions, color: 'text-rose-400' },
                  { title: 'Platform Teachers', value: stats.totalTeachers, color: 'text-sky-400' },
                  { title: 'Platform Students', value: stats.totalStudents, color: 'text-accent-teal' }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-zinc-950 border border-white/10 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">{stat.title}</span>
                    <span className={`text-2xl font-black ${stat.color} mt-2`}>{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Filters & Actions Header */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/3 border border-white/5 p-4 rounded-2xl">
                <div className="relative w-full md:max-w-xs">
                  <Search className="w-4 h-4 text-text-subtle absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name or code..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                  />
                </div>

                <div className="flex gap-3 w-full md:w-auto justify-end">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-zinc-900 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-accent-teal/50 transition-all text-white cursor-pointer"
                  >
                    <option value="">All Types</option>
                    {['School', 'PU College', 'College', 'University', 'Training Institute', 'Coaching Institute', 'Other'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-zinc-900 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-accent-teal/50 transition-all text-white cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Institutions Listing Table */}
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 border-t-2 border-accent-teal rounded-full animate-spin"></div>
                  <p className="text-xs text-text-muted">Loading Institutions...</p>
                </div>
              ) : institutions.length === 0 ? (
                <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center text-text-muted text-xs italic">
                  No institutions matching filters found.
                </div>
              ) : (
                <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/3 text-xs uppercase tracking-wider text-text-muted font-bold">
                          <th className="p-4">Institution Name</th>
                          <th className="p-4">Code</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {institutions.map((inst) => (
                          <tr key={inst.id} className="hover:bg-white/2 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-white">{inst.name}</div>
                              <div className="text-[10px] text-text-subtle">{inst.email}</div>
                            </td>
                            <td className="p-4">
                              <span className="font-mono text-xs uppercase tracking-wider font-semibold text-sky-400 bg-sky-400/5 px-2 py-0.5 rounded-lg border border-sky-400/10">
                                {inst.institution_code}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-text-muted">{inst.institution_type}</td>
                            <td className="p-4">
                              <div className="flex md:hidden gap-1 bg-white/5 p-1 rounded-full text-[10px] mb-8 overflow-x-auto">
                                {[
                                  { id: 'institutions', label: 'Institutions' },
                                  { id: 'add', label: 'Add' },
                                  { id: 'change-password', label: 'Password' }
                                ].map((t) => (
                                  <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id)}
                                    className={`px-3 py-1.5 rounded-full whitespace-nowrap ${activeTab === t.id ? 'bg-accent-teal text-black' : 'text-text-muted'}`}
                                  >
                                    {t.label}
                                  </button>
                                ))}
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                inst.status === 'active' 
                                  ? 'bg-emerald-500/10 text-emerald-400' 
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {inst.status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => viewInstitutionDetails(inst)}
                                  className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] uppercase font-bold rounded-lg cursor-pointer transition-colors"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => toggleInstitutionStatus(inst)}
                                  className={`px-3 py-1 text-[10px] uppercase font-bold rounded-lg cursor-pointer transition-colors border ${
                                    inst.status === 'active'
                                      ? 'bg-rose-500/5 border-rose-500/10 text-rose-400 hover:bg-rose-500/10'
                                      : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10'
                                  }`}
                                >
                                  {inst.status === 'active' ? 'Suspend' : 'Activate'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-3xl space-y-6"
            >
              <div>
                <h1 className="text-3xl font-heading font-black mb-2">Create New Tenant</h1>
                <p className="text-text-muted text-sm">Provision a new independent school, college, or university on the platform.</p>
              </div>

              <form onSubmit={handleAddInstitution} className="bg-zinc-950 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
                {/* Section 1: Institution Details */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-accent-teal border-b border-white/5 pb-2">1. Institution Specifications</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Institution Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                        placeholder="e.g. ABC Public School"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Unique Institution Code *</label>
                      <input
                        type="text"
                        required
                        value={form.institutionCode}
                        onChange={(e) => setForm({...form, institutionCode: e.target.value})}
                        placeholder="e.g. PESITM, ABC001"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Institution Type *</label>
                      <select
                        value={form.institutionType}
                        onChange={(e) => setForm({...form, institutionType: e.target.value})}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all text-white cursor-pointer"
                      >
                        {['School', 'PU College', 'College', 'University', 'Training Institute', 'Coaching Institute', 'Other'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Official Email *</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        placeholder="e.g. info@abcschool.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Phone Number</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({...form, phone: e.target.value})}
                        placeholder="e.g. +917619329863"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Website</label>
                      <input
                        type="url"
                        value={form.website}
                        onChange={(e) => setForm({...form, website: e.target.value})}
                        placeholder="e.g. https://abcschool.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Logo URL</label>
                      <input
                        type="url"
                        value={form.logoUrl}
                        onChange={(e) => setForm({...form, logoUrl: e.target.value})}
                        placeholder="e.g. https://logo.com/my-logo.png"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted uppercase font-bold">Address</label>
                    <textarea
                      rows={2}
                      value={form.address}
                      onChange={(e) => setForm({...form, address: e.target.value})}
                      placeholder="Enter physical address..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white resize-none"
                    />
                  </div>
                </div>

                {/* Section 2: Administrator Credentials */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-base font-bold text-accent-teal border-b border-white/5 pb-2">2. Primary Administrator Account</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Admin Full Name *</label>
                      <input
                        type="text"
                        required
                        value={form.adminName}
                        onChange={(e) => setForm({...form, adminName: e.target.value})}
                        placeholder="e.g. Owaies Ahmed"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Admin Email Address *</label>
                      <input
                        type="email"
                        required
                        value={form.adminEmail}
                        onChange={(e) => setForm({...form, adminEmail: e.target.value})}
                        placeholder="e.g. admin@abcschool.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-text-muted uppercase font-bold">Admin Temp Password *</label>
                      <button
                        type="button"
                        onClick={() => {
                          const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
                          let generated = "";
                          for (let i = 0; i < 12; i++) {
                            generated += chars.charAt(Math.floor(Math.random() * chars.length));
                          }
                          setForm({ ...form, adminPassword: generated });
                          setShowPassword(true);
                        }}
                        className="text-[10px] text-accent-teal hover:underline font-bold cursor-pointer"
                      >
                        Generate Secure
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={form.adminPassword}
                        onChange={(e) => setForm({...form, adminPassword: e.target.value})}
                        placeholder="Enter or generate temporary password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-24 text-xs focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle text-white font-mono"
                      />
                      <div className="absolute right-3 top-2.5 flex items-center gap-2">
                        {form.adminPassword && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(form.adminPassword);
                              showAlert('Copied temporary password to clipboard!', 'Success');
                            }}
                            className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white cursor-pointer"
                          >
                            Copy
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-text-subtle hover:text-white transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {addSuccess && (
                  <div className="text-emerald-400 text-xs font-semibold text-center bg-emerald-500/10 py-2.5 rounded-lg flex items-center justify-center gap-1.5 border border-emerald-500/20">
                    <CheckCircle className="w-4 h-4" />
                    {addSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center shadow-lg shadow-accent-teal/20 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
                >
                  {submitting ? 'Creating Tenant...' : 'Provision Tenant Account'}
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'change-password' && (
            <motion.div
              key="change-password"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md space-y-8"
            >
              <div>
                <h1 className="text-3xl font-heading font-black text-white">Change Password</h1>
                <p className="text-sm text-text-muted">Manage your secure super admin credentials.</p>
              </div>
              <SuperAdminChangePasswordForm />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedInstDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0a0f1a] border border-white/10 rounded-3xl w-full max-w-lg p-8 relative overflow-hidden shadow-2xl space-y-6"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-accent-teal to-transparent" />
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-heading font-black">{selectedInstDetails.institution.name}</h3>
                  <span className="text-[10px] text-accent-teal uppercase font-bold tracking-wider">{selectedInstDetails.institution.institution_type}</span>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  selectedInstDetails.institution.status === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {selectedInstDetails.institution.status}
                </span>
              </div>

              {/* Inst Stats */}
              <div className="grid grid-cols-3 gap-3 bg-white/3 border border-white/5 p-4 rounded-2xl text-center">
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold">Teachers</p>
                  <p className="text-xl font-black text-white mt-1">{selectedInstDetails.stats.teachersCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold">Students</p>
                  <p className="text-xl font-black text-white mt-1">{selectedInstDetails.stats.studentsCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold">Quizzes</p>
                  <p className="text-xl font-black text-white mt-1">{selectedInstDetails.stats.quizzesCount}</p>
                </div>
              </div>

              {/* Data Specifications */}
              <div className="space-y-3 text-xs leading-relaxed text-text-muted border-t border-white/5 pt-4">
                <div className="flex gap-2">
                  <span className="font-bold text-white w-28">Tenant Code:</span>
                  <span className="font-mono text-white text-xs">{selectedInstDetails.institution.institution_code}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-white w-28">Tenant Email:</span>
                  <span className="text-white">{selectedInstDetails.institution.email}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-white w-28">Admin Account:</span>
                  <span className="text-accent-teal-light font-semibold">{selectedInstDetails.adminEmail}</span>
                </div>
                {selectedInstDetails.institution.phone && (
                  <div className="flex gap-2">
                    <span className="font-bold text-white w-28">Phone:</span>
                    <span className="text-white">{selectedInstDetails.institution.phone}</span>
                  </div>
                )}
                {selectedInstDetails.institution.website && (
                  <div className="flex gap-2">
                    <span className="font-bold text-white w-28">Website:</span>
                    <a href={selectedInstDetails.institution.website} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                      {selectedInstDetails.institution.website}
                    </a>
                  </div>
                )}
                {selectedInstDetails.institution.address && (
                  <div className="flex gap-2">
                    <span className="font-bold text-white w-28">Address:</span>
                    <span className="text-white flex-1">{selectedInstDetails.institution.address}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="font-bold text-white w-28">Created Date:</span>
                  <span className="text-white">{new Date(selectedInstDetails.institution.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedInstDetails(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog Modal */}
      <AnimatePresence>
        {modalConfig.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[#0a0f1a] border border-white/10 rounded-3xl w-full max-w-sm p-6 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-accent-teal to-transparent" />
              
              <h3 className="text-lg font-heading font-black mb-2 flex items-center gap-2">
                {modalConfig.type === 'confirm' ? (
                  <HelpCircle className="w-5 h-5 text-accent-teal" />
                ) : (
                  <Sparkles className="w-5 h-5 text-accent-teal" />
                )}
                {modalConfig.title}
              </h3>
              
              <p className="text-text-muted text-sm leading-relaxed mb-6">
                {modalConfig.message}
              </p>

              <div className="flex gap-3 justify-end">
                {modalConfig.type === 'confirm' && (
                  <button
                    onClick={modalConfig.onCancel}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={modalConfig.onConfirm}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white text-sm font-bold shadow-lg shadow-accent-teal/20 transition-all cursor-pointer"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuperAdminChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setError('New password cannot be the same as your current password.');
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
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-950 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
      <div className="space-y-4">
        {/* Current Password */}
        <div className="space-y-1">
          <label className="text-[10px] text-text-muted uppercase font-bold">Current Password *</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
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
  );
}
