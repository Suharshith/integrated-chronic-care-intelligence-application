'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { predictHeart } from '@/lib/api';

export default function HeartPrediction() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [form, setForm] = useState({
        age: 50, sex: 'Male', chest_pain: 'Asymptomatic', resting_bp: 120,
        cholesterol: 200, fasting_blood_sugar: 'No', resting_ecg: 'Normal',
        max_heart_rate: 150, exercise_angina: 'No', st_depression: 1.0,
        slope: 'Flat', num_vessels: 0, thalassemia: 'Normal'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await predictHeart(form);
            setResult(res.data);
        } catch (err) {
            console.error(err);
            setResult({ error: 'Failed to connect to the prediction server. Make sure the backend is running.' });
        }
        setLoading(false);
    };

    const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

    return (
        <main style={{ minHeight: '100vh', paddingTop: '40px' }}>
            <div style={{ padding: '20px 40px' }}>
                <Link href="/predict" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '14px' }}>
                    ← Back to Predictions
                </Link>
            </div>

            <section style={{ padding: '0 40px 80px', maxWidth: '1100px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '48px' }}>🫀</span>
                        <h1 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 900 }} className="gradient-text">
                            Heart Disease Prediction
                        </h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>
                        Using XGBoost model with 13 clinical features + 4 engineered features
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                    {/* Form */}
                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card"
                        style={{ padding: '32px' }}
                    >
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-primary)' }}>
                            Patient Information
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Age</label>
                                <input type="number" className="form-input" value={form.age} onChange={e => updateField('age', parseInt(e.target.value))} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Sex</label>
                                <select className="form-select" value={form.sex} onChange={e => updateField('sex', e.target.value)}>
                                    <option>Male</option><option>Female</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Chest Pain Type</label>
                                <select className="form-select" value={form.chest_pain} onChange={e => updateField('chest_pain', e.target.value)}>
                                    <option>Typical Angina</option><option>Atypical Angina</option><option>Non-anginal Pain</option><option>Asymptomatic</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Resting BP (mmHg)</label>
                                <input type="number" className="form-input" value={form.resting_bp} onChange={e => updateField('resting_bp', parseInt(e.target.value))} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Cholesterol (mg/dL)</label>
                                <input type="number" className="form-input" value={form.cholesterol} onChange={e => updateField('cholesterol', parseInt(e.target.value))} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Fasting Blood Sugar &gt;120</label>
                                <select className="form-select" value={form.fasting_blood_sugar} onChange={e => updateField('fasting_blood_sugar', e.target.value)}>
                                    <option>No</option><option>Yes</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Resting ECG</label>
                                <select className="form-select" value={form.resting_ecg} onChange={e => updateField('resting_ecg', e.target.value)}>
                                    <option>Normal</option><option>ST-T Abnormality</option><option>LV Hypertrophy</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Max Heart Rate</label>
                                <input type="number" className="form-input" value={form.max_heart_rate} onChange={e => updateField('max_heart_rate', parseInt(e.target.value))} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Exercise Angina</label>
                                <select className="form-select" value={form.exercise_angina} onChange={e => updateField('exercise_angina', e.target.value)}>
                                    <option>No</option><option>Yes</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>ST Depression</label>
                                <input type="number" step="0.1" className="form-input" value={form.st_depression} onChange={e => updateField('st_depression', parseFloat(e.target.value))} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Slope</label>
                                <select className="form-select" value={form.slope} onChange={e => updateField('slope', e.target.value)}>
                                    <option>Upsloping</option><option>Flat</option><option>Downsloping</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Major Vessels (0-3)</label>
                                <input type="number" min="0" max="3" className="form-input" value={form.num_vessels} onChange={e => updateField('num_vessels', parseInt(e.target.value))} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Thalassemia</label>
                                <select className="form-select" value={form.thalassemia} onChange={e => updateField('thalassemia', e.target.value)}>
                                    <option>Normal</option><option>Fixed Defect</option><option>Reversible Defect</option><option>Unknown</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}
                            style={{ marginTop: '24px', width: '100%', padding: '14px', fontSize: '16px', opacity: loading ? 0.7 : 1 }}>
                            {loading ? '🔄 Analyzing...' : '🫀 Predict Heart Disease Risk'}
                        </button>
                    </motion.form>

                    {/* Results */}
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                        {!result ? (
                            <div className="glass-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
                                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🫀</div>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Ready to Predict</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                    Fill in the patient information and click predict to get the AI risk assessment.
                                </p>
                            </div>
                        ) : result.error ? (
                            <div className="glass-card" style={{ padding: '32px', borderColor: 'rgba(239,68,68,0.3)' }}>
                                <h3 style={{ color: 'var(--accent-red)', fontFamily: 'Outfit', fontSize: '18px', marginBottom: '8px' }}>⚠ Error</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{result.error}</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Risk Score Card */}
                                <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                        Risk Assessment
                                    </h3>
                                    <div style={{
                                        fontSize: '56px', fontFamily: 'Outfit', fontWeight: 900, marginBottom: '8px',
                                        color: result.risk_level === 'High' ? 'var(--accent-red)' : result.risk_level === 'Medium' ? 'var(--accent-orange)' : 'var(--accent-green)'
                                    }}>
                                        {result.risk_percentage}%
                                    </div>
                                    <div style={{
                                        display: 'inline-block', padding: '6px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 700,
                                        ...(result.risk_level === 'High' ? { background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' } :
                                            result.risk_level === 'Medium' ? { background: 'rgba(249,115,22,0.15)', color: 'var(--accent-orange)' } :
                                                { background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)' })
                                    }}>
                                        {result.risk_level} Risk
                                    </div>
                                    <div className="progress-bar" style={{ marginTop: '20px' }}>
                                        <div className="progress-fill" style={{
                                            width: `${result.risk_percentage}%`,
                                            background: result.risk_level === 'High' ? 'linear-gradient(90deg, var(--accent-red), var(--accent-red))' :
                                                result.risk_level === 'Medium' ? 'linear-gradient(90deg, var(--accent-orange), var(--accent-orange))' :
                                                    'linear-gradient(90deg, var(--accent-green), var(--accent-green))'
                                        }} />
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="glass-card" style={{ padding: '24px' }}>
                                    <h4 style={{ fontFamily: 'Outfit', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Details</h4>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Confidence</span>
                                            <span style={{ fontWeight: 600 }}>{(result.confidence * 100).toFixed(1)}%</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Model Used</span>
                                            <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{result.model_used}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Prediction</span>
                                            <span style={{ fontWeight: 600 }}>{result.prediction ? '⚠️ Positive' : '✅ Negative'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recommendations */}
                                {result.recommendations && (
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h4 style={{ fontFamily: 'Outfit', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
                                            💡 Recommendations
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {result.recommendations.map((rec: string, i: number) => (
                                                <div key={i} style={{
                                                    padding: '10px 14px', borderRadius: '10px',
                                                    background: 'rgba(0,0,0,0.03)',
                                                    fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5
                                                }}>
                                                    {rec}
                                                </div>
                                            ))}
                                        </div>
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
