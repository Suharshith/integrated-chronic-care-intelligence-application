'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function LoginPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (mode === 'login') {
            const res = await login(form.email, form.password);
            if (res.success) {
                // Check role from localStorage
                const savedUser = localStorage.getItem('iccip_user');
                if (savedUser) {
                    const u = JSON.parse(savedUser);
                    router.push(u.role === 'admin' ? '/admin' : '/dashboard');
                } else {
                    router.push('/dashboard');
                }
            } else {
                setError(res.error || 'Login failed');
            }
        } else {
            if (!form.name.trim()) { setError('Name is required'); setLoading(false); return; }
            if (form.password.length < 4) { setError('Password must be at least 4 characters'); setLoading(false); return; }
            const res = await register(form.name, form.email, form.password, form.phone);
            if (res.success) {
                router.push('/dashboard');
            } else {
                setError(res.error || 'Registration failed');
            }
        }
        setLoading(false);
    };

    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '460px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <span style={{ fontSize: '44px' }}>🏥</span>
                        <h1 style={{ fontFamily: 'Outfit', fontSize: '32px', fontWeight: 900, marginTop: '12px' }} className="gradient-text">ICCIP</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Integrated Chronic Care Intelligence Platform</p>
                    </Link>
                </div>

                {/* Card */}
                <div className="glass-card" style={{ padding: '36px', border: '1px solid rgba(168,85,247,0.15)' }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', marginBottom: '28px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.03)' }}>
                        {(['login', 'register'] as const).map(m => (
                            <button key={m} onClick={() => { setMode(m); setError(''); }}
                                style={{
                                    flex: 1, padding: '12px', fontSize: '14px', fontWeight: 700,
                                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                    textTransform: 'capitalize',
                                    background: mode === m ? 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))' : 'transparent',
                                    color: mode === m ? '#fff' : 'var(--text-secondary)'
                                }}>
                                {m === 'login' ? '🔑 Sign In' : '📝 Create Account'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {mode === 'register' && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Full Name</label>
                                <input className="form-input" placeholder="John Doe" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    style={{ width: '100%', padding: '12px 16px', fontSize: '14px' }} required />
                            </div>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Email Address</label>
                            <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                style={{ width: '100%', padding: '12px 16px', fontSize: '14px' }} required />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Password</label>
                            <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                style={{ width: '100%', padding: '12px 16px', fontSize: '14px' }} required />
                        </div>

                        {mode === 'register' && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Phone (optional)</label>
                                <input className="form-input" placeholder="+91 9876543210" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                    style={{ width: '100%', padding: '12px 16px', fontSize: '14px' }} />
                            </div>
                        )}

                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--accent-red)', fontSize: '13px', marginBottom: '16px' }}>
                                ⚠️ {error}
                            </motion.div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px', marginTop: '8px' }}>
                            {loading ? '⏳ Please wait...' : mode === 'login' ? '🔑 Sign In' : '🚀 Create Account'}
                        </button>
                    </form>

                    {mode === 'login' && (
                        <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.1)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--accent-purple)' }}>Admin Login:</strong> admin@iccip.com / admin123
                        </div>
                    )}
                </div>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Link href="/" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>← Back to Home</Link>
                </p>
            </motion.div>
        </main>
    );
}
