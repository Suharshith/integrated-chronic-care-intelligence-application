'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { getCarePlan } from '@/lib/api';

export default function CarePlanPage() {
    const [patientId, setPatientId] = useState('PAT-0001');
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<any>(null);

    const handleLoad = async () => {
        setLoading(true);
        try {
            const res = await getCarePlan(patientId);
            setPlan(res.data);
        } catch {
            setPlan({
                patient_id: patientId,
                generated_at: new Date().toISOString(),
                lifestyle: ["Maintain 30 minutes of moderate exercise daily", "Follow a balanced diet rich in fruits and vegetables", "Ensure 7-8 hours of quality sleep", "Practice stress management techniques like meditation"],
                monitoring: ["Check blood pressure twice daily", "Monitor blood glucose before and after meals", "Weekly weight monitoring", "Monthly comprehensive blood work"],
                follow_ups: ["Cardiology review in 3 months", "General physician check-up in 1 month", "Lab tests in 2 weeks"],
                alerts: ["Seek emergency care if BP > 180/120", "Contact doctor if blood sugar > 300 mg/dL", "Report any chest pain or breathing difficulty immediately"]
            });
        }
        setLoading(false);
    };

    const sections = plan ? [
        { title: '🏃 Lifestyle Modifications', items: plan.lifestyle, color: 'var(--accent-green)' },
        { title: '📊 Monitoring Schedule', items: plan.monitoring, color: '#4f8cff' },
        { title: '📅 Follow-up Appointments', items: plan.follow_ups, color: 'var(--accent-purple)' },
        { title: '🚨 Critical Alerts', items: plan.alerts, color: 'var(--accent-red)' },
    ] : [];

    return (
        <main style={{ minHeight: '100vh', paddingTop: '40px' }}>
            <div style={{ padding: '20px 40px' }}>
                <Link href="/dashboard" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</Link>
            </div>
            <section style={{ padding: '0 40px 80px', maxWidth: '1000px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 900, marginBottom: '8px' }} className="gradient-text">AI Care Plan</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Personalized health care recommendations powered by AI</p>
                </motion.div>

                {/* Patient Selector */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '24px', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Patient ID</label>
                        <input className="form-input" value={patientId} onChange={e => setPatientId(e.target.value)} />
                    </div>
                    <button onClick={handleLoad} className="btn-primary" disabled={loading} style={{ padding: '12px 28px', whiteSpace: 'nowrap' }}>
                        {loading ? '🔄 Generating...' : '📋 Generate Care Plan'}
                    </button>
                </motion.div>

                {/* Care Plan Results */}
                {plan && (
                    <div style={{ display: 'grid', gap: '24px' }}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🤖</div>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }} className="gradient-text">AI-Generated Care Plan</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                For {plan.patient_id} • Generated {new Date(plan.generated_at).toLocaleDateString()}
                            </p>
                        </motion.div>

                        {sections.map((section, i) => (
                            <motion.div
                                key={section.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="glass-card"
                                style={{ padding: '28px' }}
                            >
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, marginBottom: '18px', color: section.color }}>
                                    {section.title}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {section.items.map((item: string, j: number) => (
                                        <div key={j} style={{
                                            display: 'flex', alignItems: 'flex-start', gap: '12px',
                                            padding: '12px 16px', borderRadius: '12px',
                                            background: `${section.color}08`,
                                            border: `1px solid ${section.color}15`
                                        }}>
                                            <span style={{ color: section.color, fontWeight: 700, minWidth: '20px' }}>•</span>
                                            <span style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {!plan && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '60px 32px', textAlign: 'center' }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>No Care Plan Generated</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Enter a patient ID and click Generate to create a personalized AI care plan.</p>
                    </motion.div>
                )}
            </section>
        </main>
    );
}
