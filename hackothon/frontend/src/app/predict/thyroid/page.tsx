'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { predictThyroid } from '@/lib/api';

export default function ThyroidPrediction() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [form, setForm] = useState({
        age: 40, sex: 'Female',
        on_thyroxine: 'No', query_on_thyroxine: 'No', on_antithyroid_meds: 'No',
        sick: 'No', pregnant: 'No', thyroid_surgery: 'No', I131_treatment: 'No',
        query_hypothyroid: 'No', query_hyperthyroid: 'No',
        lithium: 'No', goitre: 'No', tumor: 'No', psych: 'No',
        TSH: 2.5, T3: 1.5, TT4: 110.0, T4U: 1.0, FTI: 110.0, TBG: 20.0
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try { const res = await predictThyroid(form); setResult(res.data); }
        catch { setResult({ error: 'Failed to connect.' }); }
        setLoading(false);
    };
    const u = (f: string, v: any) => {
        if (f === 'sex' && v === 'Male') {
            setForm(p => ({ ...p, [f]: v, pregnant: 'No' }));
        } else {
            setForm(p => ({ ...p, [f]: v }));
        }
    };

    return (
        <main style={{ minHeight: '100vh', paddingTop: '40px' }}>
            <div style={{ padding: '20px 40px' }}><Link href="/predict" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '14px' }}>← Back</Link></div>
            <section style={{ padding: '0 40px 80px', maxWidth: '1200px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '48px' }}>🦋</span>
                        <h1 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 900 }} className="gradient-text">Thyroid Prediction</h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>RandomForest model — 21 features, 3 classes (Negative, Hyperthyroid, Hypothyroid)</p>
                </motion.div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '32px' }}>
                    <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ padding: '32px' }}>
                        {/* Thyroid Hormone Panel */}
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-purple)' }}>🧪 Thyroid Hormone Panel (6 values)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            {[
                                { l: 'TSH (mIU/L)', k: 'TSH', hint: 'Normal: 0.4–4.5' },
                                { l: 'T3 (ng/dL)', k: 'T3', hint: 'Normal: 0.8–2.0' },
                                { l: 'TT4 (μg/dL)', k: 'TT4', hint: 'Normal: 5–12' },
                                { l: 'T4U (ratio)', k: 'T4U', hint: 'Normal: 0.7–1.2' },
                                { l: 'FTI (index)', k: 'FTI', hint: 'Normal: 60–160' },
                                { l: 'TBG (μg/dL)', k: 'TBG', hint: 'Normal: 12–30' },
                            ].map(f => (
                                <div key={f.k}>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>{f.l}</label>
                                    <input type="number" step="any" className="form-input" value={(form as any)[f.k]} onChange={e => u(f.k, e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', opacity: 0.6 }}>{f.hint}</span>
                                </div>
                            ))}
                        </div>

                        {/* Patient Info */}
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-cyan)' }}>👤 Patient Info</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Age</label>
                                <input type="number" className="form-input" value={form.age} onChange={e => u('age', e.target.value === '' ? '' : parseInt(e.target.value) || 0)} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Sex</label>
                                <select className="form-select" value={form.sex} onChange={e => u('sex', e.target.value)}>
                                    <option>Female</option><option>Male</option>
                                </select>
                            </div>
                        </div>

                        {/* Clinical History (15 binary flags) */}
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-orange)' }}>🏥 Clinical History (14 flags)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            {[
                                { l: 'On Thyroxine', k: 'on_thyroxine' },
                                { l: 'Query On Thyroxine', k: 'query_on_thyroxine' },
                                { l: 'On Antithyroid Meds', k: 'on_antithyroid_meds' },
                                { l: 'Sick', k: 'sick' },
                                ...(form.sex === 'Female' ? [{ l: 'Pregnant', k: 'pregnant' }] : []),
                                { l: 'Thyroid Surgery', k: 'thyroid_surgery' },
                                { l: 'I131 Treatment', k: 'I131_treatment' },
                                { l: 'Query Hypothyroid', k: 'query_hypothyroid' },
                                { l: 'Query Hyperthyroid', k: 'query_hyperthyroid' },
                                { l: 'Lithium', k: 'lithium' },
                                { l: 'Goitre', k: 'goitre' },
                                { l: 'Tumor', k: 'tumor' },
                                { l: 'Psychiatric Symptoms', k: 'psych' },
                            ].map(f => (
                                <div key={f.k}>
                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>{f.l}</label>
                                    <select className="form-select" style={{ padding: '8px 12px', fontSize: '13px' }} value={(form as any)[f.k]} onChange={e => u(f.k, e.target.value)}>
                                        <option>No</option><option>Yes</option>
                                    </select>
                                </div>
                            ))}
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '24px', width: '100%', padding: '14px', fontSize: '16px' }}>
                            {loading ? '🔄 Analyzing...' : '🦋 Predict Thyroid Risk (21 features)'}
                        </button>
                    </motion.form>

                    {/* Results */}
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                        {!result ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="glass-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🦋</div>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Ready to Predict</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Enter all 21 thyroid panel values and clinical flags.</p>
                                </div>
                                <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(168,85,247,0.2)' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '12px' }}>📋 Model Info</h4>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 2 }}>
                                        <div><strong>Algorithm:</strong> RandomForestClassifier</div>
                                        <div><strong>Accuracy:</strong> 98.17%</div>
                                        <div><strong>Features:</strong> 21 (6 hormones + age + 14 clinical)</div>
                                        <div><strong>Classes:</strong> Negative, Hyperthyroid, Hypothyroid</div>
                                    </div>
                                </div>
                                <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(34,197,94,0.2)' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-green)', marginBottom: '12px' }}>📊 Normal Ranges</h4>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 2 }}>
                                        <div>TSH: 0.4 – 4.5 mIU/L</div>
                                        <div>T3: 0.8 – 2.0 ng/dL</div>
                                        <div>TT4: 5.0 – 12.0 μg/dL</div>
                                        <div>T4U: 0.7 – 1.2 (ratio)</div>
                                        <div>FTI: 60 – 160 (index)</div>
                                        <div>TBG: 12 – 30 μg/dL</div>
                                    </div>
                                </div>
                            </div>
                        ) : result.error ? (
                            <div className="glass-card" style={{ padding: '32px' }}><p style={{ color: 'var(--accent-red)' }}>⚠ {result.error}</p></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Thyroid Risk</h3>
                                    <div style={{ fontSize: '56px', fontFamily: 'Outfit', fontWeight: 900, color: result.risk_level === 'High' ? 'var(--accent-red)' : result.risk_level === 'Medium' ? 'var(--accent-orange)' : 'var(--accent-green)' }}>{result.risk_percentage}%</div>
                                    <div style={{ display: 'inline-block', padding: '6px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 700, marginTop: '8px', ...(result.risk_level === 'High' ? { background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' } : result.risk_level === 'Medium' ? { background: 'rgba(249,115,22,0.15)', color: 'var(--accent-orange)' } : { background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)' }) }}>{result.risk_level} Risk</div>
                                    <div className="progress-bar" style={{ marginTop: '20px' }}><div className="progress-fill" style={{ width: `${Math.min(result.risk_percentage, 100)}%`, background: result.risk_level === 'High' ? 'linear-gradient(90deg,var(--accent-red),var(--accent-red))' : 'linear-gradient(90deg,var(--accent-green),var(--accent-green))' }} /></div>
                                </div>
                                <div className="glass-card" style={{ padding: '24px' }}>
                                    <h4 style={{ fontFamily: 'Outfit', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Details</h4>
                                    {[['Confidence', `${(result.confidence * 100).toFixed(1)}%`], ['Model', result.model_used], ['Prediction', result.prediction ? '⚠️ Disorder Detected' : '✅ Negative']].map(([l, v]) => (
                                        <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
                                        </div>
                                    ))}
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
