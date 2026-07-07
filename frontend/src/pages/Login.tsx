import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Music, Lock, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Prism from '../components/ReactBits/Prism/Prism';
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
                
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #050505;
                    padding: 20px;
                    font-family: 'DM Sans', sans-serif;
                    position: relative;
                    overflow: hidden;
                }

                .login-container::before {
                    content: '';
                    position: absolute;
                    width: 140%;
                    height: 140%;
                    background: radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 60%);
                    top: -20%;
                    left: -20%;
                    pointer-events: none;
                }

                .login-card {
                    background: rgba(15, 17, 23, 0.96);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    width: 100%;
                    max-width: 420px;
                    border-radius: 24px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    overflow: hidden;
                    border: 1px solid var(--sidebar-border);
                    position: relative;
                    z-index: 10;
                }

                .login-header {
                    background: var(--bg-surface);
                    padding: 40px 32px 30px;
                    text-align: center;
                    position: relative;
                }

                .login-header::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent);
                }

                .brand-icon {
                    width: 64px;
                    height: 64px;
                    background: var(--accent-muted);
                    border: 1px solid var(--accent);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                }

                .login-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 28px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 6px 0;
                }

                .login-subtitle {
                    font-size: 14px;
                    color: #a09d98;
                    margin: 0;
                }

                .login-body {
                    padding: 32px;
                    background: rgba(255, 255, 255, 0.02);
                }

                .error-banner {
                    background: #fef2f2;
                    border-left: 3px solid #dc2626;
                    color: #991b1b;
                    padding: 12px 16px;
                    font-size: 13.5px;
                    margin-bottom: 24px;
                    border-radius: 4px;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-label {
                    display: block;
                    font-size: 12.5px;
                    font-weight: 600;
                    color: #5a5550;
                    margin-bottom: 8px;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                }

                .input-wrapper {
                    position: relative;
                }

                .input-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #b0aba5;
                    pointer-events: none;
                }

                .form-input {
                    width: 100%;
                    padding: 12px 14px 12px 42px;
                    border: 1.5px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    font-family: inherit;
                    font-size: 15px;
                    color: #fff;
                    background: rgba(255, 255, 255, 0.03);
                    outline: none;
                    transition: all 0.2s;
                }

                .form-input:focus {
                    border-color: var(--accent);
                    box-shadow: 0 0 0 3px var(--active-bg);
                }

                .btn-submit {
                    width: 100%;
                    padding: 14px;
                    background: var(--accent);
                    color: var(--text-primary);
                    border: none;
                    border-radius: 10px;
                    font-size: 15px;
                    font-weight: 600;
                    font-family: inherit;
                    cursor: pointer;
                    transition: background 0.2s;
                    margin-top: 10px;
                }

                .btn-submit:hover:not(:disabled) {
                    background: #b59540;
                }

                .btn-submit:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
            `}</style>

            <div className="login-container">
                <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.7 }}>
                    <Prism
                        animationType="3drotate"
                        timeScale={0.2}
                        height={4}
                        baseWidth={6}
                        scale={4}
                        hueShift={0}
                        colorFrequency={0.8}
                        noise={0.1}
                        glow={0.5}
                    />
                </div>

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

                <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="login-card"
                >
                    <div className="login-header">
                        <motion.div 
                            animate={{ 
                                y: [0, -5, 0],
                            }}
                            transition={{ 
                                duration: 3, 
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="brand-icon"
                        >
                            <Music size={32} color="var(--accent)" />
                        </motion.div>
                        <h1 className="login-title">Worship & Music</h1>
                        <p className="login-subtitle">Sign in to manage the catalog</p>
                    </div>

                    <div className="login-body">
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
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <motion.button 
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                type="submit" 
                                className="btn-submit" 
                                disabled={isLoading}
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </motion.button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default Login;
