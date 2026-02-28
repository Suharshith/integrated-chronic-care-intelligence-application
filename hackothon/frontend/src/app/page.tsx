'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

function NavAuth() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Predictions', href: '/predict' },
    { label: 'AI Chat', href: '/ai-chat' },
    { label: 'Vitals', href: '/vitals' },
  ];

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      {navLinks.map(item => (
        <Link key={item.label} href={item.href} className="nav-link" style={{ fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
          {item.label}
        </Link>
      ))}
      {user ? (
        <div style={{ position: 'relative' }}>
          <button onClick={() => setOpen(!open)} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
            borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)',
            background: 'rgba(99,102,241,0.08)', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600
          }}>
            <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: 'white' }}>
              {user.name[0].toUpperCase()}
            </span>
            {user.name} ▾
          </button>
          {open && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, width: '200px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.95)', border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(20px)', overflow: 'hidden', zIndex: 999
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.03)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {user.email}<br /><span style={{ color: user.role === 'admin' ? 'var(--accent-purple)' : 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>{user.role}</span>
              </div>
              <Link href="/history" style={{ display: 'block', padding: '10px 16px', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '13px' }} onClick={() => setOpen(false)}>📋 My History</Link>
              {user.role === 'admin' && <Link href="/admin" style={{ display: 'block', padding: '10px 16px', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '13px' }} onClick={() => setOpen(false)}>🛡️ Admin Panel</Link>}
              <button onClick={() => { logout(); setOpen(false); }} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', color: 'var(--accent-red)', cursor: 'pointer', textAlign: 'left', fontSize: '13px', borderTop: '1px solid rgba(0,0,0,0.03)' }}>🚪 Logout</button>
            </div>
          )}
        </div>
      ) : (
        <Link href="/login" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '13px' }}>
          🔑 Login
        </Link>
      )}
    </div>
  );
}

const diseases = [
  { name: 'Heart Disease', icon: '🫀', color: 'var(--accent-red)', desc: 'XGBoost ML Model', link: '/predict/heart' },
  { name: 'Kidney Disease', icon: '🫘', color: 'var(--accent-orange)', desc: 'Tabular ML Model', link: '/predict/kidney' },
  { name: 'Stroke', icon: '🧠', color: 'var(--accent-purple)', desc: 'CatBoost Model', link: '/predict/stroke' },
  { name: 'Diabetes', icon: '🩸', color: 'var(--accent-blue)', desc: 'Gradient Boosting', link: '/predict/diabetes' },
  { name: 'Brain Tumor', icon: '🧠', color: 'var(--accent-cyan)', desc: 'DL Model (DenseNet/ResNet)', link: '/predict/brain' },
  { name: 'Thyroid', icon: '🦋', color: 'var(--accent-pink)', desc: 'ML Classifier', link: '/predict/thyroid' },
];

const stats = [
  { value: '6', label: 'AI Models', icon: '🤖' },
  { value: '95%', label: 'Accuracy', icon: '🎯' },
  { value: '50K+', label: 'Data Points', icon: '📊' },
  { value: '24/7', label: 'Monitoring', icon: '⏰' },
];

const features = [
  { title: 'AI Disease Prediction', desc: 'Trained ML models for 6 chronic diseases with real-time risk assessment', icon: '🧬' },
  { title: 'Gemini AI Chatbot', desc: 'Ask any health question to our Gemini-powered AI assistant for instant guidance', icon: '🤖' },
  { title: 'AI Diet Planner', desc: 'Personalized 7-day meal plans based on your health risks powered by Gemini AI', icon: '🥗' },
  { title: 'Find Doctors', desc: 'Google Maps-powered specialist search — cardiologists, neurologists, and more', icon: '📍' },
  { title: 'PDF Reports', desc: 'Auto-generated comprehensive health reports with risk scores and recommendations', icon: '📄' },
  { title: 'WhatsApp Delivery', desc: 'Send health reports directly to your phone via WhatsApp (Twilio)', icon: '📲' },
];

