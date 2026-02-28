'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { predictKidney } from '@/lib/api';

export default function KidneyPrediction() {
    const [form, setForm] = useState({
        age: 50,
        blood_pressure: 80,
        specific_gravity: 1.020,
        albumin: 0,
        sugar: 0,
        blood_glucose: 120,
        blood_urea: 36,
        serum_creatinine: 1.2,
        sodium: 138,
        potassium: 4.5,
        hemoglobin: 15,
        packed_cell_volume: 44,
        wbc_count: 7800,
        rbc_count: 5.2,
        red_blood_cells: 'normal',
        pus_cell: 'normal',
        pus_cell_clumps: 'notpresent',
        bacteria: 'notpresent',
        hypertension: 'no',
        diabetes_mellitus: 'no',
        coronary_artery_disease: 'no',
        appetite: 'good',
        pedal_edema: 'no',
        anaemia: 'no'
    });

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const update = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await predictKidney(form);
            setResult(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || "Failed to connect to server.");
        } finally {
            setLoading(false);
        }
    };

    const numInput = (key: string, label: string, step = 1) => (
        <div key={key}>
            <label className="input-label">{label}</label>
            <input
                type="number"
                step={step}
                className="form-input"
                value={(form as any)[key]}
                onChange={e => update(key, e.target.value === '' ? '' : parseFloat(e.target.value))}
            />
        </div>
    );

    const selInput = (key: string, label: string, opts: string[]) => (
        <div key={key}>
            <label className="input-label">{label}</label>
            <select
                className="form-select"
                value={(form as any)[key]}
                onChange={e => update(key, e.target.value)}
            >
                {opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
            </select>
        </div>
    );

    return (
        <main style={{ minHeight: '100vh', paddingTop: '40px' }}>
            <div style={{ padding: '20px 40px' }}>
                <Link href="/predict" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '14px' }}>
                    ← Back to Models
                </Link>
            </div>

            <section style={{ padding: '0 40px 80px', maxWidth: '1200px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '48px' }}>🫘</span>
                        <h1 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 900 }} className="gradient-text">
                            Kidney Disease Assessment
                        </h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                        RF + 1D-CNN Ensemble — 24 clinical features including lab blood work and physical symptoms
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '32px' }}>

                    <motion.form onSubmit={handleSubmit} layout className="glass-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: 'var(--accent-orange)' }}>
                            Clinical Data Input
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                            <div style={{ gridColumn: 'span 3', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px', marginTop: '10px' }}>🩸 Lab Results (Numerical)</div>
                            {numInput('age', 'Age')}
                            {numInput('blood_pressure', 'Blood Pressure')}
                            {numInput('specific_gravity', 'Specific Gravity', 0.001)}
                            {numInput('albumin', 'Albumin (0-5)')}
                            {numInput('sugar', 'Sugar (0-5)')}
                            {numInput('blood_glucose', 'Blood Glucose')}
                            {numInput('blood_urea', 'Blood Urea')}
                            {numInput('serum_creatinine', 'Serum Creatinine', 0.1)}
                            {numInput('sodium', 'Sodium')}
                            {numInput('potassium', 'Potassium', 0.1)}
                            {numInput('hemoglobin', 'Hemoglobin', 0.1)}
                            {numInput('packed_cell_volume', 'Packed Cell Volume')}
                            {numInput('wbc_count', 'WBC Count')}
                            {numInput('rbc_count', 'RBC Count', 0.1)}

                            <div style={{ gridColumn: 'span 3', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px', marginTop: '20px' }}>🏥 Clinical Flags (Categorical)</div>
                            {selInput('red_blood_cells', 'Red Blood Cells', ['normal', 'abnormal'])}
                            {selInput('pus_cell', 'Pus Cell', ['normal', 'abnormal'])}
                            {selInput('pus_cell_clumps', 'Pus Cell Clumps', ['notpresent', 'present'])}
                            {selInput('bacteria', 'Bacteria', ['notpresent', 'present'])}
                            {selInput('hypertension', 'Hypertension', ['no', 'yes'])}
                            {selInput('diabetes_mellitus', 'Diabetes Mellitus', ['no', 'yes'])}
                            {selInput('coronary_artery_disease', 'CAD', ['no', 'yes'])}
                            {selInput('appetite', 'Appetite', ['good', 'poor'])}
                            {selInput('pedal_edema', 'Pedal Edema', ['no', 'yes'])}
                            {selInput('anaemia', 'Anaemia', ['no', 'yes'])}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{ width: '100%', padding: '16px', fontSize: '16px' }}
                        >
                            {loading ? '🔄 Analysis in Progress...' : '🚀 Run Kidney Analysis'}
                        </button>

                        {error && (
                            <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--accent-red)', fontSize: '13px' }}>
                                ⚠ {error}
                            </div>
                        )}
                    </motion.form>

                    <AnimatePresence mode="wait">
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="glass-card"
                                style={{ padding: '32px' }}
                            >
                                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Assessment Result</h3>
                                    <div style={{
                                        fontSize: '48px',
                                        fontFamily: 'Outfit',
                                        fontWeight: 900,
                                        color: result.prediction ? 'var(--accent-red)' : 'var(--accent-green)',
                                        textShadow: `0 10px 20px ${result.prediction ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`
                                    }}>
                                        {result.risk_percentage}%
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                                        {result.risk_level} Risk for Chronic Kidney Disease
                                    </p>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '6px 20px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        ...(result.prediction ? { background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)' } : { background: 'rgba(34,197,94,0.1)', color: 'var(--accent-green)' })
                                    }}>
                                        {result.prediction ? 'CKD INDICATED' : 'STABLE KIDNEY FUNCTION'}
                                    </div>
                                </div>

                                <div className="stats-grid" style={{ marginBottom: '32px' }}>
                                    <div className="stat-card">
                                        <div className="stat-label">Model Accuracy</div>
                                        <div className="stat-value">99.1%</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-label">Ensemble Mode</div>
                                        <div className="stat-value">{result.ensemble ? 'Active' : 'Tabular Only'}</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-label">Confidence</div>
                                        <div className="stat-value">{Math.round(result.confidence * 100)}%</div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-orange)' }}>💡 AI Insights & Recommendations</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {result.recommendations?.map((rec: string, i: number) => (
                                            <div key={i} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', fontSize: '13px', border: '1px solid rgba(255,255,255,0.05)', lineHeight: 1.5 }}>
                                                {rec}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setResult(null)} className="btn-outline" style={{ flex: 1, padding: '12px' }}>🔄 Reset</button>
                                    <Link href="/doctors" style={{ flex: 1 }}><button className="btn-primary" style={{ width: '100%', padding: '12px' }}>📍 Find Nephrologist</button></Link>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            <style jsx>{`
                .input-label {
                    display: block;
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--text-secondary);
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .form-input, .form-select {
                    width: 100%;
                    padding: 10px 14px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-size: 13px;
                    transition: all 0.2s;
                    outline: none;
                }
                .form-input:focus, .form-select:focus {
                    border-color: var(--accent-orange);
                    background: rgba(255, 255, 255, 0.05);
                    box-shadow: 0 0 15px rgba(249, 115, 22, 0.1);
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                }
                .stat-card {
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    text-align: center;
                }
                .stat-label {
                    font-size: 10px;
                    color: var(--text-secondary);
                    margin-bottom: 4px;
                    text-transform: uppercase;
                    font-weight: 700;
                }
                .stat-value {
                    font-family: 'Outfit';
                    font-size: 16px;
                    font-weight: 800;
                    color: var(--text-primary);
                }
            `}</style>
        </main>
    );
}
