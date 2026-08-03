"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  BookOpen, Sparkles, Shield, BarChart3, ArrowRight, X, 
  User, Lock, Mail, Phone, Award, LogOut, CheckCircle, Menu,
  GraduationCap, Clock, FileCheck, Users, Zap, Target, 
  ChevronDown, ExternalLink, Brain, Timer, ListChecks
} from 'lucide-react';
import { useRouter } from 'next/navigation';

/* ──────── Animated Background Particles ──────── */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Teal orbs */}
      <div className="absolute top-[10%] left-[15%] w-72 h-72 bg-accent-teal/5 rounded-full blur-3xl animate-float" />
      <div className="absolute top-[60%] right-[10%] w-96 h-96 bg-accent-teal/3 rounded-full blur-3xl animate-float-reverse" />
      {/* Orange accents */}
      <div className="absolute top-[30%] right-[20%] w-48 h-48 bg-accent-orange/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[20%] left-[25%] w-64 h-64 bg-accent-orange/3 rounded-full blur-3xl animate-float-reverse" style={{ animationDelay: '1s' }} />
    </div>
  );
}

/* ──────── Stats Counter ──────── */
function StatCard({ value, label, suffix = '', icon: Icon }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col items-center gap-2 p-6"
    >
      <Icon className="w-6 h-6 text-accent-teal mb-1" />
      <div className="text-3xl md:text-4xl font-heading font-black text-white">
        {value}<span className="text-accent-teal">{suffix}</span>
      </div>
      <p className="text-text-muted text-sm font-medium tracking-wide">{label}</p>
    </motion.div>
  );
}

