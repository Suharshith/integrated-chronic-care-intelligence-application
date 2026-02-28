'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { recordVitals, getVitals } from '@/lib/api';

export default function VitalsPage() {
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState<any[]>([]);
    const [form, setForm] = useState({
        patient_id: 'PAT-0001',
        blood_pressure_systolic: 120, blood_pressure_diastolic: 80,
        heart_rate: 72, blood_sugar: 100, spo2: 98,
        temperature: 98.6, weight: 70
    });

    const u = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));

    const handleRecord = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try {
            await recordVitals(form);
            const res = await getVitals(form.patient_id);
            setRecords(res.data.records || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleLoad = async () => {
        try {
            const res = await getVitals(form.patient_id);
            setRecords(res.data.records || []);
        } catch { console.error('Failed to load vitals'); }
    };

    const getStatusColor = (label: string, value: number) => {
        if (label === 'BP Systolic') return value > 140 ? 'var(--accent-red)' : value > 120 ? 'var(--accent-orange)' : 'var(--accent-green)';
        if (label === 'Heart Rate') return value > 100 ? 'var(--accent-red)' : value < 60 ? 'var(--accent-orange)' : 'var(--accent-green)';
        if (label === 'Blood Sugar') return value > 140 ? 'var(--accent-red)' : value > 100 ? 'var(--accent-orange)' : 'var(--accent-green)';
        if (label === 'SpO2') return value < 95 ? 'var(--accent-red)' : value < 97 ? 'var(--accent-orange)' : 'var(--accent-green)';
        return 'var(--accent-green)';
    };

    return (
        <main style={{ minHeight: '100vh', paddingTop: '40px' }}>
            <div style={{ padding: '20px 40px' }}>
                <Link href="/dashboard" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</Link>
            </div>
            <section style={{ padding: '0 40px 80px', maxWidth: '1200px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 900, marginBottom: '8px' }} className="gradient-text">Vitals Monitor</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Record and track patient vitals over time</p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    {/* Record Form */}
                    <motion.form onSubmit={handleRecord} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>📝 Record Vitals</h3>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Patient ID</label>
                            <input className="form-input" value={form.patient_id} onChange={e => u('patient_id', e.target.value)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {[
                                { l: 'BP Systolic (mmHg)', k: 'blood_pressure_systolic' },
                                { l: 'BP Diastolic (mmHg)', k: 'blood_pressure_diastolic' },
                                { l: 'Heart Rate (bpm)', k: 'heart_rate' },
                                { l: 'Blood Sugar (mg/dL)', k: 'blood_sugar' },
                                { l: 'SpO2 (%)', k: 'spo2' },
                                { l: 'Temperature (°F)', k: 'temperature' },
                                { l: 'Weight (kg)', k: 'weight' },
                            ].map(f => (
                                <div key={f.k}>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>{f.l}</label>
                                    <input type="number" step="any" className="form-input" value={(form as any)[f.k]} onChange={e => u(f.k, e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                                </div>
                            ))}
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '24px', width: '100%', padding: '14px', fontSize: '16px' }}>
                            {loading ? '🔄 Recording...' : '📈 Record Vitals'}
                        </button>
                    </motion.form>

                    {/* Current Vitals Display */}
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700 }}>💓 Current Vitals</h3>
                                <button onClick={handleLoad} className="btn-outline" style={{ padding: '6px 16px', fontSize: '12px' }}>Refresh</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                {[
                                    { label: 'BP Systolic', value: form.blood_pressure_systolic, unit: 'mmHg', icon: '🩸' },
                                    { label: 'Heart Rate', value: form.heart_rate, unit: 'bpm', icon: '💓' },
                                    { label: 'Blood Sugar', value: form.blood_sugar, unit: 'mg/dL', icon: '🍬' },
                                    { label: 'SpO2', value: form.spo2, unit: '%', icon: '🫁' },
                                ].map(v => (
                                    <div key={v.label} style={{
                                        padding: '18px', borderRadius: '14px',
                                        background: `${getStatusColor(v.label, v.value)}08`,
                                        border: `1px solid ${getStatusColor(v.label, v.value)}25`
                                    }}>
                                        <div style={{ fontSize: '20px', marginBottom: '6px' }}>{v.icon}</div>
                                        <div style={{ fontSize: '24px', fontFamily: 'Outfit', fontWeight: 800, color: getStatusColor(v.label, v.value) }}>
                                            {v.value}<span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '4px' }}>{v.unit}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{v.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* History */}
                        <div className="glass-card" style={{ padding: '28px' }}>
                            <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>📋 Vitals History</h3>
                            {records.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                                    No vitals recorded yet. Record your first entry above.
                                </p>
                            ) : (
                                <div style={{ maxHeight: '250px', overflow: 'auto' }}>
                                    {records.slice().reverse().map((r, i) => (
                                        <div key={i} style={{
                                            display: 'flex', justifyContent: 'space-between',
                                            padding: '10px 14px', borderRadius: '8px',
                                            background: i % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'transparent',
                                            fontSize: '12px', marginBottom: '4px'
                                        }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>{new Date(r.timestamp).toLocaleString()}</span>
                                            <span>BP: {r.blood_pressure_systolic}/{r.blood_pressure_diastolic} | HR: {r.heart_rate} | Sugar: {r.blood_sugar}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
