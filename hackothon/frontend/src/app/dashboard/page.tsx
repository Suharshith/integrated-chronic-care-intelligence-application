'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/lib/api';

const features = [
    { icon: '🫀', title: 'Heart Disease', desc: 'XGBoost — 17 features', href: '/predict/heart', color: 'var(--accent-red)' },
    { icon: '🫘', title: 'Kidney Disease', desc: 'Random Forest — 24 features', href: '/predict/kidney', color: 'var(--accent-orange)' },
    { icon: '🧠', title: 'Stroke Risk', desc: 'CatBoost — Custom threshold', href: '/predict/stroke', color: 'var(--accent-purple)' },
    { icon: '🩸', title: 'Diabetes', desc: 'GradientBoosting — 8 features', href: '/predict/diabetes', color: 'var(--accent-blue)' },
    { icon: '🧠', title: 'Brain Tumor', desc: 'Deep Learning (DenseNet/ResNet)', href: '/predict/brain', color: 'var(--accent-cyan)' },
    { icon: '🦋', title: 'Thyroid', desc: 'RandomForest — 21 features', href: '/predict/thyroid', color: 'var(--accent-pink)' },
];

const services = [
    { icon: '🤖', title: 'AI Health Chat', desc: 'Ask Gemini AI anything about health', href: '/ai-chat', color: 'var(--accent-purple)', badge: 'NEW' },
    { icon: '🥗', title: 'AI Diet Planner', desc: 'Personalized 7-day meal plans', href: '/diet-plan', color: 'var(--accent-green)', badge: 'NEW' },
    { icon: '📍', title: 'Find Doctors', desc: 'Google Maps specialist search', href: '/doctors', color: 'var(--accent-cyan)', badge: 'NEW' },
    { icon: '📊', title: 'Vitals Monitor', desc: 'Track vitals over time', href: '/vitals', color: 'var(--accent-orange)' },
    { icon: '📋', title: 'Care Plan', desc: 'Personalized care plans', href: '/careplan', color: 'var(--accent-pink)' },
    { icon: '🏥', title: 'All Predictions', desc: '6 disease prediction models', href: '/predict', color: 'var(--accent-orange)' },
];

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        getDashboardStats().then(r => setStats(r.data)).catch(() => { });
    }, []);

    return (
        <main style={{ minHeight: '100vh', paddingTop: '40px' }}>
            <section style={{ padding: '20px 40px 60px', maxWidth: '1300px', margin: '0 auto' }}>
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                        <div>
                            <h1 style={{ fontFamily: 'Outfit', fontSize: '40px', fontWeight: 900, marginBottom: '8px' }} className="gradient-text">
                                ICCIP Dashboard
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                                Integrated Chronic Care Intelligence Platform — AI-Powered Healthcare
                            </p>
                        </div>
                        <Link href="/" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '14px' }}>← Home</Link>
                    </div>
                </motion.div>

                {/* Stats Bar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '40px' }}>
                    {[
                        { label: 'AI Models', value: '6', icon: '🧠', color: 'var(--accent-purple)' },
                        { label: 'Predictions', value: stats?.total_predictions || '0', icon: '📊', color: 'var(--accent-cyan)' },
                        { label: 'Patients', value: stats?.total_patients || '0', icon: '👥', color: 'var(--accent-green)' },
                        { label: 'Vitals Logged', value: stats?.total_vitals || '0', icon: '💓', color: 'var(--accent-orange)' },
                        { label: 'AI Services', value: '4', icon: '🤖', color: 'var(--accent-pink)' },
                    ].map((s, i) => (
                        <div key={s.label} className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
                            <div style={{ fontFamily: 'Outfit', fontSize: '28px', fontWeight: 900, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Services Grid */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <h2 style={{ fontFamily: 'Outfit', fontSize: '22px', fontWeight: 800, marginBottom: '20px', color: 'var(--accent-purple)' }}>🚀 AI Services</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
                        {services.map((s, i) => (
                            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                                <Link href={s.href} style={{ textDecoration: 'none' }}>
                                    <div className="glass-card prediction-card" style={{ padding: '24px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                                        {s.badge && (
                                            <span style={{ position: 'absolute', top: '12px', right: '12px', padding: '2px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))', color: '#fff' }}>
                                                {s.badge}
                                            </span>
                                        )}
                                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>{s.icon}</div>
                                        <h3 style={{ fontFamily: 'Outfit', fontSize: '17px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>{s.title}</h3>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.desc}</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Disease Predictions Grid */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <h2 style={{ fontFamily: 'Outfit', fontSize: '22px', fontWeight: 800, marginBottom: '20px', color: 'var(--accent-cyan)' }}>🧬 Disease Prediction Models</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {features.map((f, i) => (
                            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
                                <Link href={f.href} style={{ textDecoration: 'none' }}>
                                    <div className="glass-card prediction-card" style={{ padding: '24px', cursor: 'pointer', borderLeft: `4px solid ${f.color}` }}>
                                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>{f.icon}</div>
                                        <h3 style={{ fontFamily: 'Outfit', fontSize: '17px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>{f.title}</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{f.desc}</p>
                                        <div style={{ marginTop: '12px', fontSize: '11px', color: f.color, fontWeight: 600 }}>Run Prediction →</div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Platform Info */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="glass-card" style={{ padding: '24px', marginTop: '40px', border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-purple)' }}>🏥 ICCIP Platform v2.0</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <div><strong style={{ color: 'var(--text-primary)' }}>AI Models:</strong><br />6 Disease Predictors</div>
                        <div><strong style={{ color: 'var(--text-primary)' }}>AI Chat:</strong><br />Gemini 2.0 Flash</div>
                        <div><strong style={{ color: 'var(--text-primary)' }}>Maps:</strong><br />Google Places API</div>
                        <div><strong style={{ color: 'var(--text-primary)' }}>Delivery:</strong><br />WhatsApp via Twilio</div>
                    </div>
                </motion.div>
            </section>
        </main>
    );
}
