'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { predictStroke } from '@/lib/api';

export default function StrokePrediction() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [form, setForm] = useState({
        age: 50, gender: 'Male', hypertension: 'No', heart_disease: 'No',
        ever_married: 'No', work_type: 'Private', residence_type: 'Urban',
        avg_glucose_level: 100, bmi: 25, smoking_status: 'never smoked'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await predictStroke(form);
            setResult(res.data);
        } catch { setResult({ error: 'Failed to connect to prediction server.' }); }
        setLoading(false);
    };

    const updateField = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

    const ResultCard = ({ data }: { data: any }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Stroke Risk Assessment</h3>
                <div style={{ fontSize: '56px', fontFamily: 'Outfit', fontWeight: 900, color: data.risk_level === 'High' ? 'var(--accent-red)' : data.risk_level === 'Medium' ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                    {data.risk_percentage}%
                </div>
                <div style={{ display: 'inline-block', padding: '6px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 700, marginTop: '8px', ...(data.risk_level === 'High' ? { background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' } : data.risk_level === 'Medium' ? { background: 'rgba(249,115,22,0.15)', color: 'var(--accent-orange)' } : { background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)' }) }}>
                    {data.risk_level} Risk
                </div>
                <div className="progress-bar" style={{ marginTop: '20px' }}>
                    <div className="progress-fill" style={{ width: `${Math.min(data.risk_percentage, 100)}%`, background: data.risk_level === 'High' ? 'linear-gradient(90deg,var(--accent-red),var(--accent-red))' : data.risk_level === 'Medium' ? 'linear-gradient(90deg,var(--accent-orange),var(--accent-orange))' : 'linear-gradient(90deg,var(--accent-green),var(--accent-green))' }} />
                </div>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
                <h4 style={{ fontFamily: 'Outfit', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Details</h4>
                {[['Confidence', `${(data.confidence * 100).toFixed(1)}%`], ['Model', data.model_used], ['Prediction', data.prediction ? '⚠️ Risk Detected' : '✅ Low Risk']].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                        <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                ))}
            </div>
            {data.recommendations && (
                <div className="glass-card" style={{ padding: '24px' }}>
                    <h4 style={{ fontFamily: 'Outfit', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>💡 Recommendations</h4>
                    {data.recommendations.map((r: string, i: number) => (
                        <div key={i} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.03)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>{r}</div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <main style={{ minHeight: '100vh', paddingTop: '40px' }}>
            <div style={{ padding: '20px 40px' }}>
                <Link href="/predict" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '14px' }}>← Back to Predictions</Link>
            </div>
            <section style={{ padding: '0 40px 80px', maxWidth: '1100px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '48px' }}>🧠</span>
                        <h1 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 900 }} className="gradient-text">Stroke Risk Prediction</h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>CatBoost model with custom threshold optimization</p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                    <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>Patient Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {[
                                { label: 'Age', key: 'age', type: 'number' },
                                { label: 'Gender', key: 'gender', type: 'select', opts: ['Male', 'Female', 'Other'] },
                                { label: 'Hypertension', key: 'hypertension', type: 'select', opts: ['No', 'Yes'] },
                                { label: 'Heart Disease', key: 'heart_disease', type: 'select', opts: ['No', 'Yes'] },
                                { label: 'Average Glucose Level', key: 'avg_glucose_level', type: 'number' },
                                { label: 'BMI', key: 'bmi', type: 'number' },
                                { label: 'Ever Married', key: 'ever_married', type: 'select', opts: ['No', 'Yes'] },
                                { label: 'Work Type', key: 'work_type', type: 'select', opts: ['Private', 'Self-employed', 'Govt_job', 'Never_worked', 'children'] },
                                { label: 'Residence Type', key: 'residence_type', type: 'select', opts: ['Urban', 'Rural'] },
                                { label: 'Smoking Status', key: 'smoking_status', type: 'select', opts: ['formerly smoked', 'never smoked', 'smokes', 'Unknown'] },
                            ].map(field => (
                                <div key={field.key}>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>{field.label}</label>
                                    {field.type === 'select' ? (
                                        <select className="form-select" value={(form as any)[field.key]} onChange={e => updateField(field.key, e.target.value)}>
                                            {field.opts!.map(o => <option key={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <input type="number" step="any" className="form-input" value={(form as any)[field.key]} onChange={e => updateField(field.key, e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '24px', width: '100%', padding: '14px', fontSize: '16px', opacity: loading ? 0.7 : 1 }}>
                            {loading ? '🔄 Analyzing...' : '🧠 Predict Stroke Risk'}
                        </button>
                    </motion.form>

                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                        {!result ? (
                            <div className="glass-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
                                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🧠</div>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Ready to Predict</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Fill in patient data and click predict.</p>
                            </div>
                        ) : result.error ? (
                            <div className="glass-card" style={{ padding: '32px', borderColor: 'rgba(239,68,68,0.3)' }}>
                                <h3 style={{ color: 'var(--accent-red)', fontFamily: 'Outfit' }}>⚠ Error</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{result.error}</p>
                            </div>
                        ) : <ResultCard data={result} />}
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
