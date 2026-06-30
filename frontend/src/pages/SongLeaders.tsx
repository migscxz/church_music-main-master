import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Pencil, Trash2, Plus, X, Users, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SongLeader {
    id: number;
    name: string;
}

const SongLeaders = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLeader, setEditingLeader] = useState<SongLeader | null>(null);
    const [name, setName] = useState('');
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // React Query Hooks
    const { data: leaders = [], isLoading: loadingLeaders } = useQuery<SongLeader[]>({
        queryKey: ['song-leaders'],
        queryFn: () => api.get('/song-leaders').then(res => res.data)
    });

    const saveMutation = useMutation({
        mutationFn: async (payload: { name: string }) => {
            if (editingLeader) {
                return api.put(`/song-leaders/${editingLeader.id}`, payload);
            } else {
                return api.post('/song-leaders', payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['song-leaders'] });
            queryClient.invalidateQueries({ queryKey: ['songs'] });
            setIsModalOpen(false);
            setName('');
            setEditingLeader(null);
        },
        onError: (error) => console.error('Error saving leader:', error)
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/song-leaders/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['song-leaders'] });
            queryClient.invalidateQueries({ queryKey: ['songs'] });
        },
        onError: (error) => console.error('Error deleting leader:', error)
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate({ name });
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this leader?')) {
            deleteMutation.mutate(id);
        }
    };

    const openEditModal = (leader: SongLeader) => { setEditingLeader(leader); setName(leader.name); setIsModalOpen(true); };
    const openCreateModal = () => { setEditingLeader(null); setName(''); setIsModalOpen(true); };

    if (loadingLeaders) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
            <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} 
            />
            <span style={{ fontFamily: "'DM Sans', sans-serif", color: '#888', fontSize: 14 }}>Loading…</span>
        </div>
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 10 },
        show: { opacity: 1, scale: 1, y: 0 }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

                .sl-page * { box-sizing: border-box; }
                .sl-page { font-family: 'DM Sans', sans-serif; color: #1a1814; }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .page-title-wrap h1 {
                    font-family: 'Cormorant Garamond', Georgia, serif;
                    font-size: 34px;
                    font-weight: 700;
                    color: #0f1117;
                    margin: 0 0 4px 0;
                    letter-spacing: -0.01em;
                }

                .page-title-wrap p {
                    font-size: 13.5px;
                    color: #8a8680;
                    margin: 0;
                }

                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    background: var(--bg-surface);
                    color: var(--text-primary);
                    border: none;
                    border-radius: 10px;
                    padding: 10px 18px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13.5px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.15s, transform 0.1s;
                    white-space: nowrap;
                    position: relative;
                    overflow: hidden;
                }

                .btn-primary::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(201,168,76,0.18), transparent 60%);
                    pointer-events: none;
                }

                .btn-primary:hover { background: #1e2130; transform: translateY(-1px); }

                /* ── LEADERS GRID ── */
                .leaders-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    gap: 14px;
                }

                .leader-card {
                    background: var(--bg-card);
                    border-radius: 13px;
                    border: 1.5px solid #ede9e4;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    transition: border-color 0.15s, box-shadow 0.15s;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                }

                .leader-card:hover {
                    border-color: rgba(201,168,76,0.3);
                    box-shadow: 0 4px 16px rgba(201,168,76,0.08);
                }

                .leader-avatar {
                    width: 46px; height: 46px;
                    border-radius: 50%;
                    background: var(--bg-surface);
                    border: 2px solid rgba(201,168,76,0.2);
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }

                .leader-name {
                    font-size: 15.5px;
                    font-weight: 600;
                    color: #1a1814;
                    flex: 1;
                    margin: 0;
                }

                .leader-actions {
                    display: flex;
                    gap: 4px;
                    flex-shrink: 0;
                }

                .icon-btn {
                    width: 32px; height: 32px;
                    border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    border: 1.5px solid transparent;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.14s;
                    color: #b0aba5;
                }

                .icon-btn-edit:hover { background: rgba(201,168,76,0.1); border-color: rgba(201,168,76,0.25); color: #8a6d2f; }
                .icon-btn-delete:hover { background: rgba(220,60,60,0.08); border-color: rgba(220,60,60,0.2); color: #c53030; }

                /* ── EMPTY ── */
                .leaders-empty {
                    grid-column: 1 / -1;
                    background: var(--bg-card-alt);
                    border: 2px dashed  var(--border-color);
                    border-radius: 14px;
                    padding: 60px 24px;
                    text-align: center;
                }

                .empty-icon {
                    width: 56px; height: 56px;
                    border-radius: 14px;
                    background: #f2eeea;
                    border: 1.5px solid  var(--border-color);
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 16px;
                }

                .leaders-empty h3 {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 22px;
                    font-weight: 600;
                    color: #1a1814;
                    margin: 0 0 6px 0;
                }

                .leaders-empty p { font-size: 13.5px; color: var(--text-muted); margin: 0; }

                /* ── COUNT BAR ── */
                .count-bar { margin-bottom: 14px; padding-left: 2px; }
                .count-text { font-size: 12.5px; color: #9a9590; font-weight: 500; letter-spacing: 0.02em; }
                .count-accent { color: var(--accent); font-weight: 600; }

                /* ── MODAL ── */
                .modal-overlay {
                    position: fixed; inset: 0;
                    background: rgba(15,17,23,0.72);
                    backdrop-filter: blur(6px);
                    display: flex; align-items: center; justify-content: center;
                    padding: 24px; z-index: 50;
                }

                .modal-card {
                    background: var(--bg-card);
                    border-radius: 18px;
                    width: 100%; max-width: 420px;
                    overflow: hidden;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.22);
                }

                .modal-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid #f0ece8;
                    background: var(--bg-card-alt);
                }

                .modal-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 22px; font-weight: 700;
                    color: #0f1117; margin: 0;
                }

                .modal-close {
                    width: 32px; height: 32px;
                    border-radius: 8px;
                    border: 1.5px solid  var(--border-color);
                    background: var(--bg-card);
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: #9a9590; transition: all 0.14s;
                }

                .modal-close:hover { background: #f0ece8; color: #1a1814; }

                .modal-body { padding: 24px; }

                .form-label {
                    display: block;
                    font-size: 11.5px; font-weight: 700;
                    color: #5a5550; margin-bottom: 7px;
                    letter-spacing: 0.06em; text-transform: uppercase;
                }

                .form-input {
                    width: 100%;
                    border: 1.5px solid  var(--border-color);
                    border-radius: 10px;
                    padding: 11px 14px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px; color: #1a1814;
                    outline: none; background: var(--bg-card);
                    transition: border-color 0.15s, box-shadow 0.15s;
                }

                .form-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--active-bg); }
                .form-input::placeholder { color: #c0bbb5; }

                .modal-footer {
                    display: flex; justify-content: flex-end; gap: 10px;
                    padding: 16px 24px;
                    border-top: 1px solid #f0ece8;
                    background: var(--bg-card-alt);
                }

                .btn-ghost {
                    padding: 9px 18px; border-radius: 10px;
                    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500;
                    background: #ede9e4; color: #5a5550;
                    border: none; cursor: pointer; transition: background 0.14s;
                }

                .btn-ghost:hover { background: #e0dbd4; }

                .btn-submit {
                    padding: 9px 20px; border-radius: 10px;
                    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500;
                    background: var(--bg-surface); color: var(--text-primary);
                    border: none; cursor: pointer; transition: background 0.14s;
                    position: relative; overflow: hidden;
                }

                .btn-submit::after {
                    content: '';
                    position: absolute; inset: 0;
                    background: linear-gradient(135deg, rgba(201,168,76,0.2), transparent 60%);
                    pointer-events: none;
                }

                .btn-submit:hover { background: #1e2130; }
            `}</style>

            <div className="sl-page">
                <div className="page-header">
                    <div className="page-title-wrap">
                        <h1>Song Leaders</h1>
                        <p>Manage song leaders and their personalized song versions</p>
                    </div>
                    {isAdmin && (
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={openCreateModal} 
                            className="btn-primary"
                        >
                            <Plus size={16} /> Add Leader
                        </motion.button>
                    )}
                </div>

                <div className="count-bar">
                    <span className="count-text">
                        <span className="count-accent">{leaders.length}</span> leader{leaders.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <AnimatePresence mode="popLayout">
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        key="leaders-grid"
                        className="leaders-grid"
                    >
                        {leaders.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="leaders-empty"
                            >
                                <div className="empty-icon"><Users size={22} color="#c0bbb5" /></div>
                                <h3>No leaders yet</h3>
                                <p>Add a song leader to start creating personalized song versions.</p>
                            </motion.div>
                        ) : leaders.map(leader => (
                            <motion.div 
                                key={leader.id} 
                                variants={itemVariants}
                                layout
                                className="leader-card"
                            >
                                <div className="leader-avatar">
                                    <User size={18} color="var(--accent)" />
                                </div>
                                <p className="leader-name">{leader.name}</p>
                                {isAdmin && (
                                    <div className="leader-actions">
                                        <motion.button 
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => openEditModal(leader)} 
                                            className="icon-btn icon-btn-edit" 
                                            title="Edit"
                                        >
                                            <Pencil size={14} />
                                        </motion.button>
                                        <motion.button 
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleDelete(leader.id)} 
                                            className="icon-btn icon-btn-delete" 
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </motion.button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="modal-card"
                        >
                            <div className="modal-header">
                                <h2 className="modal-title">{editingLeader ? 'Edit Leader' : 'Add New Leader'}</h2>
                                <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={16} /></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <label htmlFor="name" className="form-label">Name</label>
                                    <input
                                        type="text" id="name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="form-input"
                                        placeholder="e.g. John Dela Cruz"
                                        autoFocus required
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                                    <button type="submit" className="btn-submit">{editingLeader ? 'Save Changes' : 'Create Leader'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SongLeaders;
