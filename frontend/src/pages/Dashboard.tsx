import { Link } from 'react-router-dom';
import { Music, Users, ListMusic, Tag, Calendar, Plus, FileText, Play, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../api';

interface Tag { id: number; name: string; }
interface Song { id: number; title: string; original_key: string | null; tags?: Tag[]; created_at?: string; }
interface SongLeader { id: number; name: string; }
interface Setlist { id: number; title: string; date: string | null; created_at?: string; }

const Dashboard = () => {
    const { user } = useAuth();
    const firstName = user?.name ? user.name.split(' ')[0] : 'Leader';

    // Fetch Data
    const { data: songs = [] } = useQuery<Song[]>({
        queryKey: ['songs'],
        queryFn: () => api.get('/songs').then(res => res.data)
    });

    const { data: leaders = [] } = useQuery<SongLeader[]>({
        queryKey: ['song-leaders'],
        queryFn: () => api.get('/song-leaders').then(res => res.data)
    });

    const { data: setlists = [] } = useQuery<Setlist[]>({
        queryKey: ['setlists'],
        queryFn: () => api.get('/setlists').then(res => res.data)
    });

    // Derived Data
    const totalSongs = songs.length;
    const totalLeaders = leaders.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentHour = parseInt(
        new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            hour12: false,
            timeZone: 'Asia/Manila'
        }).format(new Date())
    );
    let greeting = 'Good evening';
    if (currentHour >= 5 && currentHour < 12) {
        greeting = 'Good morning';
    } else if (currentHour >= 12 && currentHour < 17) {
        greeting = 'Good afternoon';
    }

    const upcomingSetlists = setlists.filter(s => {
        if (!s.date) return false;
        return new Date(s.date) >= today;
    }).sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

    const nextService = upcomingSetlists.length > 0 ? upcomingSetlists[0] : null;
    let nextServiceDateStr = 'No upcoming service';
    let practiceDateStr = 'N/A';

    if (nextService && nextService.date) {
        const d = new Date(nextService.date);
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        nextServiceDateStr = `${d.toLocaleDateString('en-US', options)} (${d.toLocaleDateString('en-US', { weekday: 'long' })})`;
        
        const p = new Date(d);
        p.setDate(p.getDate() - 1);
        practiceDateStr = `${p.toLocaleDateString('en-US', options)} (${p.toLocaleDateString('en-US', { weekday: 'long' })})`;
    }

    const draftSetlistsCount = setlists.filter(s => !s.date).length;

    // Recent Setlists (last 3)
    const recentSetlists = [...setlists].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
    }).slice(0, 3);

    // Recently Added Songs (last 4)
    const recentSongs = [...songs].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
    }).slice(0, 4);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

                .dash * { box-sizing: border-box; }
                .dash { font-family: 'DM Sans', sans-serif; padding-bottom: 40px; }

                /* ── HERO ── */
                .dash-hero {
                    background: #000;
                    border-radius: 18px;
                    padding: 44px 40px;
                    margin-bottom: 24px;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 30px;
                }

                .dash-hero-video {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    object-fit: cover;
                    z-index: 0;
                    opacity: 0.4;
                }

                .dash-hero-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to right, rgba(15,17,23,0.95) 0%, rgba(15,17,23,0.5) 50%, rgba(15,17,23,0.85) 100%);
                    z-index: 1;
                    pointer-events: none;
                }

                .hero-content {
                    position: relative;
                    z-index: 2;
                    flex: 1;
                }

                .hero-actions {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    gap: 16px;
                    flex-shrink: 0;
                }

                .hero-eyebrow {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    font-size: 14px;
                    font-weight: 700;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: var(--accent);
                    margin-bottom: 16px;
                    background: rgba(201,168,76,0.15);
                    border: 1px solid rgba(201,168,76,0.3);
                    padding: 6px 14px;
                    border-radius: 20px;
                }

                .hero-title {
                    font-family: 'Cormorant Garamond', Georgia, serif;
                    font-size: clamp(34px, 4vw, 44px);
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 10px 0;
                    line-height: 1.08;
                    letter-spacing: -0.015em;
                }

                .hero-sub {
                    font-size: 18.5px;
                    color: rgba(255,255,255,0.7);
                    margin: 0;
                    line-height: 1.6;
                    max-width: 500px;
                }

                .hero-badges {
                    display: flex;
                    gap: 16px;
                    margin-top: 24px;
                    flex-wrap: wrap;
                }

                .hero-badge {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 12px 18px;
                    border-radius: 12px;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                }

                .hero-badge-icon { color: var(--accent); }

                .hero-badge-text { display: flex; flex-direction: column; }

                .hero-badge-label {
                    font-size: 12px;
                    color: rgba(255,255,255,0.6);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 2px;
                }

                .hero-badge-val {
                    font-size: 15px;
                    color: #fff;
                    font-weight: 600;
                }

                .btn-primary {
                    background: var(--accent);
                    color: #0f1117;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .btn-primary:hover { background: #d4b55c; transform: translateY(-1px); }

                .btn-outline {
                    background: rgba(255,255,255,0.05);
                    color: #fff;
                    border: 1px solid rgba(255,255,255,0.2);
                    padding: 12px 24px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .btn-outline:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: rgba(255,255,255,0.3);
                    transform: translateY(-1px);
                }

                @media (max-width: 900px) {
                    .dash-hero {
                        flex-direction: column;
                        align-items: flex-start;
                        padding: 30px 24px;
                    }
                    .hero-actions {
                        width: 100%;
                        flex-wrap: wrap;
                        justify-content: flex-start;
                    }
                }

                /* ── STAT CARDS ── */
                .stat-cards-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                    margin-bottom: 32px;
                }

                .stat-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                    text-decoration: none;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }

                .stat-icon {
                    width: 50px; height: 50px;
                    border-radius: 50%;
                    background: rgba(201,168,76,0.1);
                    color: var(--accent);
                    display: flex; align-items: center; justify-content: center;
                }

                .stat-content {
                    flex: 1;
                }

                .stat-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #8c8884;
                    margin-bottom: 2px;
                }

                .stat-val {
                    font-size: 28px;
                    font-weight: 700;
                    color: #0f1117;
                    font-family: 'Cormorant Garamond', serif;
                    line-height: 1;
                    margin-bottom: 4px;
                }

                .stat-sub {
                    font-size: 12px;
                    color: #a09d98;
                }
                
                .stat-arrow {
                    color: #d8d3ce;
                }

                /* ── MAIN LAYOUT GRID ── */
                .dash-main-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }

                @media (max-width: 1024px) {
                    .dash-main-grid { grid-template-columns: 1fr; }
                }

                /* ── SECTION PANELS ── */
                .dash-panel {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                    display: flex;
                    flex-direction: column;
                }

                .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .panel-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #0f1117;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .panel-title svg { color: var(--accent); }

                .panel-action {
                    font-size: 13px;
                    color: var(--accent);
                    font-weight: 600;
                    text-decoration: none;
                }
                .panel-action:hover { text-decoration: underline; }

                /* ── LIST ITEMS (Schedule / Setlists) ── */
                .list-item {
                    display: flex;
                    align-items: center;
                    padding: 16px 0;
                    border-bottom: 1px solid var(--border-color);
                    gap: 16px;
                }
                .list-item:last-child { border-bottom: none; padding-bottom: 0; }

                .list-date-box {
                    text-align: center;
                    width: 48px;
                }
                .list-date-month {
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #8c8884;
                    display: block;
                }
                .list-date-day {
                    font-size: 22px;
                    font-weight: 700;
                    color: #0f1117;
                    font-family: 'Cormorant Garamond', serif;
                    display: block;
                    line-height: 1;
                    margin: 4px 0;
                }
                .list-date-dow {
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: #a09d98;
                    display: block;
                }

                .list-icon-box {
                    width: 42px; height: 42px;
                    background: #f7f5f2;
                    border: 1px solid #ede9e4;
                    border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    color: #8c8884;
                }

                .list-content { flex: 1; }
                .list-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: #0f1117;
                    margin-bottom: 4px;
                }
                .list-sub {
                    font-size: 13px;
                    color: #8c8884;
                }

                .list-badge {
                    font-size: 10px;
                    font-weight: 700;
                    padding: 4px 8px;
                    border-radius: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .badge-this-sunday { background: rgba(201,168,76,0.15); color: #9c7b2a; }
                .badge-upcoming { background: #f0f0f0; color: #6b6865; }
                .badge-practice { background: #e0f2fe; color: #0284c7; }
                .badge-draft { background: #fef9c3; color: #a16207; }
                .badge-published { background: #dcfce7; color: #166534; }

                /* ── TABLE ── */
                .simple-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .simple-table th {
                    text-align: left;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #8c8884;
                    padding-bottom: 12px;
                    border-bottom: 1px solid var(--border-color);
                }
                .simple-table td {
                    padding: 14px 0;
                    border-bottom: 1px solid var(--border-color);
                    font-size: 14px;
                    color: #0f1117;
                }
                .simple-table tr:last-child td { border-bottom: none; }
                .td-title { font-weight: 600; }
                .td-key { color: #8c8884; font-weight: 500; }
                
                .tag-pill {
                    font-size: 10px;
                    font-weight: 700;
                    padding: 3px 8px;
                    border-radius: 12px;
                    background: #f3f0ec;
                    color: #6b6865;
                    display: inline-block;
                }

                /* ── QUICK ACTIONS ── */
                .quick-actions-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }

                .qa-card {
                    background: #fff;
                    border: 1px solid #ede9e4;
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .qa-card:hover {
                    border-color: rgba(201,168,76,0.4);
                    box-shadow: 0 4px 12px rgba(201,168,76,0.08);
                    transform: translateY(-2px);
                }
                .qa-icon {
                    width: 40px; height: 40px;
                    background: #f7f5f2;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--accent);
                    margin-bottom: 12px;
                }
                .qa-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #0f1117;
                    margin-bottom: 4px;
                }
                .qa-sub {
                    font-size: 12px;
                    color: #8c8884;
                    line-height: 1.4;
                }
                
                /* Helper for date extraction */
                .capitalize { text-transform: capitalize; }
            `}</style>

            <div className="dash">
                {/* Hero */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="dash-hero"
                >
                    <video 
                        className="dash-hero-video" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                    >
                        <source src="/worship-mobile.mp4" media="(max-width: 899px)" type="video/mp4" />
                        <source src="/worship.mp4" type="video/mp4" />
                    </video>
                    <div className="dash-hero-overlay" />
                    
                    <div className="hero-content">
                        <div className="hero-eyebrow" style={{ color: 'var(--accent)', border: '1px solid rgba(201,168,76,0.3)', background: 'transparent' }}>
                            <Music size={13} /> WORSHIP &amp; MUSIC MINISTRY
                        </div>
                        <h1 className="hero-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {greeting}, {firstName}! <span>👋</span>
                        </h1>
                        <p className="hero-sub" style={{ marginBottom: '24px' }}>Let's prepare for an amazing Sunday worship.</p>
                        
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div className="hero-badge" style={{ padding: '14px 20px', background: 'rgba(0,0,0,0.2)' }}>
                                <Calendar size={24} className="hero-badge-icon" />
                                <div className="hero-badge-text">
                                    <span className="hero-badge-label">Next Service</span>
                                    <span className="hero-badge-val" style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                        {nextServiceDateStr} <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', textTransform: 'none' }}>• 9:30 AM</span>
                                    </span>
                                </div>
                            </div>

                            <Link to="/setlists" className="btn-primary" style={{ padding: '14px 24px', margin: 0 }}>
                                <Plus size={18} /> Create Setlist
                            </Link>
                        </div>
                    </div>

                    <div className="hero-logo-container" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingRight: '20px' }}>
                        <img 
                            src="/transparent.png" 
                            alt="WAM Ministry" 
                            style={{ height: '160px', objectFit: 'contain' }}
                        />
                        <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '12px', marginTop: '4px' }}>Official Ministry Team</span>
                    </div>
                </motion.div>

                {/* 4 Stat Cards */}
                <div className="stat-cards-grid">
                    <Link to="/songs" className="stat-card">
                        <div className="stat-icon"><Music size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-label">Songs Library</div>
                            <div className="stat-val">{totalSongs}</div>
                            <div className="stat-sub">Total Songs</div>
                        </div>
                        <ChevronRight size={18} className="stat-arrow" />
                    </Link>
                    <Link to="/leaders" className="stat-card">
                        <div className="stat-icon"><Users size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-label">Song Leaders</div>
                            <div className="stat-val">{totalLeaders}</div>
                            <div className="stat-sub">Active Leaders</div>
                        </div>
                        <ChevronRight size={18} className="stat-arrow" />
                    </Link>
                    <Link to="/setlists" className="stat-card">
                        <div className="stat-icon"><Calendar size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-label">Upcoming Services</div>
                            <div className="stat-val">{upcomingSetlists.length}</div>
                            <div className="stat-sub">Scheduled</div>
                        </div>
                        <ChevronRight size={18} className="stat-arrow" />
                    </Link>
                    <Link to="/setlists" className="stat-card">
                        <div className="stat-icon"><FileText size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-label">Draft Setlists</div>
                            <div className="stat-val">{draftSetlistsCount}</div>
                            <div className="stat-sub">Pending Review</div>
                        </div>
                        <ChevronRight size={18} className="stat-arrow" />
                    </Link>
                </div>

                <div className="dash-main-grid">
                    {/* LEFT COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Upcoming Schedule */}
                        <div className="dash-panel">
                            <div className="panel-header">
                                <div className="panel-title"><Calendar size={18} /> Upcoming Schedule</div>
                                <Link to="/setlists" className="panel-action">View all</Link>
                            </div>
                            
                            {upcomingSetlists.slice(0, 3).map((sl, idx) => {
                                const d = sl.date ? new Date(sl.date) : new Date();
                                const month = d.toLocaleDateString('en-US', { month: 'short' });
                                const day = d.getDate();
                                const dow = d.toLocaleDateString('en-US', { weekday: 'short' });
                                const time = d.toLocaleDateString('en-US', { hour: 'numeric', minute: '2-digit' });
                                
                                return (
                                    <div className="list-item" key={`schedule-${sl.id}`}>
                                        <div className="list-date-box">
                                            <span className="list-date-month">{month}</span>
                                            <span className="list-date-day">{day}</span>
                                            <span className="list-date-dow">{dow}</span>
                                        </div>
                                        <div className="list-content">
                                            <div className="list-title">Worship Service</div>
                                            <div className="list-sub">{time} • {sl.title}</div>
                                        </div>
                                        <div className={`list-badge ${idx === 0 ? 'badge-this-sunday' : 'badge-upcoming'}`}>
                                            {idx === 0 ? 'THIS SUNDAY' : 'UPCOMING'}
                                        </div>
                                    </div>
                                );
                            })}

                            {upcomingSetlists.length === 0 && (
                                <div className="list-item"><div className="list-content"><div className="list-sub">No upcoming services scheduled.</div></div></div>
                            )}
                        </div>

                        {/* Recently Added Songs */}
                        <div className="dash-panel">
                            <div className="panel-header">
                                <div className="panel-title"><Music size={18} /> Recently Added Songs</div>
                                <Link to="/songs" className="panel-action">View all</Link>
                            </div>
                            
                            <table className="simple-table">
                                <thead>
                                    <tr>
                                        <th>Song Title</th>
                                        <th>Key</th>
                                        <th>Category</th>
                                        <th style={{ width: '20px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentSongs.map(song => (
                                        <tr key={song.id}>
                                            <td className="td-title">{song.title}</td>
                                            <td className="td-key">{song.original_key || '--'}</td>
                                            <td>
                                                <span className="tag-pill">
                                                    {song.tags && song.tags.length > 0 ? song.tags[0].name : 'UNTAGGED'}
                                                </span>
                                            </td>
                                            <td><ChevronRight size={14} color="#d8d3ce" /></td>
                                        </tr>
                                    ))}
                                    {recentSongs.length === 0 && (
                                        <tr><td colSpan={4} className="list-sub" style={{ textAlign: 'center', padding: '20px' }}>No songs added yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Recent Setlists */}
                        <div className="dash-panel">
                            <div className="panel-header">
                                <div className="panel-title"><ListMusic size={18} /> Recent Setlists</div>
                                <Link to="/setlists" className="panel-action">View all</Link>
                            </div>
                            
                            {recentSetlists.map((sl) => {
                                const isDraft = !sl.date;
                                return (
                                    <div className="list-item" key={`recent-${sl.id}`}>
                                        <div className="list-icon-box">
                                            <FileText size={20} />
                                        </div>
                                        <div className="list-content">
                                            <div className="list-title">{sl.title}</div>
                                            <div className="list-sub">{sl.date ? new Date(sl.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date set'}</div>
                                        </div>
                                        <div className={`list-badge ${isDraft ? 'badge-draft' : 'badge-published'}`}>
                                            {isDraft ? 'DRAFT' : 'PUBLISHED'}
                                        </div>
                                    </div>
                                );
                            })}
                            {recentSetlists.length === 0 && (
                                <div className="list-item"><div className="list-content"><div className="list-sub">No recent setlists.</div></div></div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="dash-panel">
                            <div className="panel-header">
                                <div className="panel-title"><Play size={18} /> Quick Actions</div>
                            </div>
                            
                            <div className="quick-actions-grid">
                                <Link to="/songs" className="qa-card">
                                    <div className="qa-icon"><Music size={18} /></div>
                                    <div className="qa-title">Add Song</div>
                                    <div className="qa-sub">Add a new song to the library</div>
                                </Link>
                                <Link to="/setlists" className="qa-card">
                                    <div className="qa-icon"><ListMusic size={18} /></div>
                                    <div className="qa-title">Create Setlist</div>
                                    <div className="qa-sub">Build a setlist for your next service</div>
                                </Link>
                                <Link to="/leaders" className="qa-card">
                                    <div className="qa-icon"><Users size={18} /></div>
                                    <div className="qa-title">Manage Leaders</div>
                                    <div className="qa-sub">Add or update song leaders</div>
                                </Link>
                                <Link to="/tags" className="qa-card">
                                    <div className="qa-icon"><Tag size={18} /></div>
                                    <div className="qa-title">Organize Tags</div>
                                    <div className="qa-sub">Manage song categories and tags</div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
};

export default Dashboard;
