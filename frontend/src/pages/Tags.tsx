import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Pencil, Plus, X, Tag as TagIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tag { id: number; name: string; }

const TAG_TINTS = [
    { bg: 'rgba(201,168,76,0.10)', border: 'rgba(201,168,76,0.25)', color: '#8a6d2f' },
    { bg: 'rgba(100,140,110,0.10)', border: 'rgba(100,140,110,0.25)', color: '#3a6b4a' },
    { bg: 'rgba(120,100,180,0.10)', border: 'rgba(120,100,180,0.25)', color: '#5a4a8a' },
    { bg: 'rgba(200,90,70,0.10)', border: 'rgba(200,90,70,0.25)', color: '#8a3a2a' },
    { bg: 'rgba(60,130,180,0.10)', border: 'rgba(60,130,180,0.25)', color: '#2a5a7a' },
];

const getTint = (id: number) => TAG_TINTS[id % TAG_TINTS.length];

const Tags = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [name, setName] = useState('');
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // React Query Hooks
    const { data: tags = [], isLoading: loadingTags } = useQuery<Tag[]>({
        queryKey: ['tags'],
        queryFn: () => api.get('/tags').then(res => res.data)
    });

    const saveMutation = useMutation({
        mutationFn: async (payload: { name: string }) => {
            if (editingTag) {
                return api.put(`/tags/${editingTag.id}`, payload);
            } else {
                return api.post('/tags', payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            setIsModalOpen(false);
            setName('');
            setEditingTag(null);
        },
        onError: (error) => {
            console.error('Error saving tag:', error);
            alert('Error saving tag. Make sure the name is unique.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/tags/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
        onError: (error) => console.error('Error deleting tag:', error)
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate({ name });
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this tag?')) {
            deleteMutation.mutate(id);
        }
    };

    const openEditModal = (tag: Tag) => { setEditingTag(tag); setName(tag.name); setIsModalOpen(true); };
    const openCreateModal = () => { setEditingTag(null); setName(''); setIsModalOpen(true); };

    if (loadingTags) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
            <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#c9a84c' }} 
            />
            <span style={{ fontFamily: "'DM Sans', sans-serif", color: '#888', fontSize: 14 }}>Loading categories…</span>
        </div>
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.03 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        show: { opacity: 1, scale: 1 }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

                .tags-page * { box-sizing: border-box; }
                .tags-page { font-family: 'DM Sans', sans-serif; color: #1a1814; }

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

                /* count */
                .count-bar { margin-bottom: 14px; padding-left: 2px; }
                .count-text { font-size: 12.5px; color: #9a9590; font-weight: 500; }
                .count-accent { color: #c9a84c; font-weight: 600; }

                /* ── TAGS CLOUD ── */
                .tags-container {
                    background: #fff;
                    border-radius: 14px;
                    border: 1.5px solid #ede9e4;
                    padding: 24px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                    max-width: 760px;
                }

                .tags-cloud {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .tag-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 7px 12px 7px 10px;
                    border-radius: 22px;
                    border-width: 1.5px;
                    border-style: solid;
                    font-size: 13.5px;
                    font-weight: 600;
                    cursor: default;
                    transition: box-shadow 0.15s, transform 0.12s;
                    position: relative;
                }

                .tag-chip-icon {
                    width: 18px; height: 18px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(0,0,0,0.08);
                    flex-shrink: 0;
                }

                .tag-chip-name { letter-spacing: 0.01em; }

                .tag-chip-actions {
                    display: flex;
                    gap: 2px;
                    margin-left: 4px;
                    transition: opacity 0.15s;
                }

                .chip-btn {
                    width: 20px; height: 20px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    border: none; background: rgba(0,0,0,0.1);
                    cursor: pointer; transition: background 0.12s;
                    padding: 0;
                }

                .chip-btn:hover { background: rgba(0,0,0,0.2); }

                /* ── EMPTY ── */
                .tags-empty {
                    text-align: center; padding: 40px 24px;
                }

                .empty-icon {
                    width: 52px; height: 52px;
                    border-radius: 14px;
                    background: #f2eeea; border: 1.5px solid #e8e4df;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 14px;
                }

                .tags-empty h3 {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 21px; font-weight: 600; color: #1a1814; margin: 0 0 5px 0;
                }

                .tags-empty p { font-size: 13.5px; color: #8a8680; margin: 0; }

                /* ── MODAL ── */
                .modal-overlay {
                    position: fixed; inset: 0;
                    background: rgba(15,17,23,0.72); backdrop-filter: blur(6px);
                    display: flex; align-items: center; justify-content: center;
                    padding: 24px; z-index: 50;
                }

                .modal-card {
                    background: #fff; border-radius: 18px;
                    width: 100%; max-width: 400px; overflow: hidden;
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

                .modal-body { padding: 24px; }

                .form-label {
                    display: block; font-size: 11.5px; font-weight: 700;
                    color: #5a5550; margin-bottom: 7px;
                    letter-spacing: 0.06em; text-transform: uppercase;
                }

                .form-input {
                    width: 100%; border: 1.5px solid #e8e4df; border-radius: 10px;
                    padding: 11px 14px; font-family: 'DM Sans', sans-serif;
                    font-size: 14px; color: #1a1814; outline: none; background: #fff;
                    transition: border-color 0.15s, box-shadow 0.15s;
                }

                .form-input:focus { border-color: #c9a84c; box-shadow: 0 0 0 3px rgba(201,168,76,0.12); }
                .form-input::placeholder { color: #c0bbb5; }

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
            `}</style>

            <div className="tags-page">
                <div className="page-header">
                    <div className="page-title-wrap">
                        <h1>Categories</h1>
                        <p>Group songs by topic, mood, or occasion (e.g., Healing, Salvation)</p>
                    </div>
                    {isAdmin && (
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={openCreateModal} 
                            className="btn-primary"
                        >
                            <Plus size={16} /> Add Category
                        </motion.button>
                    )}
                </div>

                <div className="count-bar">
                    <span className="count-text">
                        <span className="count-accent">{tags.length}</span> categor{tags.length !== 1 ? 'ies' : 'y'}
                    </span>
                </div>

                <div className="tags-container">
                    {tags.length === 0 ? (
                        <div className="tags-empty">
                            <div className="empty-icon"><TagIcon size={22} color="#c0bbb5" /></div>
                            <h3>No categories yet</h3>
                            <p>Add categories like "Healing", "Salvation", or "Upbeat" to organize your songs.</p>
                        </div>
                    ) : (
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="tags-cloud"
                        >
                            <AnimatePresence mode="popLayout">
                                {tags.map(tag => {
                                    const tint = getTint(tag.id);
                                    return (
                                        <motion.div
                                            key={tag.id}
                                            variants={itemVariants}
                                            layout
                                            className="tag-chip"
                                            style={{ background: tint.bg, borderColor: tint.border, color: tint.color }}
                                            whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        >
                                            <div className="tag-chip-icon">
                                                <TagIcon size={10} color={tint.color} />
                                            </div>
                                            <span className="tag-chip-name">{tag.name}</span>
                                            {isAdmin && (
                                                <motion.div 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="tag-chip-actions"
                                                >
                                                    <button
                                                        className="chip-btn"
                                                        onClick={() => openEditModal(tag)}
                                                        title="Edit"
                                                        style={{ color: tint.color }}
                                                    >
                                                        <Pencil size={10} />
                                                    </button>
                                                    <button
                                                        className="chip-btn"
                                                        onClick={() => handleDelete(tag.id)}
                                                        title="Delete"
                                                        style={{ color: tint.color }}
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
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
                                <h2 className="modal-title">{editingTag ? 'Edit Category' : 'Add New Category'}</h2>
                                <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={16} /></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <label htmlFor="tagname" className="form-label">Category Name</label>
                                    <input
                                        type="text" id="tagname"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="form-input"
                                        placeholder="e.g. Healing, Salvation, Upbeat"
                                        autoFocus required
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                                    <button type="submit" className="btn-submit">{editingTag ? 'Save Changes' : 'Create Category'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Tags;