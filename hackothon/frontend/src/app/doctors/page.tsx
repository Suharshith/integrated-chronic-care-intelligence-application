'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { searchDoctors } from '@/lib/api';

const specialties = [
    { label: '🫀 Cardiologist (Heart)', value: 'heart' },
    { label: '🫘 Nephrologist (Kidney)', value: 'kidney' },
    { label: '🧠 Neurologist (Stroke)', value: 'stroke' },
    { label: '🩸 Endocrinologist (Diabetes)', value: 'diabetes' },
    { label: '🧠 Neurosurgeon (Brain Tumor)', value: 'brain' },
    { label: '🦋 Endocrinologist (Thyroid)', value: 'thyroid' },
];

export default function DoctorsPage() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [condition, setCondition] = useState('heart');
    const [location, setLocation] = useState({ lat: '', lng: '' });
    const [geoError, setGeoError] = useState('');

    const detectLocation = () => {
        if (!navigator.geolocation) { setGeoError('Geolocation not supported'); return; }
        navigator.geolocation.getCurrentPosition(
            pos => { setLocation({ lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() }); setGeoError(''); },
            () => setGeoError('Location access denied. Enter manually.')
        );
    };

    const handleSearch = async () => {
        if (!location.lat || !location.lng) { setGeoError('Please provide location'); return; }
        setLoading(true);
        try {
            const res = await searchDoctors(parseFloat(location.lat), parseFloat(location.lng), condition);
            setResults(res.data);
        } catch { setResults({ error: 'Failed to search. Check API key.' }); }
        setLoading(false);
    };

    return (
        <main style={{ minHeight: '100vh', paddingTop: '40px' }}>
            <div style={{ padding: '20px 40px' }}>
                <Link href="/dashboard" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</Link>
            </div>
            <section style={{ padding: '0 40px 80px', maxWidth: '1100px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '48px' }}>📍</span>
                        <div>
                            <h1 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 900 }} className="gradient-text">Find Nearby Doctors</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Google Maps-powered specialist search based on your health needs</p>
                        </div>
                    </div>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px', marginTop: '32px' }}>
                    {/* Search Form */}
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>🔍 Search Settings</h3>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Specialist Type</label>
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {specialties.map(s => (
                                    <button key={s.value} onClick={() => setCondition(s.value)}
                                        style={{
                                            padding: '12px 16px', borderRadius: '12px', fontSize: '14px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid',
                                            ...(condition === s.value
                                                ? { background: 'rgba(168,85,247,0.15)', borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)', fontWeight: 600 }
                                                : { background: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.03)', color: 'var(--text-secondary)' })
                                        }}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Location</label>
                            <button onClick={detectLocation} className="btn-outline" style={{ width: '100%', padding: '10px', fontSize: '13px', marginBottom: '10px' }}>
                                📍 Auto-detect my location
                            </button>
                            {geoError && <p style={{ color: 'var(--accent-orange)', fontSize: '12px', marginBottom: '8px' }}>{geoError}</p>}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input className="form-input" placeholder="Latitude" value={location.lat} onChange={e => setLocation(p => ({ ...p, lat: e.target.value }))} />
                                <input className="form-input" placeholder="Longitude" value={location.lng} onChange={e => setLocation(p => ({ ...p, lng: e.target.value }))} />
                            </div>
                        </div>

                        <button onClick={handleSearch} disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
                            {loading ? '🔄 Searching...' : '🔍 Find Doctors'}
                        </button>
                    </motion.div>

                    {/* Results */}
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                        {!results ? (
                            <div className="glass-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
                                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏥</div>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Ready to Search</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Select condition and location to find nearby specialists</p>
                            </div>
                        ) : results.error ? (
                            <div className="glass-card" style={{ padding: '32px' }}><p style={{ color: 'var(--accent-red)' }}>⚠ {results.error}</p></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ fontFamily: 'Outfit', fontSize: '18px', fontWeight: 700 }}>{results.icon} {results.specialty}</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{results.total_found} specialists found nearby</p>
                                    </div>
                                    {results.search_url && (
                                        <a href={results.search_url} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ padding: '8px 16px', fontSize: '12px', textDecoration: 'none' }}>
                                            Open in Maps ↗
                                        </a>
                                    )}
                                </div>
                                {(results.doctors || []).map((doc: any, i: number) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                        className="glass-card" style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h4 style={{ fontFamily: 'Outfit', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{doc.name}</h4>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>{doc.address}</p>
                                                <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                                                    <span style={{ color: 'var(--accent-orange)' }}>⭐ {doc.rating}</span>
                                                    <span style={{ color: 'var(--text-secondary)' }}>({doc.total_ratings} reviews)</span>
                                                    {doc.is_open !== null && (
                                                        <span style={{ color: doc.is_open ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                                            {doc.is_open ? '● Open Now' : '● Closed'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {doc.maps_url && (
                                                <a href={doc.maps_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', fontSize: '12px', textDecoration: 'none' }}>
                                                    Directions ↗
                                                </a>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
