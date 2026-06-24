import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { Pencil, Trash2, Plus, X, Calendar, ListMusic, Check, ChevronDown, ChevronRight, Youtube, HardDrive, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SongLeader { id: number; name: string; }
interface Song { id: number; title: string; original_key?: string; }
interface SongVersion {
    id: number;
    key: string;
    song?: Song;
    leader?: SongLeader;
    chords?: string;
    tempo?: string;
    notes?: string;
    youtube_link?: string;
    drive_link?: string;
    chord_reference?: string;
}
interface Setlist { id: number; title: string; date: string | null; song_versions?: SongVersion[]; }

const Setlists = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSetlist, setEditingSetlist] = useState<Setlist | null>(null);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [selectedVersionIds, setSelectedVersionIds] = useState<number[]>([]);
    const [leaderFilter, setLeaderFilter] = useState<string>('All');

    // Track which version is currently expanded. Map: setlistId -> versionId
    const [expandedVersions, setExpandedVersions] = useState<Record<number, number>>({});

    // React Query Hooks
    const { data: setlists = [], isLoading: loadingSetlists } = useQuery<Setlist[]>({
        queryKey: ['setlists'],
        queryFn: () => api.get('/setlists').then(res => res.data)
    });

    const { data: availableVersions = [] } = useQuery<SongVersion[]>({
        queryKey: ['song-versions'],
        queryFn: () => api.get('/song-versions').then(res => res.data)
    });

    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editingSetlist) {
                return api.put(`/setlists/${editingSetlist.id}`, payload);
            } else {
                return api.post('/setlists', payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['setlists'] });
            setIsModalOpen(false);
        },
        onError: (error) => console.error('Error saving setlist:', error)
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/setlists/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['setlists'] }),
        onError: (error) => console.error('Error deleting setlist:', error)
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate({ title, date: date || null, song_version_ids: selectedVersionIds });
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this setlist?')) {
            deleteMutation.mutate(id);
        }
    };

    const openCreateModal = () => {
        setEditingSetlist(null); setTitle(''); setDate(''); setSelectedVersionIds([]); setLeaderFilter('All'); setIsModalOpen(true);
    };

    const openEditModal = (setlist: Setlist) => {
        setEditingSetlist(setlist);
        setTitle(setlist.title);
        setDate(setlist.date ? setlist.date.split('T')[0] : '');
        const rel = (setlist as any).song_versions || (setlist as any).songVersions || [];
        setSelectedVersionIds(rel.map((v: any) => v.id));
        setLeaderFilter('All');
        setIsModalOpen(true);
    };

    const toggleVersion = (id: number) => {
        setSelectedVersionIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
    };

    const toggleExpand = (setlistId: number, versionId: number) => {
        setExpandedVersions(prev => ({
            ...prev,
            [setlistId]: prev[setlistId] === versionId ? 0 : versionId
        }));
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (loadingSetlists) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
            <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#c9a84c' }} 
            />
            <span style={{ fontFamily: "'DM Sans', sans-serif", color: '#888', fontSize: 14 }}>Loading setlists…</span>
        </div>
    );

    const uniqueLeaders = Array.from(new Set(availableVersions.filter(v => v.leader).map(v => v.leader!.name))).sort();
    const filteredVersions = leaderFilter === 'All'
        ? availableVersions
        : availableVersions.filter(v => v.leader?.name === leaderFilter);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

                .sl-page * { box-sizing: border-box; }
                .sl-page { font-family: 'DM Sans', sans-serif; color: #1a1814; }

                .page-header {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    margin-bottom: 32px; flex-wrap: wrap; gap: 16px;
                }

                .page-title-wrap h1 {
                    font-family: 'Cormorant Garamond', Georgia, serif;
                    font-size: 34px; font-weight: 700; color: #0f1117;
                    margin: 0 0 4px 0; letter-spacing: -0.01em;
                }

                .page-title-wrap p { font-size: 13.5px; color: #8a8680; margin: 0; }

                .btn-primary {
                    display: inline-flex; align-items: center; gap: 7px;
                    background: #0f1117; color: #f0ede8;
                    border: none; border-radius: 10px; padding: 10px 18px;
                    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500;
                    cursor: pointer; transition: background 0.15s, transform 0.1s;
                    white-space: nowrap; position: relative; overflow: hidden;
                }

                .btn-primary::after {
                    content: ''; position: absolute; inset: 0;
                    background: linear-gradient(135deg, rgba(201,168,76,0.18), transparent 60%);
                    pointer-events: none;
                }

                .btn-primary:hover { background: #1e2130; transform: translateY(-1px); }

                /* count bar */
                .count-bar { margin-bottom: 14px; padding-left: 2px; }
                .count-text { font-size: 12.5px; color: #9a9590; font-weight: 500; }
                .count-accent { color: #c9a84c; font-weight: 600; }

                /* ── GRID ── */
                .setlists-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 16px;
                }

                /* ── CARD ── */
                .setlist-card {
                    background: #fff;
                    border-radius: 14px;
                    border: 1.5px solid #ede9e4;
                    overflow: hidden;
                    display: flex; flex-direction: column;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                    transition: border-color 0.15s, box-shadow 0.15s;
                }

                .setlist-card:hover {
                    border-color: rgba(201,168,76,0.3);
                    box-shadow: 0 4px 20px rgba(201,168,76,0.08);
                }

                .card-header {
                    background: #0f1117;
                    padding: 18px 18px 16px;
                    position: relative;
                    overflow: hidden;
                }

                .card-header::before {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0;
                    height: 1.5px;
                    background: linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent);
                }

                .card-header-top {
                    display: flex; justify-content: space-between; align-items: flex-start;
                }

                .card-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 20px; font-weight: 700;
                    color: #f0ede8; margin: 0 0 6px 0; line-height: 1.15;
                    flex: 1; padding-right: 8px;
                }

                .card-header-actions { display: flex; gap: 4px; flex-shrink: 0; }

                .hdr-btn {
                    width: 28px; height: 28px;
                    border-radius: 7px; border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.06);
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    color: rgba(240,237,232,0.5); transition: all 0.14s;
                }

                .hdr-btn-edit:hover { background: rgba(201,168,76,0.18); border-color: rgba(201,168,76,0.3); color: #c9a84c; }
                .hdr-btn-delete:hover { background: rgba(220,60,60,0.15); border-color: rgba(220,60,60,0.3); color: #f87171; }

                .card-date {
                    display: inline-flex; align-items: center; gap: 5px;
                    font-size: 12px; color: rgba(201,168,76,0.7);
                    font-weight: 500; letter-spacing: 0.03em;
                }

                .card-body { padding: 18px; flex: 1; }

                .songs-label {
                    font-size: 10.5px; font-weight: 700;
                    letter-spacing: 0.12em; text-transform: uppercase;
                    color: #b0aba5; margin-bottom: 12px;
                    display: flex; align-items: center; gap: 6px;
                }

                .songs-label .badge {
                    background: #f2eeea;
                    border: 1px solid #e8e4df;
                    color: #7a7570;
                    font-size: 10px; padding: 1px 7px;
                    border-radius: 20px;
                }

                .version-item {
                    display: flex; flex-direction: column; gap: 0;
                    border-radius: 8px;
                    border: 1px solid #f0ece8;
                    margin-bottom: 7px;
                    background: #faf8f5;
                    transition: border-color 0.12s;
                    overflow: hidden;
                }

                .version-item:last-child { margin-bottom: 0; }

                .version-item:hover { border-color: rgba(201,168,76,0.3); }
                
                .version-item-header {
                    display: flex; align-items: stretch; gap: 10px;
                    padding: 9px 11px;
                    cursor: pointer;
                }

                .version-dot {
                    width: 28px; height: 28px;
                    border-radius: 5px;
                    background: transparent;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; margin-top: 1px;
                }

                .version-song { font-size: 13.5px; font-weight: 600; color: #1a1814; }
                .version-meta { font-size: 12.5px; color: #9a9590; margin-top: 2px; }
                
                .version-item-body {
                    border-top: 1px solid #f0ece8;
                    background: #fff;
                    padding: 14px;
                }
                
                .vi-links {
                    display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;
                }
                
                .vi-link-btn {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 5px 10px; border-radius: 6px;
                    background: #f7f4f0; border: 1px solid #ede9e4;
                    font-size: 11.5px; font-weight: 600; color: #6a6560;
                    text-decoration: none; transition: all 0.14s;
                }
                
                .vi-link-btn:hover { background: #fff; border-color: #c9a84c; color: #c9a84c; box-shadow: 0 2px 5px rgba(201,168,76,0.1); transform: translateY(-1px); }

                .no-songs { font-size: 13px; color: #c0bbb5; font-style: italic; }

                /* ── EMPTY ── */
                .setlists-empty {
                    grid-column: 1 / -1;
                    background: #faf8f5;
                    border: 2px dashed #e8e4df;
                    border-radius: 14px;
                    padding: 60px 24px; text-align: center;
                }

                .empty-icon {
                    width: 56px; height: 56px;
                    border-radius: 14px;
                    background: #f2eeea; border: 1.5px solid #e8e4df;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 16px;
                }

                .setlists-empty h3 {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 22px; font-weight: 600; color: #1a1814; margin: 0 0 6px 0;
                }

                .setlists-empty p { font-size: 13.5px; color: #8a8680; margin: 0; }

                /* ── MODAL ── */
                .modal-overlay {
                    position: fixed; inset: 0;
                    background: rgba(15,17,23,0.72); backdrop-filter: blur(6px);
                    display: flex; align-items: center; justify-content: center;
                    padding: 24px; z-index: 50;
                }

                .modal-card {
                    background: #fff; border-radius: 18px;
                    width: 100%; max-width: 640px; max-height: 90vh;
                    overflow: hidden; display: flex; flex-direction: column;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.22);
                }

                .modal-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 20px 24px; border-bottom: 1px solid #f0ece8; background: #faf8f5;
                }

                .modal-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 22px; font-weight: 700; color: #0f1117; margin: 0;
                }

                .modal-close {
                    width: 32px; height: 32px; border-radius: 8px;
                    border: 1.5px solid #e8e4df; background: #fff;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    color: #9a9590; transition: all 0.14s;
                }

                .modal-close:hover { background: #f0ece8; color: #1a1814; }

                .modal-body { padding: 22px 24px; overflow-y: auto; flex: 1; }

                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 22px; }

                .form-field { display: flex; flex-direction: column; }

                .form-label {
                    font-size: 11.5px; font-weight: 700; color: #5a5550;
                    margin-bottom: 7px; letter-spacing: 0.06em; text-transform: uppercase;
                }

                .form-label .req { color: #c9a84c; }

                .form-input {
                    border: 1.5px solid #e8e4df; border-radius: 10px;
                    padding: 10px 14px; font-family: 'DM Sans', sans-serif;
                    font-size: 14px; color: #1a1814; outline: none; background: #fff;
                    transition: border-color 0.15s, box-shadow 0.15s;
                }

                .form-input:focus { border-color: #c9a84c; box-shadow: 0 0 0 3px rgba(201,168,76,0.12); }
                .form-input::placeholder { color: #c0bbb5; }

                .songs-section-label {
                    font-size: 11.5px; font-weight: 700; color: #5a5550;
                    letter-spacing: 0.06em; text-transform: uppercase;
                    margin-bottom: 12px;
                }

                .versions-list {
                    max-height: 260px; overflow-y: auto;
                    display: flex; flex-direction: column; gap: 7px;
                    padding-right: 4px;
                }

                .versions-list::-webkit-scrollbar { width: 4px; }
                .versions-list::-webkit-scrollbar-track { background: #f2eeea; border-radius: 4px; }
                .versions-list::-webkit-scrollbar-thumb { background: #d8d3ce; border-radius: 4px; }

                .version-select-item {
                    display: flex; align-items: center; gap: 12px;
                    padding: 11px 13px;
                    border-radius: 10px;
                    border: 1.5px solid #ede9e4;
                    cursor: pointer;
                    transition: all 0.14s;
                    background: #fff;
                }

                .version-select-item:hover { border-color: rgba(201,168,76,0.3); background: rgba(201,168,76,0.04); }

                .version-select-item.selected { border-color: rgba(201,168,76,0.4); background: rgba(201,168,76,0.07); }

                .check-box {
                    width: 20px; height: 20px;
                    border-radius: 6px;
                    border: 1.5px solid #d8d3ce;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; transition: all 0.14s;
                    background: #fff;
                }

                .version-select-item.selected .check-box {
                    background: #0f1117; border-color: #0f1117;
                }

                .vs-song { font-size: 13.5px; font-weight: 600; color: #1a1814; }
                .vs-meta { font-size: 12px; color: #9a9590; margin-top: 1px; }

                .no-versions-msg {
                    padding: 20px; text-align: center;
                    border: 1.5px dashed #e8e4df; border-radius: 10px;
                    font-size: 13px; color: #b0aba5; font-style: italic;
                }

                .modal-footer {
                    display: flex; justify-content: flex-end; gap: 10px;
                    padding: 16px 24px; border-top: 1px solid #f0ece8; background: #faf8f5;
                }

                .btn-ghost {
                    padding: 9px 18px; border-radius: 10px;
                    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500;
                    background: #ede9e4; color: #5a5550; border: none; cursor: pointer;
                    transition: background 0.14s;
                }

                .btn-ghost:hover { background: #e0dbd4; }

                .btn-submit {
                    padding: 9px 20px; border-radius: 10px;
                    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500;
                    background: #0f1117; color: #f0ede8; border: none; cursor: pointer;
                    transition: background 0.14s; position: relative; overflow: hidden;
                }

                .btn-submit::after {
                    content: ''; position: absolute; inset: 0;
                    background: linear-gradient(135deg, rgba(201,168,76,0.2), transparent 60%);
                    pointer-events: none;
                }

                .btn-submit:hover { background: #1e2130; }

                @media (max-width: 640px) {
                    .form-grid { grid-template-columns: 1fr; }
                    .setlists-grid { grid-template-columns: 1fr; }
                }
            `}</style>

            <div className="sl-page">
                <div className="page-header">
                    <div className="page-title-wrap">
                        <h1>Practice Setlists</h1>
                        <p>Group songs together for Sunday worship sessions</p>
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={openCreateModal} 
                        className="btn-primary"
                    >
                        <Plus size={16} /> Create Setlist
                    </motion.button>
                </div>

                <div className="count-bar">
                    <span className="count-text">
                        <span className="count-accent">{setlists.length}</span> setlist{setlists.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <AnimatePresence mode="popLayout">
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="setlists-grid"
                    >
                        {setlists.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="setlists-empty"
                            >
                                <div className="empty-icon"><ListMusic size={22} color="#c0bbb5" /></div>
                                <h3>No setlists yet</h3>
                                <p>Create a setlist to organize songs for your next practice.</p>
                            </motion.div>
                        ) : setlists.map(setlist => {
                            const versions = (setlist as any).song_versions || (setlist as any).songVersions || [];
                            return (
                                <motion.div 
                                    key={setlist.id} 
                                    variants={cardVariants}
                                    layout
                                    className="setlist-card"
                                >
                                    <div className="card-header">
                                        <div className="card-header-top">
                                            <h3 className="card-title">{setlist.title}</h3>
                                            <div className="card-header-actions">
                                                <motion.button 
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => openEditModal(setlist)} 
                                                    className="hdr-btn hdr-btn-edit" 
                                                    title="Edit"
                                                >
                                                    <Pencil size={13} />
                                                </motion.button>
                                                <motion.button 
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleDelete(setlist.id)} 
                                                    className="hdr-btn hdr-btn-delete" 
                                                    title="Delete"
                                                >
                                                    <Trash2 size={13} />
                                                </motion.button>
                                            </div>
                                        </div>
                                        {setlist.date && (
                                            <span className="card-date">
                                                <Calendar size={11} /> {formatDate(setlist.date)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="card-body">
                                        <div className="songs-label">
                                            Songs <span className="badge">{versions.length}</span>
                                        </div>
                                        {versions.length > 0 ? versions.map((v: any) => {
                                            const isExpanded = expandedVersions[setlist.id] === v.id;
                                            return (
                                                <div key={v.id} className="version-item">
                                                    <div className="version-item-header" onClick={() => toggleExpand(setlist.id, v.id)}>
                                                        <motion.div 
                                                            animate={{ rotate: isExpanded ? 90 : 0 }}
                                                            className="version-dot"
                                                        >
                                                            <ChevronRight size={14} color={isExpanded ? "#6a6560" : "#b0aba5"} />
                                                        </motion.div>
                                                        <div style={{ flex: 1 }}>
                                                            <div className="version-song">{v.leader?.name} <span style={{ fontWeight: 400, color: '#9a9590' }}>—</span> {v.song?.title}</div>
                                                            <div className="version-meta">Key of {v.key} {v.tempo && `· ${v.tempo}`}</div>
                                                        </div>
                                                    </div>
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div 
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="version-item-body"
                                                            >
                                                                {(v.youtube_link || v.drive_link || v.chord_reference) ? (
                                                                    <div className="vi-links">
                                                                        {v.youtube_link && (
                                                                            <motion.a whileHover={{ y: -2 }} href={v.youtube_link} target="_blank" rel="noopener noreferrer" className="vi-link-btn">
                                                                                <Youtube size={13} color="#e52d27" /> YouTube
                                                                            </motion.a>
                                                                        )}
                                                                        {v.drive_link && (
                                                                            <motion.a whileHover={{ y: -2 }} href={v.drive_link} target="_blank" rel="noopener noreferrer" className="vi-link-btn">
                                                                                <HardDrive size={13} color="#0F9D58" /> Google Drive
                                                                            </motion.a>
                                                                        )}
                                                                        {v.chord_reference && (
                                                                            <motion.a whileHover={{ y: -2 }} href={v.chord_reference} target="_blank" rel="noopener noreferrer" className="vi-link-btn">
                                                                                <ExternalLink size={13} /> Chords
                                                                            </motion.a>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="no-songs" style={{ margin: 0 }}>No reference links available.</p>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )
                                        }) : (
                                            <p className="no-songs">No songs added yet.</p>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="modal-card"
                        >
                            <div className="modal-header">
                                <h2 className="modal-title">{editingSetlist ? 'Edit Setlist' : 'Create New Setlist'}</h2>
                                <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={16} /></button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
                                <div className="modal-body">
                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label className="form-label">Setlist Title <span className="req">*</span></label>
                                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="form-input" placeholder="e.g. Sunday Worship AM" required />
                                        </div>
                                        <div className="form-field">
                                            <label className="form-label">Date <span style={{ color: '#b0aba5', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" />
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                                            <p className="songs-section-label" style={{ marginBottom: 0 }}>Select Song Versions</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <label style={{ fontSize: '12px', color: '#8a8680', fontWeight: 500 }}>Filter by Leader:</label>
                                                <div style={{ position: 'relative' }}>
                                                    <select
                                                        value={leaderFilter}
                                                        onChange={e => setLeaderFilter(e.target.value)}
                                                        className="form-input"
                                                        style={{ padding: '4px 28px 4px 10px', fontSize: '13px', minHeight: 'auto', appearance: 'none', background: '#f7f4f0', borderColor: '#e8e4df' }}
                                                    >
                                                        <option value="All">All Leaders</option>
                                                        {uniqueLeaders.map(name => (
                                                            <option key={name} value={name}>{name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={12} color="#8a8680" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="versions-list">
                                            {filteredVersions.length === 0 ? (
                                                <div className="no-versions-msg">
                                                    {leaderFilter === 'All' ? 'No song versions exist yet. Add songs and leader versions first.' : `No songs found for leader: ${leaderFilter}`}
                                                </div>
                                            ) : filteredVersions.map(v => {
                                                const isSelected = selectedVersionIds.includes(v.id);
                                                return (
                                                    <motion.div 
                                                        whileHover={{ x: 4 }}
                                                        key={v.id} 
                                                        className={`version-select-item ${isSelected ? 'selected' : ''}`} 
                                                        onClick={() => toggleVersion(v.id)}
                                                    >
                                                        <div className="check-box">
                                                            {isSelected && <Check size={12} color="#c9a84c" strokeWidth={2.5} />}
                                                        </div>
                                                        <div>
                                                            <div className="vs-song">{v.song?.title}</div>
                                                            <div className="vs-meta">{v.leader?.name} · Key of {v.key}</div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                                    <button type="submit" className="btn-submit">{editingSetlist ? 'Save Changes' : 'Create Setlist'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Setlists;