/* ──────── Feature Card ──────── */
function FeatureCard({ icon: Icon, title, desc, gradient, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative bg-card-bg border border-card-border rounded-2xl p-8 transition-all duration-300 hover:border-accent-teal/30 hover:shadow-[0_0_30px_rgba(13,148,136,0.08)] cursor-default"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${gradient} shadow-lg`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-heading font-bold mb-3 group-hover:text-accent-teal-light transition-colors">{title}</h3>
      <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

/* ──────── How It Works Step ──────── */
function StepCard({ number, title, desc, icon: Icon, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="flex items-start gap-6 group"
    >
      <div className="relative shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center group-hover:bg-accent-teal/20 transition-colors">
          <span className="text-accent-teal font-heading font-black text-lg">{number}</span>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5 text-accent-orange" />
          <h4 className="font-heading font-bold text-lg">{title}</h4>
        </div>
        <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════ */
export default function Home() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState(null);
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [signupForm, setSignupForm] = useState({
    name: '', gender: 'M', college: '', email: '', mob: '', password: '', cpassword: ''
  });

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      setSuccess('Logged in successfully!');
      setTimeout(() => {
        setActiveModal(null);
        if (role === 'student') router.push('/student');
        else if (role === 'teacher') router.push('/teacher');
        else if (role === 'admin') router.push('/admin');
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (signupForm.password !== signupForm.cpassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');

      setSuccess('Registered successfully!');
      setTimeout(() => {
        setActiveModal(null);
        router.push('/student');
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, selectedRole = 'student') => {
    setActiveModal(type);
    setRole(selectedRole);
    setError('');
    setSuccess('');
    setMobileMenu(false);
  };

  return (
    <div className="min-h-screen text-white relative">
      <FloatingParticles />

      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-teal to-accent-teal-light flex items-center justify-center shadow-lg shadow-accent-teal/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-heading font-black tracking-wide">
              e-<span className="text-accent-teal-light">Examiner</span>
            </span>
          </motion.div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <a href="#features" className="px-4 py-2 text-sm text-text-muted hover:text-white transition-colors font-medium">Features</a>
            <a href="#how-it-works" className="px-4 py-2 text-sm text-text-muted hover:text-white transition-colors font-medium">How It Works</a>
            <a href="#about" className="px-4 py-2 text-sm text-text-muted hover:text-white transition-colors font-medium">About</a>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <button 
              onClick={() => openModal('login', 'teacher')}
              className="px-4 py-2 text-sm text-text-muted hover:text-white transition-colors font-medium"
            >
              Teacher Portal
            </button>
            <button 
              onClick={() => openModal('login', 'student')}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-sm font-semibold tracking-wide transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={() => openModal('signup')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white text-sm font-semibold tracking-wide transition-all shadow-lg shadow-accent-teal/20 cursor-pointer"
            >
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-text-muted hover:text-white cursor-pointer">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="p-4 flex flex-col gap-2">
                <a href="#features" onClick={() => setMobileMenu(false)} className="py-3 px-4 text-sm text-text-muted hover:text-white rounded-xl hover:bg-white/5 transition-all">Features</a>
                <a href="#how-it-works" onClick={() => setMobileMenu(false)} className="py-3 px-4 text-sm text-text-muted hover:text-white rounded-xl hover:bg-white/5 transition-all">How It Works</a>
                <a href="#about" onClick={() => setMobileMenu(false)} className="py-3 px-4 text-sm text-text-muted hover:text-white rounded-xl hover:bg-white/5 transition-all">About</a>
                <div className="h-px bg-white/5 my-2" />
                <button onClick={() => openModal('login', 'student')} className="py-3 px-4 text-sm text-left rounded-xl hover:bg-white/5 transition-all cursor-pointer">Sign In</button>
                <button onClick={() => openModal('signup')} className="py-3 px-4 text-sm text-center rounded-xl bg-accent-teal text-white font-bold cursor-pointer">Get Started</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <motion.section 
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
      >
        {/* Hero Background Video */}
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            poster="/hero-bg.png"
            className="w-full h-full object-cover opacity-85 mix-blend-screen"
          >
            <source src="/teal.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center pt-24">
          {/* Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-7xl font-heading font-black leading-[1.1] tracking-tight mb-6"
          >
            E-Examiner<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-teal via-accent-teal-light to-emerald-400 animate-gradient block mt-2 text-3xl sm:text-4xl md:text-5xl">
              Smart Online Examination System
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-text-muted text-lg md:text-xl max-w-2xl leading-relaxed mb-10"
          >
            Create, manage, and evaluate examinations effortlessly. Built for modern institutions with real-time analytics, auto-grading, and airtight security.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-16"
          >
            <button
              onClick={() => openModal('signup')}
              className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-accent-teal to-teal-500 text-white font-bold text-lg flex items-center gap-3 transition-all shadow-[0_8px_30px_rgba(13,148,136,0.3)] hover:shadow-[0_12px_40px_rgba(13,148,136,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => openModal('login', 'admin')}
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-semibold text-lg flex items-center gap-3 transition-all cursor-pointer"
            >
              <Shield className="w-5 h-5 text-accent-orange" />
              Admin Access
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-6 md:gap-10"
          >
            {[
              { icon: Zap, text: 'Instant Grading', color: 'text-amber-400' },
              { icon: Shield, text: 'Secure Environment', color: 'text-rose-400' },
              { icon: BarChart3, text: 'Live Analytics', color: 'text-emerald-400' },
              { icon: Clock, text: 'Timed Assessments', color: 'text-sky-400' }
            ].map((badge, idx) => (
              <div key={badge.text} className="flex items-center gap-2 text-text-muted">
                <badge.icon className={`${badge.color} w-4 h-4`} />
                <span className="text-sm font-medium">{badge.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 flex flex-col items-center gap-2"
        >
          <span className="text-text-subtle text-xs uppercase tracking-widest">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="w-5 h-5 text-text-subtle" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ═══ FEATURES GRID ═══ */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-accent-teal/10 border border-accent-teal/20 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent-teal-light mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Features
            </div>
            <h2 className="text-3xl md:text-5xl font-heading font-black mb-4">
              Everything You Need to<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-teal-light">Run Modern Exams</span>
            </h2>
            <p className="text-text-muted max-w-xl mx-auto">Powerful tools designed for teachers, students, and administrators — all in one platform.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={BookOpen} title="Smart Quiz Builder" desc="Create multiple-choice quizzes with customizable timers, question pools, and difficulty levels. Supports rich text and media." gradient="bg-gradient-to-br from-teal-600 to-teal-700" delay={0} />
            <FeatureCard icon={Timer} title="Timed Assessments" desc="Set exam duration with countdown timers. Auto-submit when time runs out to ensure fairness across all participants." gradient="bg-gradient-to-br from-amber-600 to-amber-700" delay={0.1} />
            <FeatureCard icon={BarChart3} title="Real-Time Analytics" desc="Live dashboard showing exam progress, score distribution, pass rates, and individual student performance metrics." gradient="bg-gradient-to-br from-emerald-600 to-emerald-700" delay={0.2} />
            <FeatureCard icon={Shield} title="Secure Environment" desc="Anti-cheating measures with randomized questions, timed windows, and one-attempt-only policies for integrity." gradient="bg-gradient-to-br from-rose-600 to-rose-700" delay={0.3} />
            <FeatureCard icon={Brain} title="Auto-Grading Engine" desc="Instant automated scoring with detailed result breakdowns. Students see their results the moment they submit." gradient="bg-gradient-to-br from-violet-600 to-violet-700" delay={0.4} />
            <FeatureCard icon={Users} title="Multi-Role Access" desc="Separate dashboards for Students, Teachers, and Admins with tailored tools and permissions for each role." gradient="bg-gradient-to-br from-sky-600 to-sky-700" delay={0.5} />
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="relative z-10 py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-accent-orange/10 border border-accent-orange/20 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent-orange-light mb-4">
              <ListChecks className="w-3.5 h-3.5" /> How It Works
            </div>
            <h2 className="text-3xl md:text-5xl font-heading font-black mb-4">
              Get Started in <span className="text-accent-orange">Minutes</span>
            </h2>
            <p className="text-text-muted max-w-lg mx-auto">Three simple steps to transform your examination workflow.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Steps */}
            <div className="flex flex-col gap-10">
              <StepCard number="01" icon={User} title="Create Your Account" desc="Sign up in seconds with your email. Choose your role — Student, Teacher, or Administrator." delay={0} />
              <StepCard number="02" icon={BookOpen} title="Set Up or Take Exams" desc="Teachers create quizzes with our intuitive builder. Students browse and attempt available examinations." delay={0.1} />
              <StepCard number="03" icon={BarChart3} title="View Results Instantly" desc="Automated grading delivers results in real-time. Review scores, analytics, and performance trends." delay={0.2} />
            </div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative hidden md:block"
            >
              <div className="relative bg-gradient-to-br from-accent-teal/10 to-accent-orange/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                {/* Mock exam card */}
                <div className="bg-background/80 rounded-2xl border border-white/10 p-6 mb-4 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Live Exam</span>
                    </div>
                    <span className="text-xs text-text-muted font-mono">23:45 remaining</span>
                  </div>
                  <p className="text-sm font-medium mb-4">Q7: What is the time complexity of binary search?</p>
                  <div className="space-y-2">
                    {['O(n)', 'O(log n)', 'O(n²)', 'O(1)'].map((opt, i) => (
                      <div key={opt} className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-all cursor-default ${i === 1 ? 'bg-accent-teal/15 border-accent-teal/40 text-accent-teal-light' : 'bg-white/3 border-white/5 text-text-muted'}`}>
                        <span className="mr-2 font-bold">{String.fromCharCode(65 + i)}.</span>{opt}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Score bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '72%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-accent-teal to-accent-teal-light rounded-full"
                    />
                  </div>
                  <span className="text-xs text-accent-teal-light font-bold">72%</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ ABOUT US ═══ */}
      <section id="about" className="relative z-10 py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 items-center">
            
            {/* Creator 1: Lead Developer */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1 flex justify-center lg:justify-start"
            >
              <motion.div
                whileHover={{ y: -5 }}
                className="flex flex-col items-center bg-card-bg border border-card-border rounded-3xl p-8 w-[280px] hover:border-accent-teal/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(13,148,136,0.08)]"
              >
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-accent-teal/20 mb-5 shadow-xl shadow-accent-teal/5">
                  <img 
                    src="/afaf12.png" 
                    alt="Portrait of Mohammed Afaf, Lead Developer at E-Examiner" 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                  />
                </div>
                <h3 className="font-heading font-bold text-lg text-white mb-1">Mohammed Afaf</h3>
                <p className="text-accent-teal-light font-semibold text-sm tracking-wide mb-2 uppercase">Lead Developer</p>
                <p className="text-text-subtle text-xs text-center mb-6">Bachelor of Computer Applications</p>
                
                <div className="w-full space-y-2 border-t border-white/5 pt-4">
                  <a 
                    href="mailto:Kingahassan786@gmail.com"
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 text-[11px] font-semibold transition-all hover:border-accent-teal/30 cursor-pointer text-text-muted hover:text-white"
                  >
                    <Mail className="w-3.5 h-3.5 text-accent-teal" />
                    <span>Kingahassan786@gmail.com</span>
                  </a>
                  <a 
                    href="tel:+918073818817"
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 text-[11px] font-semibold transition-all hover:border-accent-teal/30 cursor-pointer text-text-muted hover:text-white"
                  >
                    <Phone className="w-3.5 h-3.5 text-accent-teal" />
                    <span>+91 80738 18817</span>
                  </a>
                </div>
              </motion.div>
            </motion.div>

            {/* About Us Description (Middle) */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2 w-full text-center flex flex-col items-center max-w-xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 bg-accent-teal/10 border border-accent-teal/20 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent-teal-light mb-6">
                <Users className="w-3.5 h-3.5" /> About Us
              </div>
              
              <h2 className="text-3xl md:text-5xl font-heading font-black leading-tight mb-6">
                Built With Precision.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-teal-light">
                  Delivered With Excellence.
                </span>
              </h2>
              
              <p className="text-text-muted leading-relaxed text-base md:text-lg">
                <strong className="text-white font-semibold">Established in 2025</strong> to accommodate modern educational institutions, busy professionals, and everyday students. Our platform combines cutting-edge technology with intuitive design to deliver a secure, reliable examination experience.
              </p>
            </motion.div>

            {/* Creator 2: AI Engineer */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-3 flex justify-center lg:justify-end"
            >
              <motion.div
                whileHover={{ y: -5 }}
                className="flex flex-col items-center bg-card-bg border border-card-border rounded-3xl p-8 w-[280px] hover:border-accent-teal/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(13,148,136,0.08)]"
              >
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-accent-teal/20 mb-5 shadow-xl shadow-accent-teal/5">
                  <img 
                    src="/owaies3.png" 
                    alt="Portrait of Mohammed Owaies, AI Engineer at E-Examiner" 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                  />
                </div>
                <h3 className="font-heading font-bold text-lg text-white mb-1">Mohammed Owaies</h3>
                <p className="text-accent-teal-light font-semibold text-sm tracking-wide mb-2 uppercase">AI Engineer</p>
                <p className="text-text-subtle text-xs text-center mb-6">Bachelor of Engineering in AIML</p>
                
                <div className="w-full space-y-2 border-t border-white/5 pt-4">
                  <a 
                    href="mailto:owaies786@gmail.com"
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 text-[11px] font-semibold transition-all hover:border-accent-teal/30 cursor-pointer text-text-muted hover:text-white"
                  >
                    <Mail className="w-3.5 h-3.5 text-accent-teal" />
                    <span>owaies786@gmail.com</span>
                  </a>
                  <a 
                    href="tel:+917619329863"
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 text-[11px] font-semibold transition-all hover:border-accent-teal/30 cursor-pointer text-text-muted hover:text-white"
                  >
                    <Phone className="w-3.5 h-3.5 text-accent-teal" />
                    <span>+91 76193 29863</span>
                  </a>
                  <a 
                    href="https://github.com/owaies"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 text-[11px] font-semibold transition-all hover:border-accent-teal/30 cursor-pointer text-text-muted hover:text-white"
                  >
                    <svg className="w-3.5 h-3.5 text-accent-teal fill-current" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span>github.com/owaies</span>
                  </a>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-accent-teal/10 via-background to-accent-orange/5 border border-accent-teal/20 rounded-3xl p-12 md:p-16 text-center overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-teal/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-orange/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <GraduationCap className="w-12 h-12 text-accent-teal mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-heading font-black mb-4">
                Ready to Transform Your Exams?
              </h2>
              <p className="text-text-muted text-lg max-w-lg mx-auto mb-8">
                Join hundreds of students and educators already using e-Examiner for seamless online assessments.
              </p>
              <button
                onClick={() => openModal('signup')}
                className="group px-10 py-4 rounded-2xl bg-gradient-to-r from-accent-teal to-teal-500 text-white font-bold text-lg inline-flex items-center gap-3 shadow-[0_8px_30px_rgba(13,148,136,0.3)] hover:shadow-[0_12px_40px_rgba(13,148,136,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                Get Started — It's Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-teal to-accent-teal-light flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-sm">e-Examiner</span>
            </div>
            <div className="flex items-center gap-6 text-text-subtle text-xs">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
            </div>
            <p className="text-text-subtle text-xs tracking-wider">&copy; 2026 e-Examiner. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ═══ AUTH MODALS ═══ */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setActiveModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#0a0f1a] border border-white/10 rounded-3xl w-full max-w-md p-8 relative overflow-hidden shadow-2xl"
            >
              {/* Modal glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-accent-teal to-transparent" />
              
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-5 right-5 p-1 text-text-subtle hover:text-white transition-colors rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {activeModal === 'login' ? (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-accent-teal" />
                    </div>
                    <div>
                      <h3 className="text-xl font-heading font-black">Welcome Back</h3>
                      <p className="text-text-subtle text-xs">Sign in as {role}</p>
                    </div>
                  </div>
                  
                  {/* Role selector */}
                  <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl">
                    {['student', 'teacher', 'admin'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setRole(r); setError(''); }}
                        className={`flex-1 py-2.5 rounded-lg text-xs uppercase font-bold tracking-wider transition-all cursor-pointer ${role === r ? 'bg-accent-teal text-white shadow-lg shadow-accent-teal/20' : 'text-text-muted hover:text-white'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-4 h-4 text-text-subtle" />
                      <input 
                        type="email" placeholder="Email address" required
                        value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 w-4 h-4 text-text-subtle" />
                      <input 
                        type="password" placeholder="Password" required
                        value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-accent-teal/50 focus:ring-1 focus:ring-accent-teal/20 transition-all placeholder:text-text-subtle"
                      />
                    </div>

                    {error && <div className="text-rose-400 text-xs text-center bg-rose-500/10 py-2 rounded-lg">{error}</div>}
                    {success && <div className="text-emerald-400 text-xs text-center bg-emerald-500/10 py-2 rounded-lg flex items-center justify-center gap-1"><CheckCircle className="w-3.5 h-3.5" />{success}</div>}

                    <button
                      type="submit" disabled={loading}
                      className="w-full bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-teal/20 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>

                  <p className="text-center text-text-subtle text-xs mt-5">
                    Don't have an account?{' '}
                    <button onClick={() => { setActiveModal('signup'); setError(''); setSuccess(''); }} className="text-accent-teal-light hover:underline cursor-pointer">Sign up</button>
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-accent-teal" />
                    </div>
                    <div>
                      <h3 className="text-xl font-heading font-black">Create Account</h3>
                      <p className="text-text-subtle text-xs">Join as a student</p>
                    </div>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-3 overflow-y-auto max-h-[65vh] pr-1">
                    <input type="text" placeholder="Full Name" required value={signupForm.name} onChange={(e) => setSignupForm({...signupForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle" />
                    <select value={signupForm.gender} onChange={(e) => setSignupForm({...signupForm, gender: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-accent-teal/50 transition-all text-text-muted">
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                    <input type="text" placeholder="College / Institution" required value={signupForm.college} onChange={(e) => setSignupForm({...signupForm, college: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle" />
                    <input type="email" placeholder="Email address" required value={signupForm.email} onChange={(e) => setSignupForm({...signupForm, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle" />
                    <input type="tel" pattern="[0-9]{10}" maxLength="10" minLength="10" placeholder="10-digit Mobile Number" required value={signupForm.mob} onChange={(e) => setSignupForm({...signupForm, mob: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle" />
                    <input type="password" placeholder="Password" required minLength={5} value={signupForm.password} onChange={(e) => setSignupForm({...signupForm, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle" />
                    <input type="password" placeholder="Confirm Password" required value={signupForm.cpassword} onChange={(e) => setSignupForm({...signupForm, cpassword: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-accent-teal/50 transition-all placeholder:text-text-subtle" />

                    {error && <div className="text-rose-400 text-xs text-center bg-rose-500/10 py-2 rounded-lg">{error}</div>}
                    {success && <div className="text-emerald-400 text-xs text-center bg-emerald-500/10 py-2 rounded-lg flex items-center justify-center gap-1"><CheckCircle className="w-3.5 h-3.5" />{success}</div>}

                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-accent-teal to-teal-500 hover:from-teal-500 hover:to-accent-teal text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center shadow-lg shadow-accent-teal/20 disabled:opacity-50 cursor-pointer">
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </form>

                  <p className="text-center text-text-subtle text-xs mt-5">
                    Already have an account?{' '}
                    <button onClick={() => { setActiveModal('login'); setError(''); setSuccess(''); }} className="text-accent-teal-light hover:underline cursor-pointer">Sign in</button>
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "E-Examiner",
            "url": "https://e-examiner.vercel.app/",
            "applicationCategory": "EducationalApplication",
            "description": "E-Examiner is a modern, secure, and smart online examination and assessment platform. Create timed exams, auto-grade quizzes, and track performance with real-time analytics.",
            "operatingSystem": "All",
            "offers": {
              "@type": "Offer",
              "price": "0.00",
              "priceCurrency": "USD"
            }
          })
        }}
      />
    </div>
  );
}