export default function HomePage() {
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCount(prev => (prev + 1) % diseases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ minHeight: '100vh' }}>
      {/* Navigation */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '16px 40px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🏥</span>
          <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '22px' }} className="gradient-text">
            ICCIP
          </span>
        </div>
        <NavAuth />
      </motion.nav>

      {/* Hero Section */}
      <section style={{ paddingTop: '140px', paddingBottom: '80px', textAlign: 'center', position: 'relative' }}>
        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{
            position: 'absolute', top: '15%', left: '10%',
            width: 120, height: 120,
            background: 'radial-gradient(circle, rgba(79,140,255,0.15) 0%, transparent 70%)',
            borderRadius: '50%', filter: 'blur(2px)'
          }}
        />
        <motion.div
          animate={{ y: [0, 15, 0], x: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          style={{
            position: 'absolute', top: '30%', right: '8%',
            width: 160, height: 160,
            background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
            borderRadius: '50%', filter: 'blur(2px)'
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.3 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 20px', borderRadius: '50px',
              background: 'rgba(79, 140, 255, 0.1)',
              border: '1px solid rgba(79, 140, 255, 0.2)',
              marginBottom: '28px', fontSize: '13px', color: '#4f8cff'
            }}
          >
            <span style={{ width: 8, height: 8, background: 'var(--accent-green)', borderRadius: '50%', display: 'inline-block' }} />
            AI-Powered Healthcare Platform
          </motion.div>

          <h1 style={{
            fontFamily: 'Outfit', fontSize: 'clamp(36px, 5vw, 68px)',
            fontWeight: 900, lineHeight: 1.1, marginBottom: '24px'
          }}>
            <span className="gradient-text">Integrated Chronic</span>
            <br />
            <span style={{ color: 'var(--text-primary)' }}>Care Intelligence</span>
          </h1>

          <p style={{
            fontSize: '18px', color: 'var(--text-secondary)',
            maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.7
          }}>
            Predict chronic disease risks with trained ML models. Monitor vitals,
            track medications, and receive AI-powered care plans — all in one platform.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/predict" className="btn-primary" style={{ textDecoration: 'none', padding: '14px 32px', fontSize: '16px' }}>
              🧬 Start Prediction
            </Link>
            <Link href="/dashboard" className="btn-outline" style={{ textDecoration: 'none', padding: '14px 32px', fontSize: '16px' }}>
              📊 View Dashboard
            </Link>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px', maxWidth: '800px', margin: '60px auto 0',
            padding: '0 24px'
          }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="glass-card"
              style={{ padding: '24px 16px', textAlign: 'center' }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontFamily: 'Outfit', fontSize: '28px', fontWeight: 800 }} className="gradient-text">
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Disease Prediction Cards */}
      <section style={{ padding: '60px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <h2 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>
            <span className="gradient-text">AI Disease Predictions</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Powered by trained machine learning models on real clinical datasets
          </p>
        </motion.div>

        <div className="disease-grid">
          {diseases.map((disease, i) => (
            <motion.div
              key={disease.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={disease.link} style={{ textDecoration: 'none' }}>
                <div
                  className="glass-card"
                  style={{
                    padding: '32px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '-20px', right: '-20px',
                    width: '100px', height: '100px',
                    background: `radial-gradient(circle, ${disease.color}15 0%, transparent 70%)`,
                    borderRadius: '50%'
                  }} />
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>{disease.icon}</div>
                  <h3 style={{
                    fontFamily: 'Outfit', fontSize: '20px', fontWeight: 700,
                    color: 'var(--text-primary)', marginBottom: '8px'
                  }}>
                    {disease.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    {disease.desc}
                  </p>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: '8px',
                    background: `${disease.color}15`,
                    color: disease.color, fontSize: '12px', fontWeight: 600
                  }}>
                    Predict Risk →
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <h2 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>
            <span className="gradient-text">Platform Features</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Comprehensive chronic care management powered by artificial intelligence
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card"
              style={{ padding: '28px' }}
            >
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>{feature.icon}</div>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '80px 40px', textAlign: 'center',
        background: 'linear-gradient(180deg, transparent, rgba(79, 140, 255, 0.05))'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card"
          style={{ maxWidth: '700px', margin: '0 auto', padding: '60px 40px' }}
        >
          <h2 style={{ fontFamily: 'Outfit', fontSize: '32px', fontWeight: 800, marginBottom: '16px' }} className="gradient-text">
            Take Control of Your Health
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '16px' }}>
            Start with a comprehensive health risk assessment using our AI-powered platform.
          </p>
          <Link href="/predict" className="btn-primary" style={{ textDecoration: 'none', padding: '16px 40px', fontSize: '16px' }}>
            🚀 Get Started Now
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px', textAlign: 'center',
        borderTop: '1px solid var(--glass-border)',
        color: 'var(--text-secondary)', fontSize: '13px'
      }}>
        <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }} className="gradient-text">
          ICCIP
        </div>
        <p>Integrated Chronic Care Intelligence Platform © 2026</p>
        <p style={{ marginTop: '4px', fontSize: '12px' }}>AI-Powered Healthcare • Trained ML Models • Real-time Monitoring</p>
      </footer>
    </main >
  );
}
