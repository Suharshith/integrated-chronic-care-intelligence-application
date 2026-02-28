'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { getDietPlan } from '@/lib/api';

const dayColors: Record<string, string> = {
    Monday: 'var(--accent-red)', Tuesday: 'var(--accent-orange)', Wednesday: 'var(--accent-orange)',
    Thursday: 'var(--accent-green)', Friday: 'var(--accent-cyan)', Saturday: 'var(--accent-purple)', Sunday: 'var(--accent-pink)'
};

export default function DietPlanPage() {
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<any>(null);
    const [conditions, setConditions] = useState({
        heart: 'Low', kidney: 'Low', stroke: 'Low',
        diabetes: 'Low', brain: 'Low', thyroid: 'Low'
    });

    const handleGenerate = async () => {
        setLoading(true);
        const predictions: any = {};
        for (const [d, r] of Object.entries(conditions)) {
            predictions[d] = { risk_level: r, risk_percentage: r === 'High' ? 75 : r === 'Medium' ? 45 : 15 };
        }
        try {
            const res = await getDietPlan(predictions, { age: 40, sex: 'Male' });
            setPlan(res.data.diet_plan);
        } catch { setPlan(null); alert('Failed to generate diet plan'); }
        setLoading(false);
    };

    return (
        <main style={{ minHeight: '100vh', paddingTop: '40px' }}>
            <div style={{ padding: '20px 40px' }}>
                <Link href="/dashboard" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</Link>
            </div>
            <section style={{ padding: '0 40px 80px', maxWidth: '1200px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '48px' }}>🥗</span>
                        <div>
                            <h1 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 900 }} className="gradient-text">AI Diet Planner</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Personalized 7-day meal plan based on your health risks — Powered by Gemini AI</p>
                        </div>
                    </div>
                </motion.div>

                {/* Risk Input */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
                    <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Select your risk levels for personalized recommendations:</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
                        {Object.entries(conditions).map(([d, r]) => (
                            <div key={d}>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600, textTransform: 'capitalize' }}>{d}</label>
                                <select className="form-select" style={{ padding: '8px', fontSize: '12px' }} value={r} onChange={e => setConditions(p => ({ ...p, [d]: e.target.value }))}>
                                    <option>Low</option><option>Medium</option><option>High</option>
                                </select>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleGenerate} disabled={loading} className="btn-primary" style={{ marginTop: '16px', padding: '12px 32px', fontSize: '15px' }}>
                        {loading ? '🔄 Generating with Gemini AI...' : '🥗 Generate Personalized Diet Plan'}
                    </button>
                </motion.div>

                {/* Diet Plan Display */}
                {plan && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '32px' }}>
                        {/* Summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', marginBottom: '6px' }}>🍽️</div>
                                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '16px' }}>{plan.diet_type || 'Balanced'}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Diet Type</div>
                            </div>
                            <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', marginBottom: '6px' }}>🔥</div>
                                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '16px' }}>{plan.daily_calories || '1800-2200'}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Daily Calories</div>
                            </div>
                            <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', marginBottom: '6px' }}>🚫</div>
                                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '14px' }}>{(plan.avoid_foods || []).length} items</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Foods to Avoid</div>
                            </div>
                        </div>

                        {/* Avoid Foods */}
                        {plan.avoid_foods && plan.avoid_foods.length > 0 && (
                            <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
                                <h4 style={{ fontFamily: 'Outfit', fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-red)' }}>🚫 Foods to Avoid</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {plan.avoid_foods.map((f: string, i: number) => (
                                        <span key={i} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.2)' }}>{f}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Weekly Plan */}
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>📅 7-Day Meal Plan</h3>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {Object.entries(plan.weekly_plan || {}).map(([day, meals]: [string, any], i) => (
                                <motion.div key={day} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                    className="glass-card" style={{ padding: '20px', borderLeft: `4px solid ${dayColors[day] || 'var(--accent-purple)'}` }}>
                                    <h4 style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: dayColors[day] || 'var(--accent-purple)' }}>{day}</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        {typeof meals === 'object' && Object.entries(meals).map(([type, meal]) => (
                                            <div key={type} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.03)' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '4px', textTransform: 'capitalize' }}>{type}</div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{String(meal)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Tips */}
                        {plan.tips && plan.tips.length > 0 && (
                            <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
                                <h4 style={{ fontFamily: 'Outfit', fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--accent-green)' }}>💡 Nutrition Tips</h4>
                                {plan.tips.map((t: string, i: number) => (
                                    <div key={i} style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(34,197,94,0.05)', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: 1.5 }}>✅ {t}</div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </section>
        </main>
    );
}
