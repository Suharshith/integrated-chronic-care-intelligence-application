'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { predictComprehensive } from '@/lib/api';

export default function ComprehensivePrediction() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [step, setStep] = useState(0);

    const [form, setForm] = useState({
        name: '', age: 40, sex: 'Male', phone: '', latitude: '', longitude: '',
        // Heart
        chest_pain: 'Asymptomatic', resting_bp: 120, cholesterol: 200,
        fasting_blood_sugar: 'No', resting_ecg: 'Normal', max_heart_rate: 150,
        exercise_angina: 'No', st_depression: 1.0, slope: 'Flat', num_vessels: 0, thalassemia: 'Normal',
        // Kidney
        blood_pressure: 80, specific_gravity: 1.020, albumin: 0, sugar: 0,
        blood_glucose: 120, blood_urea: 36, serum_creatinine: 1.2, sodium: 138,
        potassium: 4.5, hemoglobin: 15, packed_cell_volume: 44, wbc_count: 7800, rbc_count: 5.2,
        red_blood_cells: 'normal', pus_cell: 'normal', pus_cell_clumps: 'notpresent',
        bacteria: 'notpresent', hypertension: 'No', diabetes_mellitus: 'no',
        coronary_artery_disease: 'no', appetite: 'good', pedal_edema: 'no', anaemia: 'no',
        // Stroke
        heart_disease: 'No', ever_married: 'No', work_type: 'Private',
        residence_type: 'Urban', avg_glucose_level: 100, bmi: 25, smoking_status: 'never smoked',
        // Diabetes
        pregnancies: 0, glucose: 120, skin_thickness: 20, insulin: 100, diabetes_pedigree: 0.5,
        // Brain
        brain_mri: null as File | null,
        brain_mri_base64: '' as string,
        // Thyroid
        on_thyroxine: 'No', query_on_thyroxine: 'No', on_antithyroid_meds: 'No',
        sick: 'No', pregnant: 'No', thyroid_surgery: 'No', I131_treatment: 'No',
        query_hypothyroid: 'No', query_hyperthyroid: 'No', lithium: 'No',
        goitre: 'No', tumor: 'No', psych: 'No',
        TSH: 2.5, T3: 1.5, TT4: 110, T4U: 1.0, FTI: 110, TBG: 20,
    });

    const u = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }));
    const numInput = (key: string, label: string) => (
        <div key={key}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>{label}</label>
            <input type="number" step="any" className="form-input" style={{ padding: '8px 12px', fontSize: '13px' }} value={(form as any)[key]} onChange={e => u(key, e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
        </div>
    );
    const selInput = (key: string, label: string, opts: string[]) => (
        <div key={key}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>{label}</label>
            <select className="form-select" style={{ padding: '8px 12px', fontSize: '13px' }} value={(form as any)[key]} onChange={e => u(key, e.target.value)}>
                {opts.map(o => <option key={o}>{o}</option>)}
            </select>
        </div>
    );

    const detectLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                u('latitude', pos.coords.latitude.toString());
                u('longitude', pos.coords.longitude.toString());
            });
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Remove the File object before sending JSON
            const { brain_mri, ...submissionForm } = form;
            const payload = {
                ...submissionForm,
                latitude: form.latitude ? parseFloat(form.latitude as string) : null,
                longitude: form.longitude ? parseFloat(form.longitude as string) : null
            };
            const res = await predictComprehensive(payload);
            setResult(res.data);
        } catch { setResult({ error: 'Failed to connect to server.' }); }
        setLoading(false);
    };

    const handleBrainFile = (file: File | null) => {
        if (!file) {
            setForm(p => ({ ...p, brain_mri: null, brain_mri_base64: '' }));
            return;
        }
        setForm(p => ({ ...p, brain_mri: file }));
        const reader = new FileReader();
        reader.onloadend = () => {
            setForm(p => ({ ...p, brain_mri_base64: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const steps = [
        {
            title: '👤 Patient Info', color: 'var(--accent-purple)',
            fields: (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div><label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Full Name</label>
                        <input className="form-input" style={{ padding: '8px 12px', fontSize: '13px' }} value={form.name} onChange={e => u('name', e.target.value)} placeholder="Patient Name" /></div>
                    {numInput('age', 'Age')}
                    {selInput('sex', 'Sex', ['Male', 'Female'])}
                    <div><label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Phone</label>
                        <input className="form-input" style={{ padding: '8px 12px', fontSize: '13px' }} value={form.phone} onChange={e => u('phone', e.target.value)} placeholder="+91..." /></div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <button type="button" onClick={detectLocation} className="btn-outline" style={{ padding: '8px 16px', fontSize: '12px' }}>📍 Auto-detect Location</button>
                        {form.latitude && <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '10px' }}>({form.latitude}, {form.longitude})</span>}
                    </div>
                </div>
            )
        },
        {
            title: '🫀 Heart Data', color: 'var(--accent-red)',
            fields: (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {selInput('chest_pain', 'Chest Pain', ['Typical Angina', 'Atypical Angina', 'Non-anginal Pain', 'Asymptomatic'])}
                    {numInput('resting_bp', 'Resting BP')} {numInput('cholesterol', 'Cholesterol')}
                    {selInput('fasting_blood_sugar', 'Fasting BS >120', ['No', 'Yes'])}
                    {selInput('resting_ecg', 'Resting ECG', ['Normal', 'ST-T Abnormality', 'LV Hypertrophy'])}
                    {numInput('max_heart_rate', 'Max Heart Rate')}
                    {selInput('exercise_angina', 'Exercise Angina', ['No', 'Yes'])}
                    {numInput('st_depression', 'ST Depression')}
                    {selInput('slope', 'Slope', ['Upsloping', 'Flat', 'Downsloping'])}
                    {numInput('num_vessels', 'Major Vessels (0-3)')}
                    {selInput('thalassemia', 'Thalassemia', ['Normal', 'Fixed Defect', 'Reversible Defect', 'Unknown'])}
                </div>
            )
        },
        {
            title: '🩸 Diabetes & Brain', color: 'var(--accent-cyan)',
            fields: (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: 'span 3', fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)' }}>🩸 Diabetes</div>
                    {numInput('pregnancies', 'Pregnancies')} {numInput('glucose', 'Glucose')}
                    {numInput('skin_thickness', 'Skin Thickness')} {numInput('insulin', 'Insulin')}
                    {numInput('diabetes_pedigree', 'Pedigree Fn')} {numInput('bmi', 'BMI')}
                    <div style={{ gridColumn: 'span 3', fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '20px' }}>� Brain Tumor (MRI Scan)</div>
                    <div style={{ gridColumn: 'span 3' }}>
                        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="comp-brain-upload"
                                onChange={e => handleBrainFile(e.target.files?.[0] || null)}
                            />
                            <label htmlFor="comp-brain-upload" style={{ cursor: 'pointer' }}>
                                {form.brain_mri ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden' }}>
                                            {form.brain_mri_base64 && (
                                                <img src={form.brain_mri_base64} alt="MRI Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
                                        </div>
                                        <span style={{ fontSize: '12px' }}>{form.brain_mri.name} (Ready)</span>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Click to upload Brain MRI (Optional)</div>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: '🧠 Stroke & Kidney', color: 'var(--accent-orange)',
            fields: (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: 'span 3', fontSize: '13px', fontWeight: 700, color: 'var(--accent-orange)' }}>🧠 Stroke Risk Factors</div>
                    {selInput('hypertension', 'Hypertension', ['No', 'Yes'])}
                    {selInput('heart_disease', 'Heart Disease', ['No', 'Yes'])}
                    {selInput('ever_married', 'Ever Married', ['No', 'Yes'])}
                    {selInput('work_type', 'Work Type', ['Private', 'Self-employed', 'Govt_job', 'Never_worked', 'children'])}
                    {selInput('residence_type', 'Residence', ['Urban', 'Rural'])}
                    {selInput('smoking_status', 'Smoking', ['formerly smoked', 'never smoked', 'smokes', 'Unknown'])}
                    {numInput('avg_glucose_level', 'Avg Glucose')}
                    <div style={{ gridColumn: 'span 3', fontSize: '13px', fontWeight: 700, color: 'var(--accent-orange)', marginTop: '10px' }}>🫘 Kidney (Lab Values)</div>
                    {numInput('blood_pressure', 'Blood Pressure')} {numInput('specific_gravity', 'Specific Gravity')}
                    {numInput('blood_urea', 'Blood Urea')} {numInput('serum_creatinine', 'Serum Creatinine')}
                    {numInput('sodium', 'Sodium')} {numInput('potassium', 'Potassium')}
                    {numInput('hemoglobin', 'Hemoglobin')} {numInput('packed_cell_volume', 'PCV')}
                    {numInput('wbc_count', 'WBC Count')} {numInput('rbc_count', 'RBC Count')}
                </div>
            )
        },
        {
            title: '🦋 Thyroid Panel', color: 'var(--accent-pink)',
            fields: (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: 'span 3', fontSize: '13px', fontWeight: 700, color: 'var(--accent-pink)' }}>🧪 Hormones</div>
                    {numInput('TSH', 'TSH')} {numInput('T3', 'T3')} {numInput('TT4', 'TT4')}
                    {numInput('T4U', 'T4U')} {numInput('FTI', 'FTI')} {numInput('TBG', 'TBG')}
                    <div style={{ gridColumn: 'span 3', fontSize: '13px', fontWeight: 700, color: 'var(--accent-pink)', marginTop: '8px' }}>🏥 Clinical Flags</div>
                    {selInput('on_thyroxine', 'On Thyroxine', ['No', 'Yes'])}
                    {selInput('on_antithyroid_meds', 'Antithyroid Meds', ['No', 'Yes'])}
                    {selInput('sick', 'Sick', ['No', 'Yes'])}
                    {form.sex === 'Female' && selInput('pregnant', 'Pregnant', ['No', 'Yes'])}
                    {selInput('thyroid_surgery', 'Thyroid Surgery', ['No', 'Yes'])}
                    {selInput('I131_treatment', 'I131 Treatment', ['No', 'Yes'])}
                    {selInput('goitre', 'Goitre', ['No', 'Yes'])}
                    {selInput('tumor', 'Tumor', ['No', 'Yes'])}
                    {selInput('psych', 'Psychiatric', ['No', 'Yes'])}
                </div>
            )
        }
    ];

    const getRiskColor = (level: string) => level === 'High' ? 'var(--accent-red)' : level === 'Medium' ? 'var(--accent-orange)' : 'var(--accent-green)';

    return (
        <main style={{ minHeight: '100vh', paddingTop: '40px' }}>
            <div style={{ padding: '20px 40px' }}>
                <Link href="/predict" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '14px' }}>← Back</Link>
            </div>
            <section style={{ padding: '0 40px 80px', maxWidth: '1300px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 900, marginBottom: '4px' }} className="gradient-text">
                        🏥 Comprehensive Health Assessment
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>
                        Run ALL 6 AI models simultaneously — Get complete risk profile, AI explanation, diet plan & doctor suggestions
                    </p>
                </motion.div>

                {!result ? (
                    <div>
                        {/* Step Indicators */}
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
                            {steps.map((s, i) => (
                                <button key={i} onClick={() => setStep(i)} style={{
                                    flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                                    cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                                    background: step === i ? `${s.color}20` : 'rgba(0,0,0,0.03)',
                                    color: step === i ? s.color : 'var(--text-secondary)',
                                    borderBottom: step === i ? `3px solid ${s.color}` : '3px solid transparent'
                                }}>
                                    {s.title}
                                </button>
                            ))}
                        </div>

                        {/* Form Step */}
                        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
                            <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: steps[step].color }}>
                                {steps[step].title}
                            </h3>
                            {steps[step].fields}
                        </motion.div>

                        {/* Navigation */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                            <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="btn-outline" style={{ padding: '12px 28px', opacity: step === 0 ? 0.3 : 1 }}>
                                ← Previous
                            </button>
                            {step < steps.length - 1 ? (
                                <button onClick={() => setStep(step + 1)} className="btn-primary" style={{ padding: '12px 28px' }}>
                                    Next →
                                </button>
                            ) : (
                                <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ padding: '14px 40px', fontSize: '16px' }}>
                                    {loading ? '🔄 Running 6 AI Models...' : '🚀 Run Comprehensive Assessment'}
                                </button>
                            )}
                        </div>
                    </div>
                ) : result.error ? (
                    <div className="glass-card" style={{ padding: '32px' }}>
                        <p style={{ color: 'var(--accent-red)' }}>⚠ {result.error}</p>
                        <button onClick={() => setResult(null)} className="btn-outline" style={{ marginTop: '16px' }}>Try Again</button>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {/* Patient ID & Overall Risk */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', border: '1px solid rgba(168,85,247,0.2)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Patient ID</div>
                                <div style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 900, color: 'var(--accent-purple)' }}>{result.patient_id}</div>
                            </div>
                            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Overall Risk</div>
                                <div style={{ fontFamily: 'Outfit', fontSize: '28px', fontWeight: 900, color: result.overall_risk_percentage > 50 ? 'var(--accent-red)' : result.overall_risk_percentage > 30 ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                                    {result.overall_risk_percentage}%
                                </div>
                            </div>
                            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Highest Risk</div>
                                <div style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 900, color: 'var(--accent-red)', textTransform: 'capitalize' }}>{result.highest_risk_condition || 'None'}</div>
                            </div>
                        </div>

                        {/* Individual Results Grid */}
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>📊 Individual Disease Risks</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            {result.predictions && Object.entries(result.predictions).map(([disease, pred]: [string, any]) => (
                                <div key={disease} className="glass-card" style={{ padding: '20px', borderLeft: `4px solid ${getRiskColor(pred.risk_level)}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <h4 style={{ fontFamily: 'Outfit', fontSize: '15px', fontWeight: 700, textTransform: 'capitalize' }}>{disease}</h4>
                                        <span style={{ padding: '3px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: `${getRiskColor(pred.risk_level)}15`, color: getRiskColor(pred.risk_level) }}>
                                            {pred.risk_level}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '32px', fontFamily: 'Outfit', fontWeight: 900, color: getRiskColor(pred.risk_level), marginBottom: '8px' }}>
                                        {pred.risk_percentage}%
                                    </div>
                                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(pred.risk_percentage, 100)}%`, background: getRiskColor(pred.risk_level) }} /></div>
                                </div>
                            ))}
                        </div>

                        {/* AI Explanation */}
                        {result.ai_explanation && (
                            <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-purple)' }}>🤖 AI Health Explanation</h3>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{result.ai_explanation}</div>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button onClick={() => setResult(null)} className="btn-outline" style={{ padding: '12px 24px' }}>🔄 New Assessment</button>
                            <Link href="/diet-plan"><button className="btn-primary" style={{ padding: '12px 24px' }}>🥗 Get Diet Plan</button></Link>
                            <Link href="/doctors"><button className="btn-primary" style={{ padding: '12px 24px' }}>📍 Find Doctors</button></Link>
                            <Link href="/ai-chat"><button className="btn-primary" style={{ padding: '12px 24px' }}>🤖 Ask AI</button></Link>
                        </div>
                    </motion.div>
                )}
            </section>
        </main>
    );
}
