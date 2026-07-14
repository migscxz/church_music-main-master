import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, RefreshCw, Music } from 'lucide-react';
import { usePitchDetector } from '../utils/pitchDetector';
import { KeyEstimator, type KeyEstimate } from '../utils/keyEstimator';

const PitchDetector = () => {
    const { isListening, currentNote, error, startListening, stopListening } = usePitchDetector();
    const [, setHistogram] = useState<Record<string, number>>({});
    const [topEstimates, setTopEstimates] = useState<KeyEstimate[]>([]);

    const handleNoteDetected = (note: string) => {
        setHistogram(prev => {
            const newHist = { ...prev };
            newHist[note] = (newHist[note] || 0) + 1;
            setTopEstimates(KeyEstimator.estimateKeys(newHist));
            return newHist;
        });
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening(handleNoteDetected);
        }
    };

    const resetData = () => {
        setHistogram({});
        setTopEstimates([]);
    };

    return (
        <div className="page-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <style>{`
                .pitch-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .pitch-header h1 {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 32px;
                    font-weight: 700;
                    color: var(--text-inverse);
                    margin: 0 0 8px 0;
                }
                .pitch-header p {
                    color: var(--text-inverse-muted, #737373);
                    font-size: 15px;
                    margin: 0;
                }
                .mic-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 200px;
                    margin-bottom: 1rem;
                }
                .mic-button {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    background: var(--bg-surface);
                    color: var(--text-primary);
                    position: relative;
                    transition: all 0.3s ease;
                }
                .mic-button.listening {
                    border: 3px solid var(--accent);
                    color: var(--accent);
                }
                .mic-button:not(.listening) {
                    border: 1px solid var(--border-color);
                    color: var(--text-inverse-muted);
                    background: var(--bg-card);
                }
                .current-note {
                    font-size: 36px;
                    font-weight: bold;
                    margin-top: 8px;
                    font-family: 'DM Sans', sans-serif;
                }
                .listening-text {
                    text-align: center;
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 24px;
                }
                .listening-text.active {
                    color: var(--accent);
                }
                .listening-text.inactive {
                    color: var(--text-inverse-muted, #737373);
                }
                .reset-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 0 auto 32px auto;
                    background: transparent;
                    border: none;
                    color: var(--text-inverse-muted, #737373);
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: color 0.2s;
                }
                .reset-btn:hover {
                    color: var(--text-inverse);
                }
                .error-msg {
                    color: #e53e3e;
                    text-align: center;
                    font-size: 14px;
                    margin-bottom: 24px;
                }
                .estimates-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text-inverse);
                    margin-bottom: 16px;
                }
                .estimate-card {
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    border-radius: 12px;
                    margin-bottom: 12px;
                    background: var(--bg-surface);
                    border: 1px solid var(--sidebar-border);
                }
                .estimate-card.top-match {
                    background: var(--accent-muted);
                    border: 1.5px solid var(--accent);
                }
                .estimate-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 16px;
                }
                .estimate-card.top-match .estimate-icon {
                    background: var(--accent);
                    color: var(--bg-surface);
                }
                .estimate-card:not(.top-match) .estimate-icon {
                    background: var(--hover-bg);
                    color: var(--text-primary);
                }
                .estimate-info h4 {
                    margin: 0 0 4px 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .estimate-card.top-match .estimate-info h4 {
                    color: var(--accent);
                }
                .estimate-info p {
                    margin: 0;
                    font-size: 13px;
                    color: var(--text-muted);
                }
                .estimate-card.top-match .estimate-info p {
                    color: var(--text-inverse-muted, #737373);
                }
                
                @media (max-width: 768px) {
                    .pitch-header h1 { font-size: 28px; }
                }
            `}</style>

            <div className="pitch-header">
                <h1>Pitch Detector</h1>
                <p>Sing or play an instrument to detect your key.</p>
            </div>

            <div className="mic-container">
                <motion.button
                    className={`mic-button ${isListening ? 'listening' : ''}`}
                    onClick={toggleListening}
                    animate={{
                        width: isListening ? 160 : 140,
                        height: isListening ? 160 : 140,
                        boxShadow: isListening 
                            ? '0 0 40px 10px rgba(201,168,76,0.4)' 
                            : '0 4px 20px rgba(0,0,0,0.05)'
                    }}
                    transition={{ duration: 0.3 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {isListening ? <Mic size={40} /> : <MicOff size={40} />}
                    <div className="current-note" style={{ color: currentNote !== '--' ? 'inherit' : 'var(--text-inverse-muted)' }}>
                        {isListening ? currentNote : '--'}
                    </div>
                </motion.button>
            </div>

            <div className={`listening-text ${isListening ? 'active' : 'inactive'}`}>
                {isListening ? 'Listening...' : 'Tap to start'}
            </div>

            {error && (
                <div className="error-msg">
                    Error: {error}
                </div>
            )}

            <button className="reset-btn" onClick={resetData}>
                <RefreshCw size={16} /> Reset Data
            </button>

            {topEstimates.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="estimates-title">Detected Keys</div>
                    {topEstimates.map((est, idx) => {
                        const isTop = idx === 0;
                        const matchPct = Math.round(Math.min(Math.max(est.score * 100, 0), 100));
                        return (
                            <motion.div 
                                key={est.keyName}
                                className={`estimate-card ${isTop ? 'top-match' : ''}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <div className="estimate-icon">
                                    <Music size={20} />
                                </div>
                                <div className="estimate-info">
                                    <h4>{est.keyName}</h4>
                                    <p>Confidence: {matchPct}%</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
};

export default PitchDetector;
