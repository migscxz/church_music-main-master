import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Music, Lock, Mail } from 'lucide-react';

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
                    background: #f7f4f0;
                    padding: 20px;
                    font-family: 'DM Sans', sans-serif;
                }

                .login-card {
                    background: #fff;
                    width: 100%;
                    max-width: 420px;
                    border-radius: 20px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.06);
                    overflow: hidden;
                    border: 1px solid #ede9e4;
                }

                .login-header {
                    background: #0f1117;
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
                    background: rgba(201,168,76,0.15);
                    border: 1px solid #c9a84c;
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
                    border: 1.5px solid #e8e4df;
                    border-radius: 10px;
                    font-family: inherit;
                    font-size: 15px;
                    color: #1a1814;
                    background: #fff;
                    outline: none;
                    transition: all 0.2s;
                }

                .form-input:focus {
                    border-color: #c9a84c;
                    box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
                }

                .btn-submit {
                    width: 100%;
                    padding: 14px;
                    background: #c9a84c;
                    color: #0f1117;
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

                .demo-credentials {
                    margin-top: 24px;
                    padding-top: 24px;
                    border-top: 1px solid #f0ece8;
                    font-size: 12.5px;
                    color: #8a8680;
                    text-align: center;
                }

                .demo-credentials p { margin: 4px 0; }
                .demo-credentials strong { color: #5a5550; }
            `}</style>

            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="brand-icon">
                            <Music size={32} color="#c9a84c" />
                        </div>
                        <h1 className="login-title">Sanctuary Music</h1>
                        <p className="login-subtitle">Sign in to manage the catalog</p>
                    </div>

                    <div className="login-body">
                        {error && <div className="error-banner">{error}</div>}

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

                            <button type="submit" className="btn-submit" disabled={isLoading}>
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>


                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
