'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { predictBrain } from '@/lib/api';

const ALL_MODELS = [
    "DenseNet-121",
    "ResNet-18",
    "VGG-16",
    "MobileNetV2",
    "EfficientNet-B0",
    "XGBoost",
    "Random Forest",
    "SVM",
];

export default function BrainTumorPrediction() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [model, setModel] = useState("DenseNet-121");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((f: File | null) => {
        setFile(f);
        setResult(null);
        setError(null);
        if (f) {
            const url = URL.createObjectURL(f);
            setPreview(url);
        } else {
            setPreview(null);
        }
    }, []);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!file) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await predictBrain(file, model);
            setResult(res.data);
        } catch (e: any) {
            setError(e.response?.data?.error || e.message || "Failed to connect to the prediction server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{ minHeight: '100vh', paddingTop: '40px' }}>
            <div style={{ padding: '20px 40px' }}>
                <Link href="/predict" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '14px' }}>
                    ← Back
                </Link>
            </div>

            <section style={{ padding: '0 40px 80px', maxWidth: '1100px', margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '48px' }}>🧠</span>
                        <h1 style={{ fontFamily: 'Outfit', fontSize: '36px', fontWeight: 900 }} className="gradient-text">
                            Brain Tumor Detection
                        </h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                        Deep Learning & Hybrid ML models — Choose an architecture to analyze MRI scans
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Model Selector */}
                        <div className="glass-card" style={{ padding: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>
                                SELECT AI ARCHITECTURE
                            </label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {ALL_MODELS.map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setModel(m)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            background: model === m ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                                            color: model === m ? 'black' : 'var(--text-primary)',
                                            border: '1px solid ' + (model === m ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'),
                                        }}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Upload Zone */}
                        <motion.div
                            className={`glass-card ${dragOver ? 'drag-over' : ''}`}
                            style={{
                                padding: '40px',
                                textAlign: 'center',
                                border: `2px dashed ${dragOver ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOver(false);
                                if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                            }}
                            onClick={() => inputRef.current?.click()}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                            />
                            {preview ? (
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', textAlign: 'left' }}>
                                    <img src={preview} alt="MRI Preview" style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover' }} />
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{file?.name}</p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Click or drag to replace image</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Upload MRI Scan</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Drag & drop or click to browse (JPG, PNG)</p>
                                </>
                            )}
                        </motion.div>

                        <button
                            className="btn-primary"
                            disabled={!file || loading}
                            onClick={handleSubmit}
                            style={{ padding: '16px', fontSize: '16px', width: '100%' }}
                        >
                            {loading ? '🔄 Analyzing MRI...' : '🔬 Run AI Classification'}
                        </button>

                        {error && (
                            <div className="glass-card" style={{ padding: '16px', border: '1px solid var(--accent-red)' }}>
                                <p style={{ color: 'var(--accent-red)', fontSize: '14px' }}>⚠ {error}</p>
                            </div>
                        )}
                    </div>

                    <div style={{ minHeight: '400px' }}>
                        {!result ? (
                            <div className="glass-card" style={{ padding: '48px 32px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '64px', marginBottom: '24px' }}>🧠</div>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Ready for Analysis</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Upload a brain MRI scan and select a model to see the prediction results.</p>
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Prediction Result</h3>
                                    <div style={{ fontSize: '42px', fontFamily: 'Outfit', fontWeight: 900, color: result.prediction ? 'var(--accent-red)' : 'var(--accent-green)', marginBottom: '8px', textTransform: 'capitalize' }}>
                                        {result.predicted_class}
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                                        Confidence: {(result.confidence * 100).toFixed(2)}%
                                    </div>
                                    <div style={{ display: 'inline-block', padding: '6px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 700, ...(result.prediction ? { background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' } : { background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)' }) }}>
                                        {result.prediction ? 'TUMOR DETECTED' : 'NO TUMOR FOUND'}
                                    </div>
                                </div>

                                {result.probabilities && (
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Probabilities</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {Object.entries(result.probabilities).map(([cls, prob]: [string, any]) => (
                                                <div key={cls}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{cls}</span>
                                                        <span>{(prob * 100).toFixed(1)}%</span>
                                                    </div>
                                                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${prob * 100}%` }}
                                                            style={{ height: '100%', background: cls === result.predicted_class ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.2)' }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {result.recommendations && (
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h4 style={{ fontFamily: 'Outfit', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>💡 AI insights</h4>
                                        {result.recommendations.map((r: string, i: number) => (
                                            <div key={i} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.03)', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                {r}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
