import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Trash2, Pencil, Search, Plus, Music, X, ArrowDownToLine, ChevronDown } from 'lucide-react';
import Preloader from '../components/Preloader';
import { motion, AnimatePresence } from 'framer-motion';

interface Tag {
    id: number;
    name: string;
}

interface Song {
    id: number;
    title: string;
    original_artist: string | null;
    original_key: string | null;
    original_capo?: number;
    user_id?: number;
    tags?: Tag[];
    versions?: any[];
}



const Songs = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSong, setEditingSong] = useState<Song | null>(null);
    const { user } = useAuth();
    const canCreate = user?.role === 'admin' || user?.role === 'leader' || user?.role === 'pianist';

    const [title, setTitle] = useState('');
    const [originalArtist, setOriginalArtist] = useState('');
    const [showArtistSuggestions, setShowArtistSuggestions] = useState(false);
    const [originalKey, setOriginalKey] = useState('');
    const [originalCapo, setOriginalCapo] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [leaderFilter, setLeaderFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [assignedOwnerId, setAssignedOwnerId] = useState('');
    const [expandedSongId, setExpandedSongId] = useState<number | null>(null);

    // Quick Add Version State
    const [quickAddingId, setQuickAddingId] = useState<number | null>(null); // tracks which song is being quick-added
    const [quickAddDoneId, setQuickAddDoneId] = useState<number | null>(null); // tracks success

    // Auto-add version when creating new song (for leaders)
    const [autoAddVersion, setAutoAddVersion] = useState(true);

    const musicalKeys = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

    // React Query Hooks
    const { data: songs = [], isLoading: loadingSongs } = useQuery<Song[]>({
        queryKey: ['songs'],
        queryFn: () => api.get('/songs').then(res => res.data)
    });

    const uniqueArtists = useMemo(() => {
        const artists = new Set(songs.map(s => s.original_artist).filter(Boolean));
        return Array.from(artists).sort() as string[];
    }, [songs]);

    const { data: leadersFilterData = [] } = useQuery<any[]>({
        queryKey: ['song-leaders'],
        queryFn: () => api.get('/song-leaders').then(res => res.data)
    });

    const { data: allCategories = [] } = useQuery<Tag[]>({
        queryKey: ['tags'],
        queryFn: () => api.get('/tags').then(res => res.data)
    });



    const toggleExpand = (id: number) => {
        setExpandedSongId(prev => prev === id ? null : id);
    };

    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editingSong) {
                return api.put(`/songs/${editingSong.id}`, payload);
            } else {
                return api.post('/songs', payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['songs'] });
            setIsModalOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            console.error('Error saving song:', error);
            if (error.response?.status === 422 && error.response.data?.errors?.title) {
                alert('This exact song (Title + Artist) already exists in the catalog!');
            } else {
                alert('An error occurred while saving the song.');
            }
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/songs/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['songs'] }),
        onError: (error) => console.error('Error deleting song:', error)
    });

    const quickAddMutation = useMutation({
        mutationFn: (payload: any) => api.post('/song-versions', payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['songs'] });
            setQuickAddingId(null);
            setQuickAddDoneId(variables.song_id);
            setTimeout(() => setQuickAddDoneId(null), 3000);
        },
        onError: (error: any) => {
            setQuickAddingId(null);
            const msg = error.response?.data?.message || 'An error occurred while adding this song to your list.';
            alert(msg);
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: any = {
            title,
            original_artist: originalArtist || null,
            original_key: originalKey || null,
            original_capo: originalCapo,
            tags: selectedCategories
        };

        // When an admin or pianist adds a song and explicitly selects a song leader owner:
        if ((user?.role === 'admin' || user?.role === 'pianist') && !editingSong && assignedOwnerId) {
            payload.song_leader_id = parseInt(assignedOwnerId);
        }

        if (editingSong) {
            saveMutation.mutate(payload);
        } else {
            // If leader wants to auto-add their version, create song first, then version
            try {
                const res = await api.post('/songs', payload);
                const newSong = res.data;
                queryClient.invalidateQueries({ queryKey: ['songs'] });
                setIsModalOpen(false);
                resetForm();

                // Auto-link: create a version with Unknown key for the leader
                if (autoAddVersion && user?.role === 'leader' && myLeaderProfile) {
                    quickAddMutation.mutate({
                        song_id: newSong.id,
                        song_leader_id: myLeaderProfile.id,
                        key: null,
                    });
                } else if (autoAddVersion && (user?.role === 'admin' || user?.role === 'pianist') && assignedOwnerId) {
                    quickAddMutation.mutate({
                        song_id: newSong.id,
                        song_leader_id: parseInt(assignedOwnerId),
                        key: null,
                    });
                }
            } catch (error: any) {
                if (error.response?.status === 422 && error.response.data?.errors?.title) {
                    alert('This exact song (Title + Artist) already exists in the catalog!');
                } else {
                    alert('An error occurred while saving the song.');
                }
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this song?')) {
            deleteMutation.mutate(id);
        }
    };

    const resetForm = () => {
        setTitle('');
        setOriginalArtist('');
        setOriginalKey('');
        setOriginalCapo(0);
        setAssignedOwnerId('');
        setSelectedCategories([]);
        setEditingSong(null);
    };

    const handleQuickAdd = (song: Song) => {
        if (!myLeaderProfile) return;
        // Already has their version? Skip
        const alreadyAdded = song.versions?.some(v => v.song_leader_id === myLeaderProfile.id);
        if (alreadyAdded) {
            alert('You already have this song in your list!');
            return;
        }
        setQuickAddingId(song.id);
        quickAddMutation.mutate({
            song_id: song.id,
            song_leader_id: myLeaderProfile.id,
            key: null,
        });
    };

    const openEditModal = (song: Song) => {
        setEditingSong(song);
        setTitle(song.title);
        setOriginalArtist(song.original_artist || '');
        setOriginalKey(song.original_key || '');
        setOriginalCapo(song.original_capo || 0);
        setSelectedCategories(song.tags ? song.tags.map(t => t.id) : []);
        setIsModalOpen(true);
    };

    const openCreateModal = () => { 
        resetForm(); 
        setAutoAddVersion(true);
        setIsModalOpen(true); 
    };

    const myLeaderProfile = useMemo(() => {
        if (!user || user.role === 'member') return null;
        return leadersFilterData.find(l => l.user_id === user.id) || null;
    }, [user, leadersFilterData]);

    const filteredSongs = useMemo(() => {
        return songs.filter(s => {
            const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.original_artist && s.original_artist.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesLeader = leaderFilter === '' ||
                (s.versions && s.versions.some(v => v.song_leader_id.toString() === leaderFilter));
            const matchesCategory = categoryFilter === '' ||
                (s.tags && s.tags.some(t => t.id.toString() === categoryFilter));
            return matchesSearch && matchesLeader && matchesCategory;
        });
    }, [songs, searchQuery, leaderFilter, categoryFilter]);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    if (loadingSongs) return (
        <div style={{ position: 'relative', height: 400, borderRadius: 14, overflow: 'hidden' }}>
            <Preloader text="Loading songs..." fullScreen={false} />
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
                .songs-page { font-family: 'DM Sans', sans-serif; color: #1a1814; }
                .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; flex-wrap: wrap; gap: 20px; }
                .page-title-wrap h1 { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 700; color: #0f1117; margin: 0; }
                .header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
                .control-select { border: 1.5px solid #e8e4df; border-radius: 10px; padding: 9px 14px; font-size: 13.5px; background: #fff; cursor: pointer; min-width: 140px; }
                .search-wrap { position: relative; }
                .search-input { border: 1.5px solid #e8e4df; border-radius: 10px; padding: 9px 14px 9px 38px; font-size: 13.5px; width: 220px; }
                .btn-primary { display: inline-flex; align-items: center; gap: 7px; background: #0f1117; color: #f0ede8; border: none; border-radius: 10px; padding: 9px 18px; font-size: 13.5px; font-weight: 500; cursor: pointer; }
                .songs-list { background: #fff; border-radius: 14px; border: 1.5px solid #ede9e4; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
                .song-row { border-bottom: 1px solid #f2eeea; }
                .song-row-header { display: flex; align-items: center; padding: 16px; cursor: pointer; gap: 14px; }
                .song-icon-wrap { width: 42px; height: 42px; border-radius: 10px; background: #f7f4f0; display: flex; align-items: center; justify-content: center; }
                .song-title { font-size: 15px; font-weight: 600; margin: 0; }
                .song-artist { font-size: 12.5px; color: #9a9590; margin: 0; }
                .song-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
                .meta-badge { font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
                .meta-badge-neutral { background: #f2eeea; color: #6a6560; }
                .meta-badge-accent { background: rgba(201,168,76,0.1); color: #8a6d2f; border: 1px solid rgba(201,168,76,0.2); }
                .song-row-body { padding: 0 16px 16px 72px; }
                .icon-btn { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1.5px solid transparent; background: transparent; cursor: pointer; color: #b0aba5; transition: all 0.2s; }
                .icon-btn-edit:hover { background: rgba(201,168,76,0.1); color: #8a6d2f; }
                .icon-btn-delete:hover { background: rgba(220,60,60,0.08); color: #c53030; }
                .modal-overlay { position: fixed; inset: 0; background: rgba(15,17,23,0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 50; }
                .modal-card { background: #fff; border-radius: 18px; width: 100%; max-width: 440px; overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,0.2); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f0ece8; background: #faf8f5; }
                .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; margin: 0; }
                .modal-close { border: 1.5px solid #e8e4df; background: #fff; cursor: pointer; border-radius: 8px; padding: 4px; display: flex; align-items: center; justify-content: center; }
                .modal-body { padding: 24px; max-height: 70vh; overflow-y: auto; }
                .form-field { margin-bottom: 18px; }
                .form-label { display: block; font-size: 12.5px; font-weight: 600; color: #5a5550; margin-bottom: 7px; text-transform: uppercase; }
                .form-input { width: 100%; border: 1.5px solid #e8e4df; border-radius: 10px; padding: 11px 14px; font-size: 14px; outline: none; transition: border-color 0.2s; }
                .form-input:focus { border-color: #c9a84c; }
                .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #f0ece8; background: #faf8f5; }
                .btn-ghost { background: transparent; border: none; color: #6a6560; font-weight: 600; cursor: pointer; padding: 9px 18px; border-radius: 10px; transition: background 0.2s; }
                .btn-ghost:hover { background: #f2eeea; }
                .btn-submit { background: #0f1117; color: #f0ede8; border: none; font-weight: 600; cursor: pointer; padding: 9px 18px; border-radius: 10px; transition: background 0.2s; }
                .btn-submit:hover { background: #1a1a1a; }
                .cat-checkboxes { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
                .cat-check-lbl { display: inline-flex; align-items: center; gap: 5px; background: #fdfdfc; border: 1.5px solid #e8e4df; border-radius: 8px; padding: 6px 10px; font-size: 13px; cursor: pointer; transition: border-color 0.2s; }
            `}</style>

            <div className="songs-page">
                <div className="page-header">
                    <div className="page-title-wrap">
                        <h1>Songs Library</h1>
                        <p style={{ color: '#8a8680', fontSize: '13.5px' }}>Manage and browse your core song catalog</p>
                    </div>

                    <div className="header-actions">
                        <select value={leaderFilter} onChange={e => setLeaderFilter(e.target.value)} className="control-select">
                            <option value="">All Leaders</option>
                            {leadersFilterData.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="control-select">
                            <option value="">All Categories</option>
                            {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="search-wrap">
                            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#b0aba5' }} />
                            <input type="text" placeholder="Search songs…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="search-input" />
                        </div>
                        {canCreate && (
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openCreateModal} className="btn-primary">
                                <Plus size={16} /> <span>Add Song</span>
                            </motion.button>
                        )}
                    </div>
                </div>

                <div className="songs-list">
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            key="songs-list-container"
                        >
                            {filteredSongs.length === 0 ? (
                                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                                    <Music size={40} color="#e8e4df" style={{ marginBottom: 16 }} />
                                    <h3 style={{ color: '#8a8680' }}>No songs found</h3>
                                </div>
                            ) : (
                                filteredSongs.map((song) => {
                                    const isExpanded = expandedSongId === song.id;
                                    return (
                                        <motion.div key={song.id} variants={itemVariants} layout className="song-row">
                                            <div className="song-row-header" onClick={() => toggleExpand(song.id)}>
                                                <div className="song-icon-wrap">
                                                    <Music size={18} color="#c9a84c" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 className="song-title">{song.title}</h3>
                                                    <p className="song-artist">{song.original_artist || 'Unknown Artist'}</p>
                                                    <div className="song-meta">
                                                        <span className="meta-badge meta-badge-neutral">Original Key: {song.original_key || 'N/A'}</span>
                                                        {song.original_capo ? (
                                                            <span className="meta-badge meta-badge-accent" style={{ opacity: 0.8 }}>
                                                                Capo: {song.original_capo}{song.original_capo === 1 ? 'st' : song.original_capo === 2 ? 'nd' : song.original_capo === 3 ? 'rd' : 'th'} fret
                                                            </span>
                                                        ) : null}
                                                        {song.tags?.map(t => <span key={t.id} className="meta-badge meta-badge-accent">{t.name}</span>)}
                                                    </div>
                                                </div>
                                                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                                                    <ChevronDown size={18} color="#b0aba5" />
                                                </motion.div>
                                            </div>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        style={{ overflow: 'hidden' }}
                                                    >
                                                        <div className="song-row-body">
                                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                                                <Link to={`/songs/${song.id}`} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
                                                                    View Full Details
                                                                </Link>
                                                                {user?.role !== 'member' && (() => {
                                                    const alreadyAdded = myLeaderProfile && song.versions?.some(v => v.song_leader_id === myLeaderProfile.id);
                                                    const isBeingAdded = quickAddingId === song.id;
                                                    const justAdded = quickAddDoneId === song.id;
                                                    return (
                                                        <button 
                                                            onClick={() => handleQuickAdd(song)}
                                                            className="btn-primary" 
                                                            disabled={!!alreadyAdded || isBeingAdded}
                                                            style={{ 
                                                                background: alreadyAdded ? '#f2eeea' : justAdded ? 'rgba(15,157,88,0.1)' : 'rgba(201,168,76,0.1)', 
                                                                color: alreadyAdded ? '#b0aba5' : justAdded ? '#0F9D58' : '#8a6d2f', 
                                                                padding: '6px 14px', 
                                                                fontSize: 12,
                                                                cursor: alreadyAdded ? 'not-allowed' : 'pointer'
                                                            }}
                                                        >
                                                            <ArrowDownToLine size={14} style={{ marginRight: 6 }} />
                                                            {isBeingAdded ? 'Adding...' : alreadyAdded ? 'Already in My List' : justAdded ? '✓ Added!' : 'Add to My Songs'}
                                                        </button>
                                                    );
                                                })()}
                                                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                                                                    {(user?.role === 'admin' || user?.role === 'pianist' || user?.id === song.user_id) && (
                                                                        <>
                                                                            <button onClick={() => openEditModal(song)} className="icon-btn icon-btn-edit">
                                                                                <Pencil size={15} />
                                                                            </button>
                                                                            <button onClick={() => handleDelete(song.id)} className="icon-btn icon-btn-delete">
                                                                                <Trash2 size={15} />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-card">
                            <div className="modal-header">
                                <h2 className="modal-title">{editingSong ? 'Edit Song' : 'Add New Song'}</h2>
                                <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={16} /></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-field">
                                        <label className="form-label">Song Title *</label>
                                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="form-input" required />
                                    </div>
                                    <div className="form-field" style={{ position: 'relative' }}>
                                        <label className="form-label">Artist</label>
                                        <input 
                                            type="text" 
                                            value={originalArtist} 
                                            onChange={e => {
                                                setOriginalArtist(e.target.value);
                                                setShowArtistSuggestions(true);
                                            }}
                                            onFocus={() => setShowArtistSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowArtistSuggestions(false), 200)}
                                            className="form-input" 
                                            placeholder="Type or select an artist"
                                            autoComplete="off"
                                        />
                                        {showArtistSuggestions && uniqueArtists.filter(a => a.toLowerCase().includes(originalArtist.toLowerCase())).length > 0 && (
                                            <div className="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto" style={{ top: '100%' }}>
                                                {uniqueArtists
                                                    .filter(a => a.toLowerCase().includes(originalArtist.toLowerCase()))
                                                    .map(artist => (
                                                        <div 
                                                            key={artist}
                                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                setOriginalArtist(artist);
                                                                setShowArtistSuggestions(false);
                                                            }}
                                                        >
                                                            {artist}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div className="form-field">
                                            <label className="form-label">Original Key</label>
                                            <select value={originalKey} onChange={e => setOriginalKey(e.target.value)} className="form-input">
                                                <option value="">Unknown</option>
                                                {musicalKeys.map(k => <option key={k} value={k}>{k}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-field">
                                            <label className="form-label">Capo Fret</label>
                                            <select value={originalCapo} onChange={e => setOriginalCapo(Number(e.target.value))} className="form-input">
                                                <option value={0}>No Capo</option>
                                                {[1,2,3,4,5,6,7,8,9,10,11].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    {(user?.role === 'admin' || user?.role === 'pianist') && !editingSong && (
                                        <div className="form-field">
                                            <label className="form-label">Assign to Leader</label>
                                            <select value={assignedOwnerId} onChange={e => setAssignedOwnerId(e.target.value)} className="form-input">
                                                <option value="">Leave unassigned</option>
                                                {leadersFilterData.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div className="form-field">
                                        <label className="form-label">Categories</label>
                                        <div className="cat-checkboxes">
                                            {allCategories.map(cat => (
                                                <label key={cat.id} className="cat-check-lbl">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedCategories.includes(cat.id)}
                                                        onChange={e => e.target.checked ? setSelectedCategories([...selectedCategories, cat.id]) : setSelectedCategories(selectedCategories.filter(id => id !== cat.id))}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <span style={{ color: selectedCategories.includes(cat.id) ? '#c9a84c' : 'inherit' }}>{cat.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Auto-add version checkbox for leaders (not shown when editing) */}
                                    {!editingSong && (user?.role === 'leader') && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(201,168,76,0.08)', borderRadius: 10, border: '1.5px solid rgba(201,168,76,0.2)', marginBottom: 6 }}>
                                            <input 
                                                type="checkbox" 
                                                id="auto-add-version"
                                                checked={autoAddVersion}
                                                onChange={e => setAutoAddVersion(e.target.checked)}
                                                style={{ width: 16, height: 16, accentColor: '#c9a84c', cursor: 'pointer' }}
                                            />
                                            <label htmlFor="auto-add-version" style={{ fontSize: 13, color: '#6a5830', cursor: 'pointer' }}>
                                                Add this to <strong>my songs</strong> (Key: Unknown — use Pitch Detector later)
                                            </label>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                                    <button type="submit" className="btn-submit">Save Song</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </>
    );
};

export default Songs;
