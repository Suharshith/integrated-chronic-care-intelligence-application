'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '@/lib/api';

interface Message {
    role: 'user' | 'ai';
    content: string;
    timestamp: string;
}

export default function AIChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: "Hello! I'm ICCIP's AI Health Assistant 🏥\n\nI can help you understand health risks, interpret test results, suggest lifestyle changes, and answer general health questions.\n\n**How can I help you today?**", timestamp: new Date().toLocaleTimeString() }
    ]);
    const [input, setInput] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const sendMessage = async () => {
        if ((!input.trim() && !imagePreview) || loading) return;
        const userContent = imagePreview ? `[Image Attached] ${input}` : input;
        const userMsg: Message = { role: 'user', content: userContent, timestamp: new Date().toLocaleTimeString() };
        setMessages(prev => [...prev, userMsg]);

        const currentInput = input;
        const currentImage = imagePreview;

        setInput('');
        setImagePreview(null);
        setLoading(true);

        try {
            const res = await chatWithAI(currentInput || "Please analyze this image", undefined, currentImage || undefined);
            const aiMsg: Message = { role: 'ai', content: res.data.response, timestamp: new Date().toLocaleTimeString() };
            setMessages(prev => [...prev, aiMsg]);
        } catch {
            setMessages(prev => [...prev, { role: 'ai', content: '⚠️ Sorry, I could not connect to the AI service. Please try again.', timestamp: new Date().toLocaleTimeString() }]);
        }
        setLoading(false);
    };

    const quickQuestions = [
        "What does high cholesterol mean?",
        "How to reduce diabetes risk?",
        "What are early signs of kidney disease?",
        "How to maintain a healthy heart?",
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <main style={{ minHeight: '100vh', paddingTop: '40px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 40px' }}>
                <Link href="/dashboard" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</Link>
            </div>
            <section style={{ padding: '0 40px 20px', maxWidth: '900px', margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '48px' }}>🤖</span>
                        <div>
                            <h1 style={{ fontFamily: 'Outfit', fontSize: '32px', fontWeight: 900 }} className="gradient-text">AI Health Assistant</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Powered by Gemini AI — Ask any health question</p>
                        </div>
                        <div style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)', fontWeight: 700 }}>
                            ● Online
                        </div>
                    </div>
                </motion.div>

                {/* Chat Messages */}
                <div className="glass-card" style={{ flex: 1, padding: '20px', marginTop: '20px', maxHeight: '55vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {messages.map((msg, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                                maxWidth: '75%', padding: '14px 18px', borderRadius: '18px', fontSize: '14px', lineHeight: 1.6,
                                ...(msg.role === 'user'
                                    ? { background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))', color: '#fff', borderBottomRightRadius: '4px' }
                                    : { background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.03)', borderBottomLeftRadius: '4px', color: 'var(--text-primary)' })
                            }}>
                                {msg.role === 'ai' && <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '6px' }}>🤖 ICCIP AI</div>}
                                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '6px', textAlign: 'right' }}>{msg.timestamp}</div>
                            </div>
                        </motion.div>
                    ))}
                    {loading && (
                        <div style={{ display: 'flex', gap: '6px', padding: '12px 18px' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-cyan)', animation: 'pulse 1s infinite' }} />
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-purple)', animation: 'pulse 1s infinite 0.2s' }} />
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-cyan)', animation: 'pulse 1s infinite 0.4s' }} />
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Quick Questions */}
                {messages.length <= 1 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                        {quickQuestions.map(q => (
                            <button key={q} onClick={() => { setInput(q); }} style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '12px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseOver={e => { (e.target as HTMLElement).style.borderColor = 'var(--accent-cyan)'; (e.target as HTMLElement).style.color = 'var(--accent-cyan)'; }}
                                onMouseOut={e => { (e.target as HTMLElement).style.borderColor = 'var(--glass-border)'; (e.target as HTMLElement).style.color = 'var(--text-secondary)'; }}>
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                {imagePreview && (
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '10px' }}>
                        <img src={imagePreview} alt="Upload preview" style={{ height: '80px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                        <button onClick={() => setImagePreview(null)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--accent-red)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '12px', marginTop: imagePreview ? '0' : '16px', marginBottom: '20px' }}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                    <button onClick={() => fileInputRef.current?.click()} style={{ padding: '0 16px', borderRadius: '25px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.03)', cursor: 'pointer', fontSize: '18px' }} title="Attach Prescription or Image">
                        📎
                    </button>
                    <input
                        className="form-input"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask me anything or upload a prescription..."
                        style={{ flex: 1, padding: '14px 20px', fontSize: '15px', borderRadius: '25px' }}
                        disabled={loading}
                    />
                    <button onClick={sendMessage} disabled={loading || (!input.trim() && !imagePreview)} className="btn-primary"
                        style={{ padding: '14px 28px', borderRadius: '25px', fontSize: '15px', whiteSpace: 'nowrap' }}>
                        {loading ? '⏳' : '🚀 Send'}
                    </button>
                </div>
            </section>
        </main>
    );
}
