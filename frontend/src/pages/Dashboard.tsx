import { Link } from 'react-router-dom';
import { Music, Users, ListMusic, Tag, ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const cards = [
        {
            href: '/songs',
            icon: Music,
            label: 'Songs Library',
            description: 'Manage your core song catalog, keys, and chord sheets.',
            cta: 'Browse songs',
        },
        {
            href: '/leaders',
            icon: Users,
            label: 'Song Leaders',
            description: 'Add and manage song leaders with personalized versions.',
            cta: 'View leaders',
        },
        {
            href: '/setlists',
            icon: ListMusic,
            label: 'Setlists',
            description: 'Build and organize setlists for Sunday practice sessions.',
            cta: 'Open setlists',
        },
        {
            href: '/tags',
            icon: Tag,
            label: 'Tags',
            description: 'Categorize songs by type — Worship, Communion, Fast, and more.',
            cta: 'Manage tags',
        },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

                .dash * { box-sizing: border-box; }
                .dash { font-family: 'DM Sans', sans-serif; }

                /* ── HERO ── */
                .dash-hero {
                    background: var(--bg-surface);
                    border-radius: 18px;
                    padding: 44px 40px;
                    margin-bottom: 36px;
                    position: relative;
                    overflow: hidden;
                }

                .dash-hero::before {
                    content: '';
                    position: absolute;
                    top: -60px; right: -60px;
                    width: 280px; height: 280px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(201,168,76,0.14) 0%, transparent 70%);
                    pointer-events: none;
                }

                .dash-hero::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 1.5px;
                    background: linear-gradient(90deg, transparent, rgba(201,168,76,0.6) 50%, transparent);
                }

                .hero-eyebrow {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: var(--accent);
                    margin-bottom: 16px;
                    background: rgba(201,168,76,0.1);
                    border: 1px solid rgba(201,168,76,0.22);
                    padding: 5px 12px;
                    border-radius: 20px;
                }

                .hero-title {
                    font-family: 'Cormorant Garamond', Georgia, serif;
                    font-size: clamp(30px, 4vw, 44px);
                    font-weight: 700;
                    color: var(--text-inverse);
                    margin: 0 0 10px 0;
                    line-height: 1.08;
                    letter-spacing: -0.015em;
                    max-width: 520px;
                }

                .hero-sub {
                    font-size: 14.5px;
                    color: rgba(240,237,232,0.5);
                    margin: 0;
                    line-height: 1.6;
                    max-width: 440px;
                }

                .hero-deco {
                    position: absolute;
                    bottom: 20px; right: 32px;
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 96px;
                    font-weight: 700;
                    color: rgba(201,168,76,0.06);
                    line-height: 1;
                    pointer-events: none;
                    user-select: none;
                }

                /* ── SECTION LABEL ── */
                .section-label {
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.13em;
                    text-transform: uppercase;
                    color: #b0aba5;
                    margin-bottom: 16px;
                    padding-left: 2px;
                }

                /* ── GRID ── */
                .dash-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                    margin-bottom: 40px;
                }

                .dash-card {
                    background: var(--bg-card);
                    border-radius: 14px;
                    border: 1.5px solid #ede9e4;
                    padding: 24px;
                    text-decoration: none;
                    color: inherit;
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                }

                .dash-card::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent);
                    opacity: 0;
                    transition: opacity 0.18s;
                }

                .dash-card:hover {
                    border-color: rgba(201,168,76,0.35);
                    box-shadow: 0 4px 20px rgba(201,168,76,0.1), 0 1px 4px rgba(0,0,0,0.06);
                    transform: translateY(-2px);
                }

                .dash-card:hover::after { opacity: 1; }

                .card-icon-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }

                .card-icon {
                    width: 46px; height: 46px;
                    border-radius: 11px;
                    background: #f7f4f0;
                    border: 1.5px solid #ede9e4;
                    display: flex; align-items: center; justify-content: center;
                    transition: background 0.18s, border-color 0.18s;
                }

                .dash-card:hover .card-icon {
                    background: rgba(201,168,76,0.1);
                    border-color: rgba(201,168,76,0.3);
                }

                .dash-card:hover .card-icon svg { color: var(--accent) !important; }

                .card-arrow {
                    color: #d8d3ce;
                    transition: color 0.18s, transform 0.18s;
                }

                .dash-card:hover .card-arrow { color: var(--accent); transform: translate(3px, -3px); }

                .card-label {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 21px;
                    font-weight: 700;
                    color: #0f1117;
                    margin: 0 0 6px 0;
                    line-height: 1.1;
                }

                .card-desc {
                    font-size: 13px;
                    color: #8a8680;
                    line-height: 1.55;
                    margin: 0 0 18px 0;
                    flex: 1;
                }

                .card-cta {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 12.5px;
                    font-weight: 600;
                    color: var(--accent);
                    letter-spacing: 0.03em;
                }

                /* ── FOOTER NOTE ── */
                .dash-footer-note {
                    background: var(--bg-card-alt);
                    border: 1.5px solid #ede9e4;
                    border-radius: 12px;
                    padding: 18px 22px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .footer-note-dot {
                    width: 8px; height: 8px;
                    border-radius: 50%;
                    background: var(--accent);
                    flex-shrink: 0;
                    box-shadow: 0 0 0 3px rgba(201,168,76,0.18);
                }

                .footer-note-text {
                    font-size: 13px;
                    color: #7a7570;
                    line-height: 1.5;
                    margin: 0;
                }

                .footer-note-text strong { color: #3a3630; font-weight: 600; }

                @media (max-width: 640px) {
                    .dash-hero { padding: 30px 22px; }
                    .hero-deco { display: none; }
                }
            `}</style>

            <div className="dash">
                {/* Hero */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="dash-hero"
                >
                    <div className="hero-eyebrow">
                        <Music size={11} /> Worship &amp; Music Ministry
                    </div>
                    <h1 className="hero-title">Your ministry,<br />organized.</h1>
                    <p className="hero-sub">Manage songs, leaders, setlists, and tags all in one place for seamless Sunday worship.</p>
                    <motion.div 
                        animate={{ 
                            y: [0, -10, 0],
                            rotate: [0, 5, 0]
                        }}
                        transition={{ 
                            duration: 4, 
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="hero-deco"
                    >
                        ♪
                    </motion.div>
                </motion.div>

                {/* Cards */}
                <p className="section-label">Quick Access</p>
                <motion.div 
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="dash-grid"
                >
                    {cards.map(({ href, icon: Icon, label, description, cta }) => (
                        <motion.div key={href} variants={item}>
                            <Link to={href} className="dash-card">
                                <div className="card-icon-row">
                                    <div className="card-icon">
                                        <Icon size={20} color="#b0aba5" />
                                    </div>
                                    <ArrowRight size={16} className="card-arrow" />
                                </div>
                                <h2 className="card-label">{label}</h2>
                                <p className="card-desc">{description}</p>
                                <div className="card-cta">
                                    {cta} <ChevronRight size={13} />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Footer note */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="dash-footer-note"
                >
                    <div className="footer-note-dot" />
                    <p className="footer-note-text">
                        <strong>Tip:</strong> Use Tags to categorize songs by mood or occasion, then filter the Songs Library to quickly find what you need for each service.
                    </p>
                </motion.div>
            </div>
        </>
    );
};

export default Dashboard;
