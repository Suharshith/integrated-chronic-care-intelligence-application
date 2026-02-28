'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HistoryPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const [predictions, setPredictions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (authLoading) return;
        if (!user || !token) { router.push('/login'); return; }
        fetchHistory();
    }, [user, token, authLoading]);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API}/api/user/history`, { headers: { Authorization: `Bearer ${token}` } });
            setPredictions(res.data.predictions || []);
        } catch { }
        setLoading(false);
    };

    const filtered = filter === 'all' ? predictions : predictions.filter(p => p.disease === filter);
    const diseases = [...new Set(predictions.map(p => p.disease))];
    const getRiskColor = (level: string) => level === 'High' ? 'var(--accent-red)' : level === 'Medium' ? 'var(--accent-orange)' : 'var(--accent-green)';
    const getDiseaseEmoji = (d: string) => ({ heart: '🫀', kidney: '🫘', stroke: '🧠', diabetes: '🩸', brain: '🧠', thyroid: '🦋' }[d] || '🧬');

    if (authLoading || loading) {
        return <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading history...</p>
        </main>;
    }

    return (
        <main style={{ minHeight: '100vh', paddingTop: '40px' }}>
            <section style={{ padding: '20px 40px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <Link href="/dashboard" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '13px' }}>← Back to Dashboard</Link>
                        <h1 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 900, marginTop: '8px' }} className="gradient-text">
                            📋 My Prediction History
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Welcome, <strong style={{ color: 'var(--accent-purple)' }}>{user?.name}</strong> — {predictions.length} total predictions
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                    {[
                        { label: 'Total Predictions', value: predictions.length, color: 'var(--accent-purple)' },
                        { label: 'High Risk', value: predictions.filter(p => p.result?.risk_level === 'High').length, color: 'var(--accent-red)' },
                        { label: 'Medium Risk', value: predictions.filter(p => p.result?.risk_level === 'Medium').length, color: 'var(--accent-orange)' },
                        { label: 'Low Risk', value: predictions.filter(p => p.result?.risk_level === 'Low').length, color: 'var(--accent-green)' },
                    ].map(s => (
                        <div key={s.label} className="glass-card" style={{ padding: '18px', textAlign: 'center' }}>
                            <div style={{ fontFamily: 'Outfit', fontSize: '30px', fontWeight: 900, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <button onClick={() => setFilter('all')}
                        style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', background: filter === 'all' ? 'rgba(168,85,247,0.15)' : 'rgba(0,0,0,0.03)', color: filter === 'all' ? 'var(--accent-purple)' : 'var(--text-secondary)' }}>
                        All ({predictions.length})
                    </button>
                    {diseases.map(d => (
                        <button key={d} onClick={() => setFilter(d)}
                            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', textTransform: 'capitalize', background: filter === d ? 'rgba(6,182,212,0.15)' : 'rgba(0,0,0,0.03)', color: filter === d ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                            {getDiseaseEmoji(d)} {d} ({predictions.filter(p => p.disease === d).length})
                        </button>
                    ))}
                </div>

                {/* Predictions List */}
                {filtered.length === 0 ? (
                    <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No predictions yet</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>Run your first prediction to see results here!</p>
                        <Link href="/predict"><button className="btn-primary" style={{ padding: '12px 24px' }}>🧬 Start Prediction</button></Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {filtered.slice().reverse().map((p, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                className="glass-card" style={{ padding: '20px', borderLeft: `4px solid ${getRiskColor(p.result?.risk_level || 'Low')}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <span style={{ fontSize: '32px' }}>{getDiseaseEmoji(p.disease)}</span>
                                        <div>
                                            <h4 style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 700, textTransform: 'capitalize' }}>
                                                {p.disease === 'comprehensive' ? 'Comprehensive Assessment' : `${p.disease} Disease`}
                                            </h4>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {p.timestamp?.replace('T', ' ').split('.')[0]} · {p.disease === 'comprehensive' ? '6 Models Ensembled' : `Model: ${p.result?.model_used || 'ML Model'}`}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontFamily: 'Outfit', fontSize: '28px', fontWeight: 900, color: getRiskColor(p.result?.risk_level || p.result?.highest_risk_condition ? 'High' : 'Low') }}>
                                            {p.result?.risk_percentage || p.result?.overall_risk_percentage || 0}%
                                        </div>
                                        <span style={{ padding: '3px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, background: `${getRiskColor(p.result?.risk_level || p.result?.highest_risk_condition ? 'High' : 'Low')}15`, color: getRiskColor(p.result?.risk_level || p.result?.highest_risk_condition ? 'High' : 'Low') }}>
                                            {p.result?.risk_level || (p.disease === 'comprehensive' ? 'Average Risk' : 'N/A')}
                                        </span>
                                    </div>
                                </div>

                                {p.disease !== 'comprehensive' && p.result?.recommendations && p.result.recommendations.length > 0 && (
                                    <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        <strong style={{ color: 'var(--text-primary)' }}>Recommendations:</strong>
                                        <ul style={{ margin: '4px 0 0 16px', lineHeight: 1.8 }}>
                                            {p.result.recommendations.slice(0, 3).map((r: string, j: number) => <li key={j}>{r}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {p.disease === 'comprehensive' && (
                                    <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        <strong style={{ color: 'var(--text-primary)' }}>Highest Risk:</strong> <span style={{ textTransform: 'capitalize', color: 'var(--accent-purple)', fontWeight: 600 }}>{p.result?.highest_risk_condition}</span>
                                        <div style={{ marginTop: '6px' }}>{p.result?.ai_explanation?.slice(0, 150)}...</div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
