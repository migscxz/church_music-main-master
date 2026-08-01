import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Preloader from '../components/Preloader';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/login', { email, password });
            login(response.data.access_token, response.data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
                
                :root {
                    --sidebar-bg: #0f1117;
                    --sidebar-border: rgba(255,255,255,0.06);
                    --accent: #c9a84c;
                    --accent-muted: rgba(201,168,76,0.15);
                    --text-primary: #f0ede8;
                    --text-muted: rgba(240,237,232,0.45);
                    --text-inverse: #0f1117;
                    --text-inverse-muted: rgba(15,17,23,0.55);
                    --hover-bg: rgba(255,255,255,0.04);
                    --active-bg: rgba(201,168,76,0.12);
                    --main-bg: #f7f5f2;
                    --bg-surface: #0f1117;
                }

                .split-layout {
                    min-height: 100vh;
                    display: flex;
                    background: #050505;
                    font-family: 'DM Sans', sans-serif;
                    position: relative;
                }

                /* ── LEFT PANEL: VIDEO ── */
                .video-panel {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                    overflow: hidden;
                    background: #000;
                }
                
                .video-bg {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    object-fit: cover;
                    opacity: 0.3; /* darker on mobile so form is visible */
                }

                .video-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(5,5,5,0.7);
                    pointer-events: none;
                }

                @media (min-width: 900px) {
                    .video-panel {
                        position: relative;
                        display: block;
                        flex: 1.3;
                    }
                    .video-bg {
                        opacity: 0.9;
                    }
                    /* Subtle overlay to blend edges on desktop */
                    .video-overlay {
                        background: linear-gradient(to right, transparent, rgba(5,5,5,1));
                    }
                }

                /* ── RIGHT PANEL: FORM ── */
                .form-panel {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    background: transparent; /* transparent on mobile so video shows behind */
                    position: relative;
                    z-index: 10;
                    min-height: 100vh;
                }

                @media (min-width: 900px) {
                    .form-panel {
                        background: #050505;
                    }
                }

                .login-card {
                    width: 100%;
                    max-width: 400px;
                    z-index: 10;
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 40px;
                }

                .brand-icon-wrapper {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 24px;
                    border-radius: 50%;
                    padding: 3px;
                    background: linear-gradient(135deg, var(--accent), transparent 60%, var(--accent));
                    box-shadow: 0 0 20px var(--accent-muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: subtlePulse 4s infinite alternate ease-in-out;
                }

                @keyframes subtlePulse {
                    0% { box-shadow: 0 0 15px var(--accent-muted); }
                    100% { box-shadow: 0 0 30px rgba(201,168,76,0.3); }
                }

                .brand-icon {
                    width: 100%;
                    height: 100%;
                    background: #000;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .login-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 34px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 8px 0;
                }

                .login-subtitle {
                    font-size: 16px;
                    color: #a09d98;
                    margin: 0;
                }

                .error-banner {
                    background: #fef2f2;
                    border-left: 3px solid #dc2626;
                    color: #991b1b;
                    padding: 12px 16px;
                    font-size: 15px;
                    margin-bottom: 24px;
                    border-radius: 4px;
                }

                .form-group {
                    margin-bottom: 24px;
                }

                .form-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #8c8884;
                    margin-bottom: 10px;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                }

                .input-wrapper {
                    position: relative;
                }

                .input-icon {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #6b6865;
                    pointer-events: none;
                }

                .form-input {
                    width: 100%;
                    padding: 14px 16px 14px 46px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    font-family: inherit;
                    font-size: 16px;
                    color: #fff;
                    background: rgba(255, 255, 255, 0.02);
                    outline: none;
                    transition: all 0.2s;
                }

                .form-input:focus {
                    border-color: var(--accent);
                    background: rgba(255, 255, 255, 0.04);
                }

                .form-input::placeholder {
                    color: #555;
                }

                .btn-submit {
                    width: 100%;
                    padding: 16px;
                    background: var(--accent);
                    color: #0f1117;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }

                .btn-submit:hover:not(:disabled) {
                    background: #d4b55c;
                    transform: translateY(-1px);
                }

                .btn-submit:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }
            `}</style>

            <AnimatePresence>
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 999999 }}
                    >
                        <Preloader text="Authenticating..." fullScreen={true} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="split-layout">
                {/* ── LEFT PANEL (VIDEO) ── */}
                <div className="video-panel">
                    <video 
                        className="video-bg" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                    >
                        <source src="/worship-mobile.mp4" media="(max-width: 899px)" type="video/mp4" />
                        <source src="/worship.mp4" type="video/mp4" />
                    </video>
                    <div className="video-overlay" />
                </div>

                {/* ── RIGHT PANEL (FORM) ── */}
                <div className="form-panel">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="login-card"
                    >
                        <div className="login-header">
                            <motion.div 
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="brand-icon-wrapper"
                            >
                                <div className="brand-icon">
                                    <img src="/final_wam.png" alt="WAM" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            </motion.div>
                            <h1 className="login-title">Worship & Music</h1>
                            <p className="login-subtitle">Sign in to your account</p>
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="error-banner"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <div className="input-wrapper">
                                    <Mail size={18} className="input-icon" />
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <motion.button 
                                whileTap={{ scale: 0.98 }}
                                type="submit" 
                                className="btn-submit" 
                                disabled={isLoading}
                            >
                                <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
                                {!isLoading && <ArrowRight size={18} />}
                            </motion.button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default Login;
