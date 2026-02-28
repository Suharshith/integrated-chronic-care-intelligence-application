'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminPage() {
    const { user, token, logout, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [tab, setTab] = useState<'overview' | 'users' | 'predictions'>('overview');
    const [allPreds, setAllPreds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    useEffect(() => {
        if (authLoading) return;
        if (!user || !isAdmin) { router.push('/login'); return; }
        fetchData();
    }, [user, isAdmin, authLoading]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, predsRes] = await Promise.all([
                axios.get(`${API}/api/admin/stats`, { headers }),
                axios.get(`${API}/api/admin/users`, { headers }),
                axios.get(`${API}/api/admin/predictions`, { headers }),
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data.users || []);
            setAllPreds(predsRes.data.predictions || []);
        } catch (err) {
            console.error('Admin fetch error:', err);
        }
        setLoading(false);
    };

    const viewUserDetail = async (userId: string) => {
        try {
            const res = await axios.get(`${API}/api/admin/users/${userId}`, { headers });
            setSelectedUser(res.data);
        } catch (err) { console.error(err); }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`${API}/api/admin/users/${userId}`, { headers });
            setUsers(prev => prev.filter(u => u.id !== userId));
            setSelectedUser(null);
        } catch (err: any) { alert(err.response?.data?.detail || 'Delete failed'); }
    };

    const getRiskColor = (level: string) => level === 'High' ? 'var(--accent-red)' : level === 'Medium' ? 'var(--accent-orange)' : 'var(--accent-green)';

    if (authLoading || loading) {
        return <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <p style={{ color: 'var(--text-secondary)' }}>Loading admin panel...</p>
            </div>
        </main>;
    }

    return (
        <main style={{ minHeight: '100vh', paddingTop: '20px' }}>
            <section style={{ padding: '20px 40px', maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 900 }} className="gradient-text">🛡️ Admin Dashboard</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Logged in as <strong style={{ color: 'var(--accent-purple)' }}>{user?.name}</strong> ({user?.email})</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Link href="/dashboard"><button className="btn-outline" style={{ padding: '10px 20px', fontSize: '13px' }}>📊 User Dashboard</button></Link>
                        <button onClick={() => { logout(); router.push('/login'); }} className="btn-outline" style={{ padding: '10px 20px', fontSize: '13px', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--accent-red)' }}>🚪 Logout</button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
                    {[
                        { key: 'overview', label: '📊 Overview', color: 'var(--accent-purple)' },
                        { key: 'users', label: '👥 Users', color: 'var(--accent-cyan)' },
                        { key: 'predictions', label: '🧬 Predictions', color: 'var(--accent-green)' },
                    ].map(t => (
                        <button key={t.key} onClick={() => { setTab(t.key as any); setSelectedUser(null); }}
                            style={{
                                padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                                cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                                background: tab === t.key ? `${t.color}15` : 'rgba(0,0,0,0.03)',
                                color: tab === t.key ? t.color : 'var(--text-secondary)',
                                borderBottom: tab === t.key ? `3px solid ${t.color}` : '3px solid transparent'
                            }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW TAB */}
                {tab === 'overview' && stats && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                            {[
                                { label: 'Total Users', value: stats.total_users, icon: '👥', color: 'var(--accent-cyan)' },
                                { label: 'Admins', value: stats.total_admins, icon: '🛡️', color: 'var(--accent-purple)' },
                                { label: 'Predictions', value: stats.total_predictions, icon: '🧬', color: 'var(--accent-green)' },
                                { label: 'Vitals Logged', value: stats.total_vitals, icon: '💓', color: 'var(--accent-orange)' },
                            ].map(s => (
                                <div key={s.label} className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{s.icon}</div>
                                    <div style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 900, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Disease Breakdown */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>📊 Predictions by Disease</h3>
                                {Object.entries(stats.disease_counts || {}).map(([d, c]: any) => (
                                    <div key={d} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                                        <span style={{ textTransform: 'capitalize', fontSize: '14px' }}>{d}</span>
                                        <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{c}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>🎯 Risk Distribution</h3>
                                {Object.entries(stats.risk_distribution || {}).map(([level, c]: any) => (
                                    <div key={level} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                                        <span style={{ color: getRiskColor(level), fontWeight: 600, fontSize: '14px' }}>{level} Risk</span>
                                        <span style={{ fontWeight: 700 }}>{c}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Users */}
                        <div className="glass-card" style={{ padding: '24px', marginTop: '20px' }}>
                            <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>🆕 Recent Users</h3>
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {(stats.recent_users || []).map((u: any) => (
                                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.03)' }}>
                                        <div><strong style={{ fontSize: '14px' }}>{u.name}</strong> <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>({u.email})</span></div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{u.created_at?.split('T')[0]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* USERS TAB */}
                {tab === 'users' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? '1fr 1.2fr' : '1fr', gap: '20px' }}>
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>👥 All Users ({users.length})</h3>
                                <div style={{ display: 'grid', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
                                    {users.map(u => (
                                        <div key={u.id} onClick={() => viewUserDetail(u.id)}
                                            style={{
                                                padding: '14px 16px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                                                background: selectedUser?.user?.id === u.id ? 'rgba(168,85,247,0.1)' : 'rgba(0,0,0,0.03)',
                                                border: selectedUser?.user?.id === u.id ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(0,0,0,0.03)'
                                            }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{u.name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span style={{
                                                        padding: '3px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                                                        background: u.role === 'admin' ? 'rgba(168,85,247,0.1)' : 'rgba(6,182,212,0.1)',
                                                        color: u.role === 'admin' ? 'var(--accent-purple)' : 'var(--accent-cyan)'
                                                    }}>{u.role.toUpperCase()}</span>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>📞 {u.phone || 'N/A'} · Joined {u.created_at?.split('T')[0]}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* User Detail */}
                            {selectedUser && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <div>
                                            <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 700 }}>{selectedUser.user.name}</h3>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{selectedUser.user.email} · {selectedUser.user.role}</p>
                                        </div>
                                        {selectedUser.user.role !== 'admin' && (
                                            <button onClick={() => deleteUser(selectedUser.user.id)} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--accent-red)', cursor: 'pointer' }}>
                                                🗑️ Delete
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(0,0,0,0.03)', marginBottom: '16px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                                            <div><span style={{ color: 'var(--text-secondary)' }}>ID:</span> {selectedUser.user.id}</div>
                                            <div><span style={{ color: 'var(--text-secondary)' }}>Phone:</span> {selectedUser.user.phone || 'N/A'}</div>
                                            <div><span style={{ color: 'var(--text-secondary)' }}>Joined:</span> {selectedUser.user.created_at?.split('T')[0]}</div>
                                            <div><span style={{ color: 'var(--text-secondary)' }}>Predictions:</span> <strong style={{ color: 'var(--accent-cyan)' }}>{selectedUser.total_predictions}</strong></div>
                                        </div>
                                    </div>

                                    <h4 style={{ fontFamily: 'Outfit', fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>🧬 Prediction History</h4>
                                    {selectedUser.predictions.length === 0 ? (
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No predictions yet.</p>
                                    ) : (
                                        <div style={{ display: 'grid', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                                            {selectedUser.predictions.map((p: any, i: number) => (
                                                <div key={i} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', borderLeft: `3px solid ${getRiskColor(p.result?.risk_level || 'Low')}` }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                        <strong style={{ textTransform: 'capitalize' }}>{p.disease}</strong>
                                                        <span style={{ color: getRiskColor(p.result?.risk_level || 'Low'), fontWeight: 700 }}>
                                                            {p.result?.risk_percentage || 0}% ({p.result?.risk_level || 'N/A'})
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{p.timestamp?.replace('T', ' ').split('.')[0]}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* PREDICTIONS TAB */}
                {tab === 'predictions' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>🧬 All Predictions ({allPreds.length})</h3>
                            <div style={{ display: 'grid', gap: '8px', maxHeight: '700px', overflowY: 'auto' }}>
                                {allPreds.slice().reverse().map((p, i) => (
                                    <div key={i} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(0,0,0,0.03)', borderLeft: `3px solid ${getRiskColor(p.result?.risk_level || 'Low')}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <strong style={{ textTransform: 'capitalize', fontSize: '14px' }}>{p.disease}</strong>
                                                {p.user_id && <span style={{ fontSize: '11px', color: 'var(--accent-purple)', marginLeft: '8px' }}>{p.user_id}</span>}
                                            </div>
                                            <span style={{ color: getRiskColor(p.result?.risk_level || 'Low'), fontWeight: 700, fontSize: '14px' }}>
                                                {p.result?.risk_percentage || 0}% — {p.result?.risk_level || 'N/A'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{p.timestamp?.replace('T', ' ').split('.')[0]}</div>
                                    </div>
                                ))}
                                {allPreds.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No predictions recorded yet.</p>}
                            </div>
                        </div>
                    </motion.div>
                )}
            </section>
        </main>
    );
}
