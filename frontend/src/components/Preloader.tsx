import React from 'react';
import { motion } from 'framer-motion';
import { Music } from 'lucide-react';

const Preloader: React.FC<{ text?: string, fullScreen?: boolean }> = ({ text = 'Loading...', fullScreen = true }) => {
    return (
        <div style={{
            position: fullScreen ? 'fixed' : 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: fullScreen ? 'rgba(15, 17, 23, 0.85)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: fullScreen ? 'blur(12px)' : 'none',
            WebkitBackdropFilter: fullScreen ? 'blur(12px)' : 'none',
            zIndex: fullScreen ? 999999 : 10,
            fontFamily: "'DM Sans', sans-serif"
        }}>
            <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 28 }}>
                {/* Outer ring */}
                <motion.div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        border: '3px solid rgba(201,168,76,0.1)',
                        borderTopColor: '#c9a84c',
                        borderRightColor: 'rgba(201,168,76,0.5)',
                        borderRadius: '50%',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
                
                {/* Middle reverse ring */}
                <motion.div
                    style={{
                        position: 'absolute',
                        inset: 8,
                        border: '2px dashed rgba(201,168,76,0.3)',
                        borderRadius: '50%',
                    }}
                    animate={{ rotate: -360 }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
                
                {/* Inner pulsing circle */}
                <motion.div
                    style={{
                        position: 'absolute',
                        inset: 22,
                        background: 'linear-gradient(135deg, #c9a84c 0%, #b59540 100%)',
                        borderRadius: '50%',
                        boxShadow: '0 0 30px rgba(201,168,76,0.6)'
                    }}
                    animate={{ 
                        scale: [1, 1.15, 1],
                        opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                
                {/* Center dot with Icon */}
                <div style={{
                    position: 'absolute',
                    inset: 28,
                    background: fullScreen ? '#0f1117' : '#fff',
                    borderRadius: '50%',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <motion.div
                        animate={{ scale: [0.9, 1.1, 0.9] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Music size={22} color="#c9a84c" />
                    </motion.div>
                </div>
            </div>
            
            <motion.h3 
                style={{
                    background: 'linear-gradient(90deg, #c9a84c, #e8d08c, #c9a84c)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '200% auto',
                    fontSize: '20px',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    margin: 0
                }}
                animate={{ backgroundPosition: ['0% center', '200% center'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
                {text}
            </motion.h3>
            <motion.p
                style={{
                    color: '#8a8680',
                    fontSize: '13px',
                    marginTop: '8px',
                    letterSpacing: '1px'
                }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
                WORSHIP AND MUSIC MINISTRY
            </motion.p>
        </div>
    );
};

export default Preloader;
