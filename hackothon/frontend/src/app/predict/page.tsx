'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const diseases = [
    { name: 'Heart Disease', icon: '🫀', color: 'var(--accent-red)', desc: 'XGBoost model — 13 raw features + 4 engineered = 17 total. Analyzes chest pain, ECG, cholesterol, heart rate.', link: '/predict/heart', features: ['17 Features', 'XGBoost', '~92% Acc'] },
    { name: 'Kidney Disease', icon: '🫘', color: 'var(--accent-orange)', desc: 'RF + 1D-CNN Ensemble — 24 clinical features including lab blood work and physical symptoms. Hybrid multimodal analysis.', link: '/predict/kidney', features: ['24 Features', 'RF + CNN', 'Ensemble'] },
    { name: 'Stroke Risk', icon: '🧠', color: 'var(--accent-purple)', desc: 'CatBoost with custom 0.3 threshold — demographics, lifestyle, and clinical factors with preprocessor.', link: '/predict/stroke', features: ['11 Features', 'CatBoost', 'Threshold 0.3'] },
    { name: 'Diabetes', icon: '🩸', color: 'var(--accent-blue)', desc: 'GradientBoosting — glucose, BMI, blood pressure, insulin, pedigree function. PIMA + Frankfurt + Iraqi datasets.', link: '/predict/diabetes', features: ['8 Features', 'GradientBoost', 'Multi-Dataset'] },
    { name: 'Thyroid', icon: '🦋', color: 'var(--accent-pink)', desc: 'RandomForest 98.17% accuracy — 6 hormones (TSH/T3/TT4/T4U/FTI/TBG) + age/sex + 13 clinical flags.', link: '/predict/thyroid', features: ['21 Features', 'RandomForest', '3 Classes'] },
    { name: 'Brain Tumor', icon: '🧠', color: 'var(--accent-cyan)', desc: 'Deep Learning (DenseNet/ResNet) — Analyze MRI scans for Glioma, Meningioma, Pituitary tumors or healthy tissue.', link: '/predict/brain', features: ['MRI Image', 'Deep Learning', '4 Classes'] },
];

export default function PredictPage() {
    return (
        <main style={{ minHeight: '100vh', paddingTop: '40px' }}>
            <div style={{ padding: '20px 40px' }}>
                <Link href="/dashboard" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '14px' }}>
                    ← Back to Dashboard
                </Link>
            </div>

            <section style={{ padding: '20px 40px 80px', maxWidth: '1200px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontFamily: 'Outfit', fontSize: '42px', fontWeight: 900, marginBottom: '12px' }}>
                        <span className="gradient-text">Disease Risk Prediction</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
                        Multimodal AI assessment — statistical analysis & deep learning computer vision
                    </p>
                </motion.div>

                {/* Comprehensive Assessment CTA */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <Link href="/predict/comprehensive" style={{ textDecoration: 'none' }}>
                        <div className="glass-card" style={{
                            padding: '28px 32px', cursor: 'pointer', marginBottom: '32px',
                            background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(6,182,212,0.08))',
                            border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', gap: '24px'
                        }}>
                            <div style={{ fontSize: '52px' }}>🏥</div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontFamily: 'Outfit', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>
                                    <span className="gradient-text">Comprehensive Health Assessment</span>
                                </h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                    Run ALL 6 models at once → Get overall risk score, AI explanation, diet plan & doctor recommendations
                                </p>
                            </div>
                            <div className="btn-primary" style={{ padding: '12px 28px', fontSize: '15px', whiteSpace: 'nowrap' }}>
                                Run All 6 →
                            </div>
                        </div>
                    </Link>
                </motion.div>

                {/* Individual Model Cards */}
                <div className="disease-grid">
                    {diseases.map((d, i) => (
                        <motion.div key={d.name} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                            <Link href={d.link} style={{ textDecoration: 'none' }}>
                                <div className="glass-card prediction-card" style={{ padding: '28px', cursor: 'pointer', height: '100%', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{
                                        position: 'absolute', top: '-30px', right: '-30px',
                                        width: '120px', height: '120px',
                                        background: `radial-gradient(circle, ${d.color}20 0%, transparent 70%)`,
                                        borderRadius: '50%'
                                    }} />
                                    <div style={{ fontSize: '48px', marginBottom: '14px' }}>{d.icon}</div>
                                    <h2 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                                        {d.name}
                                    </h2>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                                        {d.desc}
                                    </p>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                        {d.features.map(f => (
                                            <span key={f} style={{ padding: '3px 10px', borderRadius: '6px', background: `${d.color}12`, color: d.color, fontSize: '11px', fontWeight: 600 }}>{f}</span>
                                        ))}
                                    </div>
                                    <div style={{ fontSize: '13px', color: d.color, fontWeight: 600 }}>
                                        Run Prediction →
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>
        </main>
    );
}
