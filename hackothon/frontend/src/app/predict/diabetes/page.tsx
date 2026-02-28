'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { predictDiabetes } from '@/lib/api';

export default function DiabetesPrediction() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    // Verified order: pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, diabetes_pedigree, age
    const [form, setForm] = useState({
        pregnancies: 0, glucose: 120, blood_pressure: 80, skin_thickness: 20,
        insulin: 100, bmi: 25, diabetes_pedigree: 0.5, age: 30
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try { const res = await predictDiabetes(form); setResult(res.data); }
        catch { setResult({ error: 'Failed to connect.' }); }
        setLoading(false);
    };
    const u = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

    return (
        <main style={{ minHeight: '100vh', paddingTop: '40px' }}>
            <div style={{ padding: '20px 40px' }}><Link href="/predict" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '14px' }}>← Back</Link></div>
            <section style={{ padding: '0 40px 80px', maxWidth: '1100px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '48px' }}>🩸</span>
                        <h1 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 900 }} className="gradient-text">Diabetes Prediction</h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>GradientBoosting model — 8 features from PIMA/Frankfurt/Iraqi datasets</p>
                </motion.div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                    <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>Patient Data (8 features)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {[
                                { l: 'Pregnancies', k: 'pregnancies' },
                                { l: 'Glucose (mg/dL)', k: 'glucose' },
                                { l: 'Blood Pressure (mmHg)', k: 'blood_pressure' },
                                { l: 'Skin Thickness (mm)', k: 'skin_thickness' },
                                { l: 'Insulin (μU/mL)', k: 'insulin' },
                                { l: 'BMI (kg/m²)', k: 'bmi' },
                                { l: 'Diabetes Pedigree Function', k: 'diabetes_pedigree' },
                                { l: 'Age (years)', k: 'age' },
                            ].map(f => (
                                <div key={f.k}>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>{f.l}</label>
                                    <input type="number" step="any" className="form-input" value={(form as any)[f.k]} onChange={e => u(f.k, e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                                </div>
                            ))}
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '24px', width: '100%', padding: '14px', fontSize: '16px' }}>
                            {loading ? '🔄 Analyzing...' : '🩸 Predict Diabetes Risk (8 features)'}
                        </button>
                    </motion.form>
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                        {!result ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="glass-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🩸</div>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Ready to Predict</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Enter patient data and click predict.</p>
                                </div>
                                <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(168,85,247,0.2)' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '12px' }}>📋 Model Info</h4>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 2 }}>
                                        <div><strong>Algorithm:</strong> GradientBoostingClassifier</div>
                                        <div><strong>Datasets:</strong> PIMA + Frankfurt + Iraqi</div>
                                        <div><strong>Features:</strong> 8</div>
                                        <div><strong>Scaler:</strong> StandardScaler</div>
                                    </div>
                                </div>
                            </div>
                        ) : result.error ? (
                            <div className="glass-card" style={{ padding: '32px' }}><p style={{ color: 'var(--accent-red)' }}>⚠ {result.error}</p></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Diabetes Risk</h3>
                                    <div style={{ fontSize: '56px', fontFamily: 'Outfit', fontWeight: 900, color: result.risk_level === 'High' ? 'var(--accent-red)' : result.risk_level === 'Medium' ? 'var(--accent-orange)' : 'var(--accent-green)' }}>{result.risk_percentage}%</div>
                                    <div style={{ display: 'inline-block', padding: '6px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 700, marginTop: '8px', ...(result.risk_level === 'High' ? { background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' } : result.risk_level === 'Medium' ? { background: 'rgba(249,115,22,0.15)', color: 'var(--accent-orange)' } : { background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)' }) }}>{result.risk_level} Risk</div>
                                    <div className="progress-bar" style={{ marginTop: '20px' }}><div className="progress-fill" style={{ width: `${Math.min(result.risk_percentage, 100)}%`, background: result.risk_level === 'High' ? 'linear-gradient(90deg,var(--accent-red),var(--accent-red))' : 'linear-gradient(90deg,var(--accent-green),var(--accent-green))' }} /></div>
                                </div>
                                {result.recommendations && (
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h4 style={{ fontFamily: 'Outfit', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>💡 Recommendations</h4>
                                        {result.recommendations.map((r: string, i: number) => (<div key={i} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.03)', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{r}</div>))}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
