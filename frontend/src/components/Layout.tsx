import { Outlet, Link, useLocation } from 'react-router-dom';
import { Music, Users, ListMusic, Home, Menu, Tag, ChevronRight, X, LogOut, Shield, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    const navigation = [
        { name: 'Dashboard', href: '/', icon: Home, description: 'Overview' },
        ...(user?.role === 'admin' ? [{ name: 'System Access', href: '/users', icon: Shield, description: 'User Admin' }] : []),
        { name: 'Schedule', href: '/schedule', icon: Calendar, description: 'Line-ups' },
        { name: 'Songs', href: '/songs', icon: Music, description: 'Library' },
        { name: 'Song Leaders', href: '/leaders', icon: Users, description: 'Team' },
        { name: 'Setlists', href: '/setlists', icon: ListMusic, description: 'Planning' },
        { name: 'Tags', href: '/tags', icon: Tag, description: 'Organize' },
    ];

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
                    --hover-bg: rgba(255,255,255,0.04);
                    --active-bg: rgba(201,168,76,0.12);
                    --main-bg: #f7f5f2;
                    --sidebar-expanded: 260px;
                    --sidebar-collapsed: 68px;
                    --bg-surface: #0f1117;
                    --bg-card: #fff;
                    --bg-card-alt: #faf8f5;
                    --border-color: #ede9e4;
                }

                * { box-sizing: border-box; }
                body { font-family: 'DM Sans', sans-serif; background: var(--main-bg); margin: 0; }

                .layout-root {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: row;
                }

                /* ── SIDEBAR ── */
                .sidebar {
                    width: var(--sidebar-expanded);
                    flex-shrink: 0;
                    background: var(--sidebar-bg);
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    z-index: 20;
                    border-right: 1px solid var(--sidebar-border);
                    overflow: hidden;
                }

                /* noise texture */
                .sidebar::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
                    pointer-events: none;
                }

                /* gold shimmer line */
                .sidebar::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, var(--accent), transparent);
                    opacity: 0.6;
                }

                /* ── SIDEBAR HEADER ── */
                .sidebar-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 12px;
                    border-bottom: 1px solid var(--sidebar-border);
                    flex-shrink: 0;
                    min-height: 64px;
                    gap: 8px;
                    position: relative;
                    z-index: 1;
                    transition: padding 0.3s;
                }

                .sidebar.collapsed .sidebar-header {
                    justify-content: center;
                    padding: 14px 0;
                }

                .sidebar-brand-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    overflow: hidden;
                    flex: 1;
                    min-width: 0;
                }

                .brand-icon-wrap {
                    width: 36px;
                    height: 36px;
                    border-radius: 9px;
                    background: var(--accent-muted);
                    border: 1px solid rgba(201,168,76,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .brand-text {
                    overflow: hidden;
                    white-space: nowrap;
                    min-width: 0;
                }

                .brand-title {
                    font-family: 'Cormorant Garamond', Georgia, serif;
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--text-primary);
                    line-height: 1.15;
                    margin: 0 0 1px 0;
                    letter-spacing: 0.01em;
                }

                .brand-subtitle {
                    font-size: 10px;
                    font-weight: 500;
                    color: var(--text-muted);
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    margin: 0;
                }

                /* ── HAMBURGER TOGGLE ── */
                .sidebar-toggle {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: var(--hover-bg);
                    border: 1px solid var(--sidebar-border);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                    transition: background 0.15s, color 0.15s;
                    flex-shrink: 0;
                    position: relative;
                    z-index: 1;
                }

                .sidebar-toggle:hover {
                    background: rgba(255,255,255,0.08);
                    color: var(--text-primary);
                }

                .ham { display: flex; flex-direction: column; gap: 4px; width: 15px; }
                .ham span {
                    display: block;
                    height: 1.5px;
                    background: currentColor;
                    border-radius: 2px;
                    transition: width 0.22s ease;
                }
                .ham span:nth-child(1) { width: 15px; }
                .ham span:nth-child(2) { width: 10px; }
                .ham span:nth-child(3) { width: 15px; }

                /* ── NAV SECTION LABEL ── */
                .nav-section-label {
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    padding: 18px 18px 8px;
                    white-space: nowrap;
                    overflow: hidden;
                    position: relative;
                    z-index: 1;
                }

                /* ── NAV LINKS ── */
                .nav-links {
                    padding: 0 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    position: relative;
                    z-index: 1;
                    transition: padding-top 0.3s;
                }

                .sidebar.collapsed .nav-links {
                    padding-top: 12px;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 10px;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: background 0.18s, color 0.18s;
                    color: var(--text-muted);
                    border: 1px solid transparent;
                    white-space: nowrap;
                    position: relative;
                    overflow: visible;
                }

                .nav-link:hover {
                    background: var(--hover-bg);
                    color: var(--text-primary);
                    border-color: var(--sidebar-border);
                }

                .nav-link.active {
                    background: var(--active-bg);
                    color: var(--accent);
                    border-color: rgba(201,168,76,0.2);
                }

                .nav-link-icon {
                    width: 34px;
                    height: 34px;
                    border-radius: 7px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    background: rgba(255,255,255,0.03);
                    transition: background 0.18s;
                }

                .nav-link.active .nav-link-icon { background: var(--accent-muted); }

                .nav-link-text {
                    flex: 1;
                    overflow: hidden;
                    min-width: 0;
                }

                .nav-link-name {
                    font-size: 13px;
                    font-weight: 500;
                    display: block;
                    line-height: 1;
                    margin-bottom: 2px;
                }

                .nav-link-desc { font-size: 11px; opacity: 0.55; line-height: 1; }

                .nav-link .chevron {
                    opacity: 0;
                    transition: opacity 0.15s, transform 0.15s;
                    transform: translateX(-4px);
                    flex-shrink: 0;
                }

                .nav-link:hover .chevron,
                .nav-link.active .chevron { opacity: 0.5; transform: translateX(0); }

                /* ── TOOLTIP ── */
                .nav-tooltip {
                    display: none;
                    position: absolute;
                    left: calc(100% + 12px);
                    top: 50%;
                    transform: translateY(-50%);
                    background: #1e2130;
                    color: var(--text-primary);
                    font-size: 12px;
                    font-weight: 500;
                    padding: 6px 11px;
                    border-radius: 7px;
                    white-space: nowrap;
                    border: 1px solid var(--sidebar-border);
                    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                    pointer-events: none;
                    z-index: 200;
                }

                .nav-tooltip::before {
                    content: '';
                    position: absolute;
                    left: -5px; top: 50%;
                    transform: translateY(-50%);
                    border: 5px solid transparent;
                    border-right-color: #1e2130;
                    border-left: none;
                }

                /* ── FOOTER ── */
                .sidebar-footer {
                    margin-top: auto;
                    padding: 14px;
                    border-top: 1px solid var(--sidebar-border);
                    overflow: hidden;
                    position: relative;
                    z-index: 1;
                }

                .sidebar-footer-text {
                    font-size: 11px;
                    color: var(--text-muted);
                    letter-spacing: 0.05em;
                    white-space: nowrap;
                }

                /* ── MOBILE HEADER ── */
                .mobile-header {
                    display: none;
                    background: var(--sidebar-bg);
                    padding: 14px 20px;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid var(--sidebar-border);
                    position: sticky;
                    top: 0;
                    z-index: 30;
                }

                .mobile-header::after {
                    content: '';
                    position: absolute;
                    bottom: 0; left: 0; right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, var(--accent) 50%, transparent);
                    opacity: 0.4;
                }

                .mobile-brand { display: flex; align-items: center; gap: 10px; color: var(--text-primary); }
                .mobile-brand-name { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 700; letter-spacing: 0.02em; }

                .mobile-menu-btn {
                    background: var(--hover-bg);
                    border: 1px solid var(--sidebar-border);
                    border-radius: 7px; padding: 7px;
                    color: var(--text-primary); cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: background 0.15s;
                }

                .mobile-menu-btn:hover { background: rgba(255,255,255,0.08); }

                .mobile-sidebar { position: fixed; inset: 0; z-index: 40; }
                .mobile-sidebar-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); }
                .mobile-sidebar-panel { position: absolute; top: 0; left: 0; bottom: 0; width: 280px; background: var(--sidebar-bg); border-right: 1px solid var(--sidebar-border); overflow-y: auto; }

                /* ── MAIN ── */
                .main-area { flex: 1; display: flex; flex-direction: column; min-height: 100vh; overflow-x: hidden; }

                .main-topbar {
                    background: #fff;
                    border-bottom: 1px solid #ede9e4;
                    padding: 0 36px; height: 60px;
                    display: flex; align-items: center; justify-content: space-between;
                    flex-shrink: 0;
                }

                .topbar-breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #999; font-weight: 500; }
                .topbar-breadcrumb .current { color: #1a1a1a; font-weight: 600; }
                .topbar-dot { width: 3px; height: 3px; background: #d0ccc7; border-radius: 50%; }
                .topbar-actions { display: flex; align-items: center; gap: 10px; }

                .topbar-badge {
                    background: var(--accent-muted);
                    border: 1px solid rgba(201,168,76,0.3);
                    color: #8a6d2f;
                    font-size: 11px; font-weight: 600;
                    letter-spacing: 0.08em; text-transform: uppercase;
                    padding: 4px 10px; border-radius: 20px;
                }

                .main-content { flex: 1; padding: 36px; overflow-y: auto; }
                .content-inner { max-width: 1200px; margin: 0 auto; }

                @media (max-width: 768px) {
                    .layout-root { flex-direction: column; }
                    .sidebar { display: none; }
                    .mobile-header { display: flex; }
                    .main-topbar { display: none; }
                    .main-content { padding: 20px 16px; }
                }
            `}</style>

            {/* Mobile Header */}
            <div className="mobile-header">
                <div className="mobile-brand">
                    <div className="brand-icon-wrap" style={{ width: 32, height: 32 }}>
                        <Music size={16} color="#c9a84c" />
                    </div>
                    <span className="mobile-brand-name">Worship Ministry</span>
                </div>
                <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
                    <Menu size={18} />
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <div className="mobile-sidebar">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mobile-sidebar-backdrop" 
                            onClick={() => setIsMobileMenuOpen(false)} 
                        />
                        <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="mobile-sidebar-panel"
                        >
                            <MobileSidebarContents
                                navigation={navigation}
                                location={location}
                                onLinkClick={() => setIsMobileMenuOpen(false)}
                                onClose={() => setIsMobileMenuOpen(false)}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="layout-root">
                {/* Desktop Sidebar */}
                <motion.aside 
                    animate={{ width: isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-expanded)' }}
                    transition={{ duration: 0.3 }}
                    className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
                >

                    {/* Header with hamburger toggle */}
                    <div className="sidebar-header">
                        {!isCollapsed && (
                            <div className="sidebar-brand-row">
                                <div className="brand-icon-wrap">
                                    <Music size={18} color="#c9a84c" />
                                </div>
                                <AnimatePresence mode="wait">
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="brand-text"
                                    >
                                        <p className="brand-title">Worship &amp; Music</p>
                                        <p className="brand-subtitle">WAM</p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        )}
                        <button
                            className="sidebar-toggle"
                            onClick={() => setIsCollapsed(c => !c)}
                            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            <div className="ham">
                                <motion.span animate={{ width: isCollapsed ? 15 : 15 }} />
                                <motion.span animate={{ width: isCollapsed ? 15 : 10 }} />
                                <motion.span animate={{ width: isCollapsed ? 15 : 15 }} />
                            </div>
                        </button>
                    </div>

                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="nav-section-label"
                            >
                                Navigation
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <div className="nav-links">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`nav-link${isActive ? ' active' : ''}`}
                                >
                                    <div className="nav-link-icon">
                                        <Icon size={16} color={isActive ? '#c9a84c' : 'var(--text-muted)'} />
                                    </div>
                                    <AnimatePresence mode="wait">
                                        {!isCollapsed && (
                                            <motion.div 
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="nav-link-text"
                                            >
                                                <span className="nav-link-name">{item.name}</span>
                                                <span className="nav-link-desc">{item.description}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    {!isCollapsed && <ChevronRight size={13} className="chevron" />}
                                    {isCollapsed && <span className="nav-tooltip">{item.name}</span>}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="sidebar-footer">
                        <div style={{ paddingBottom: '14px', marginBottom: '14px', borderBottom: '1px solid var(--sidebar-border)' }}>
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <p className="sidebar-footer-text" style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>{user?.name}</p>
                                        <p className="sidebar-footer-text" style={{ fontSize: '10px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{user?.role}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button onClick={logout} className="sidebar-footer-text" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left', outline: 'none' }}>
                            <LogOut size={13} style={{ opacity: 0.6 }} />
                            {!isCollapsed && <span>Sign out</span>}
                        </button>
                    </div>
                </motion.aside>

                {/* Main Area */}
                <div className="main-area">
                    <div className="main-topbar">
                        <div className="topbar-breadcrumb">
                            <span>Ministry</span>
                            <div className="topbar-dot" />
                            <span className="current">
                                {navigation.find(n => n.href === location.pathname)?.name ?? 'Page'}
                            </span>
                        </div>
                        <div className="topbar-actions">
                            <span className="topbar-badge" style={{ textTransform: 'capitalize' }}>
                                {user?.role} Access
                            </span>
                        </div>
                    </div>

                    <main className="main-content">
                        <motion.div 
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="content-inner"
                        >
                            <Outlet />
                        </motion.div>
                    </main>
                </div>
            </div>
        </>
    );
};

/* Mobile sidebar — always expanded, has close button */
const MobileSidebarContents = ({
    navigation,
    location,
    onLinkClick,
    onClose,
}: {
    navigation: { name: string; href: string; icon: any; description: string }[];
    location: { pathname: string };
    onLinkClick: () => void;
    onClose: () => void;
}) => (
    <>
        <style>{`
            .mob-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 16px 18px;
                border-bottom: 1px solid rgba(255,255,255,0.06);
                position: relative;
            }
            .mob-header::after {
                content: ''; position: absolute; top: 0; left: 0; right: 0;
                height: 2px;
                background: linear-gradient(90deg, transparent, #c9a84c, transparent);
                opacity: 0.5;
            }
            .mob-brand { display: flex; align-items: center; gap: 10px; }
            .mob-brand-title { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 700; color: #f0ede8; margin: 0; }
            .mob-close {
                width: 30px; height: 30px; border-radius: 7px;
                background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
                cursor: pointer; display: flex; align-items: center; justify-content: center;
                color: var(--text-muted); transition: all 0.14s;
            }
            .mob-close:hover { background: rgba(255,255,255,0.08); color: #f0ede8; }
            .mob-nav { padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }
            .mob-nav-link {
                display: flex; align-items: center; gap: 10px;
                padding: 10px 12px; border-radius: 8px;
                text-decoration: none; color: rgba(240,237,232,0.45);
                border: 1px solid transparent; transition: all 0.15s;
            }
            .mob-nav-link:hover { background: rgba(255,255,255,0.04); color: #f0ede8; border-color: rgba(255,255,255,0.06); }
            .mob-nav-link.active { background: rgba(201,168,76,0.12); color: #c9a84c; border-color: rgba(201,168,76,0.2); }
            .mob-icon { width: 34px; height: 34px; border-radius: 7px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            .mob-nav-link.active .mob-icon { background: rgba(201,168,76,0.15); }
            .mob-name { font-size: 13.5px; font-weight: 500; display: block; line-height: 1; margin-bottom: 2px; }
            .mob-desc { font-size: 11px; opacity: 0.55; line-height: 1; }
            .mob-footer { padding: 16px 18px; margin-top: auto; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: rgba(240,237,232,0.3); letter-spacing: 0.05em; }
        `}</style>

        <div className="mob-header">
            <div className="mob-brand">
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Music size={16} color="#c9a84c" />
                </div>
                <p className="mob-brand-title">Worship Ministry</p>
            </div>
            <button className="mob-close" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="mob-nav">
            {navigation.map(item => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                    <Link key={item.name} to={item.href} className={`mob-nav-link${isActive ? ' active' : ''}`} onClick={onLinkClick}>
                        <div className="mob-icon">
                            <Icon size={16} color={isActive ? '#c9a84c' : 'var(--text-muted)'} />
                        </div>
                        <div>
                            <span className="mob-name">{item.name}</span>
                            <span className="mob-desc">{item.description}</span>
                        </div>
                    </Link>
                );
            })}
        </div>

        <div className="mob-footer">© 2025 Church Music Suite</div>
    </>
);

export default Layout;
