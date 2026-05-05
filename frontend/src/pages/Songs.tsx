import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Pencil, Trash2, Plus, X, Search, Music, ChevronRight, ChevronDown, Filter, Tag as TagIcon, ArrowDownToLine } from 'lucide-react';

interface Tag {
    id: number;
    name: string;
}

interface Song {
    id: number;
    title: string;
    original_artist: string | null;
    original_key: string | null;
    user_id?: number;
    tags?: Tag[];
    versions?: any[];
}

interface User {
    id: number;
    name: string;
    role: string;
}

const Songs = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSong, setEditingSong] = useState<Song | null>(null);
    const { user } = useAuth();
    // A user can always click the Add Song button if they are an admin or leader
    const canCreate = user?.role === 'admin' || user?.role === 'leader';

    const [title, setTitle] = useState('');
    const [originalArtist, setOriginalArtist] = useState('');
    const [originalKey, setOriginalKey] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [leaderFilter, setLeaderFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [assignedOwnerId, setAssignedOwnerId] = useState('');
    const [expandedSongId, setExpandedSongId] = useState<number | null>(null);

    // React Query Hooks
    const { data: songs = [], isLoading: loadingSongs } = useQuery<Song[]>({
        queryKey: ['songs'],
        queryFn: () => api.get('/songs').then(res => res.data)
    });

    const { data: leadersFilterData = [] } = useQuery<any[]>({
        queryKey: ['song-leaders'],
        queryFn: () => api.get('/song-leaders').then(res => res.data)
    });

    const { data: allCategories = [] } = useQuery<Tag[]>({
        queryKey: ['tags'],
        queryFn: () => api.get('/tags').then(res => res.data)
    });

    const { data: allUsers = [] } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(res => res.data),
        enabled: user?.role === 'admin'
    });

    const toggleExpand = (id: number) => {
        setExpandedSongId(prev => prev === id ? null : id);
    };

    // Quick Add Version State
    const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
    const [quickAddSong, setQuickAddSong] = useState<Song | null>(null);
    const [quickAddLeaderId, setQuickAddLeaderId] = useState('');
    const [quickAddKey, setQuickAddKey] = useState('C');
    const [quickAddTempo, setQuickAddTempo] = useState('');
    const [quickAddNotes, setQuickAddNotes] = useState('');
    const [quickAddChords, setQuickAddChords] = useState('');
    const [quickAddYoutube, setQuickAddYoutube] = useState('');
    const [quickAddDrive, setQuickAddDrive] = useState('');
    const [quickAddChordRef, setQuickAddChordRef] = useState('');

    const musicalKeys = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

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
                alert('This song title already exists in the catalog! Please close this window and use the "Add to My List" button on the existing song instead.');
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['songs'] });
            setIsQuickAddModalOpen(false);
            setQuickAddSong(null);
        },
        onError: (error) => {
            console.error('Error adding version to list:', error);
            alert('An error occurred while adding this song to your list.');
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: any = {
            title,
            original_artist: originalArtist || null,
            original_key: originalKey || null,
            tags: selectedCategories
        };

        if (user?.role === 'admin' && !editingSong && assignedOwnerId) {
            payload.user_id = parseInt(assignedOwnerId);
        }

        saveMutation.mutate(payload);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this song? This will delete all leader versions of it as well.')) {
            deleteMutation.mutate(id);
        }
    };

    const resetForm = () => {
        setTitle('');
        setOriginalArtist('');
        setOriginalKey('');
        setAssignedOwnerId('');
        setSelectedCategories([]);
        setEditingSong(null);
    };

    const handleQuickAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickAddSong) return;
        quickAddMutation.mutate({
            song_id: quickAddSong.id,
            song_leader_id: quickAddLeaderId,
            key: quickAddKey,
            tempo: quickAddTempo || null,
            notes: quickAddNotes || null,
            chords: quickAddChords || null,
            youtube_link: quickAddYoutube || null,
            drive_link: quickAddDrive || null,
            chord_reference: quickAddChordRef || null
        });
    };

    const openEditModal = (song: Song) => {
        setEditingSong(song);
        setTitle(song.title);
        setOriginalArtist(song.original_artist || '');
        setOriginalKey(song.original_key || '');
        setSelectedCategories(song.tags ? song.tags.map(t => t.id) : []);
        setIsModalOpen(true);
    };

    const openCreateModal = () => { resetForm(); setIsModalOpen(true); };

    // Find the logged in user's matching leader profile
    const myLeaderProfile = useMemo(() => {
        if (!user || user.role !== 'leader') return null;
        return leadersFilterData.find(l => l.name === user.name) || null;
    }, [user, leadersFilterData]);

    const openQuickAdd = (song: Song) => {
        setQuickAddSong(song);

        // Figure out if the mother song has any pre-existing versions to copy from
        const existingVersion = song.versions && song.versions.length > 0 ? song.versions[0] : null;

        if (existingVersion) {
            setQuickAddKey(existingVersion.key || 'C');
            setQuickAddTempo(existingVersion.tempo || '');
            setQuickAddNotes(existingVersion.notes || '');
            setQuickAddChords(existingVersion.chords || '');
            setQuickAddYoutube(existingVersion.youtube_link || '');
            setQuickAddDrive(existingVersion.drive_link || '');
            setQuickAddChordRef(existingVersion.chord_reference || '');
        } else {
            setQuickAddKey(song.original_key || 'C');
            setQuickAddTempo('');
            setQuickAddNotes('');
            setQuickAddChords('');
            setQuickAddYoutube('');
            setQuickAddDrive('');
            setQuickAddChordRef('');
        }

        if (user?.role === 'leader' && myLeaderProfile) {
            setQuickAddLeaderId(myLeaderProfile.id.toString());
        } else {
            setQuickAddLeaderId(leadersFilterData.length > 0 ? leadersFilterData[0].id.toString() : '');
        }

        setIsQuickAddModalOpen(true);
    };

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

    if (loadingSongs) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c9a84c', animation: 'pulse 1.2s ease-in-out infinite' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", color: '#888', fontSize: 14 }}>Loading songs…</span>
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

                .songs-page * { box-sizing: border-box; }

                .songs-page {
                    font-family: 'DM Sans', sans-serif;
                    color: #1a1814;
                }

                /* ── PAGE HEADER ── */
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                    gap: 20px;
                }

                .page-title-wrap h1 {
                    font-family: 'Cormorant Garamond', Georgia, serif;
                    font-size: 34px;
                    font-weight: 700;
                    color: #0f1117;
                    margin: 0 0 4px 0;
                    letter-spacing: -0.01em;
                    line-height: 1.1;
                }

                .page-title-wrap p {
                    font-size: 13.5px;
                    color: #8a8680;
                    margin: 0;
                    font-weight: 400;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                /* ── CONTROLS ── */
                .control-select {
                    border: 1.5px solid #e8e4df;
                    border-radius: 10px;
                    padding: 9px 14px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13.5px;
                    color: #3a3630;
                    background: #fff;
                    appearance: none;
                    cursor: pointer;
                    outline: none;
                    transition: border-color 0.15s;
                    min-width: 140px;
                }

                .control-select:focus { border-color: #c9a84c; }

                .search-wrap {
                    position: relative;
                }

                .search-wrap svg {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #b0ab a5;
                    pointer-events: none;
                }

                .search-input {
                    border: 1.5px solid #e8e4df;
                    border-radius: 10px;
                    padding: 9px 14px 9px 38px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13.5px;
                    color: #3a3630;
                    background: #fff;
                    outline: none;
                    transition: border-color 0.15s, box-shadow 0.15s;
                    width: 220px;
                }

                .search-input:focus {
                    border-color: #c9a84c;
                    box-shadow: 0 0 0 3px rgba(201,168,76,0.1);
                }

                .search-input::placeholder { color: #c0bbb5; }

                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    background: #0f1117;
                    color: #f0ede8;
                    border: none;
                    border-radius: 10px;
                    padding: 9px 18px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13.5px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.15s, transform 0.1s;
                    white-space: nowrap;
                    letter-spacing: 0.01em;
                    position: relative;
                    overflow: hidden;
                }

                .btn-primary::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(201,168,76,0.15), transparent 60%);
                    pointer-events: none;
                }

                .btn-primary:hover { background: #1e2130; transform: translateY(-1px); }
                .btn-primary:active { transform: translateY(0); }

                /* ── SONGS LIST ── */
                .songs-list {
                    background: #fff;
                    border-radius: 14px;
                    border: 1.5px solid #ede9e4;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04);
                }

                .song-row {
                    display: flex;
                    flex-direction: column;
                    padding: 12px 16px;
                    border-bottom: 1px solid #f2eeea;
                    transition: background 0.14s;
                    color: inherit;
                }

                .song-row:last-child { border-bottom: none; }
                .song-row:hover { background: #faf8f5; }

                .song-row-header {
                    display: flex;
                    align-items: center;
                    text-decoration: none;
                    color: inherit;
                    gap: 14px;
                    cursor: pointer;
                }

                .song-icon-wrap {
                    width: 42px;
                    height: 42px;
                    border-radius: 10px;
                    background: #f7f4f0;
                    border: 1.5px solid #ede9e4;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: background 0.14s, border-color 0.14s;
                }

                .song-row-header:hover .song-icon-wrap {
                    background: rgba(201,168,76,0.1);
                    border-color: rgba(201,168,76,0.3);
                }

                .song-row-header:hover .song-icon-wrap svg { color: #c9a84c !important; }

                .song-info { flex: 1; min-width: 0; }

                .song-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: #1a1814;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    transition: color 0.14s;
                }

                .song-row-header:hover .song-title { color: #c9a84c; }

                .song-artist {
                    font-size: 12.5px;
                    color: #9a9590;
                    margin: 0 0 6px 0;
                }

                .song-meta {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .meta-badge {
                    font-size: 11px;
                    font-weight: 500;
                    padding: 2px 8px;
                    border-radius: 20px;
                    letter-spacing: 0.02em;
                }

                .meta-badge-neutral {
                    background: #f2eeea;
                    color: #6a6560;
                    border: 1px solid #e8e4df;
                }

                .meta-badge-accent {
                    background: rgba(201,168,76,0.1);
                    color: #8a6d2f;
                    border: 1px solid rgba(201,168,76,0.2);
                }

                .song-chevron {
                    color: #d0ccc7;
                    flex-shrink: 0;
                    transition: color 0.14s, transform 0.14s;
                }

                .song-row-header:hover .song-chevron { color: #c9a84c; transform: translateX(2px); }

                .song-row-body {
                    padding-top: 12px;
                    padding-left: 56px; /* Align with title */
                }

                .song-actions {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .icon-btn {
                    width: 34px;
                    height: 34px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1.5px solid transparent;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.14s;
                    color: #b0ab a5;
                }

                .icon-btn-edit:hover {
                    background: rgba(201,168,76,0.1);
                    border-color: rgba(201,168,76,0.25);
                    color: #8a6d2f;
                }

                .icon-btn-delete:hover {
                    background: rgba(220,60,60,0.08);
                    border-color: rgba(220,60,60,0.2);
                    color: #c53030;
                }

                .songs-empty {
                    padding: 60px 24px;
                    text-align: center;
                }

                .songs-empty-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 14px;
                    background: #f7f4f0;
                    border: 1.5px solid #ede9e4;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                }

                .songs-empty h3 {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 22px;
                    font-weight: 600;
                    color: #1a1814;
                    margin: 0 0 6px 0;
                }

                .songs-empty p { font-size: 13.5px; color: #8a8680; margin: 0; }

                /* ── COUNT BAR ── */
                .count-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 14px;
                    padding: 0 2px;
                }

                .count-text {
                    font-size: 12.5px;
                    color: #9a9590;
                    font-weight: 500;
                    letter-spacing: 0.02em;
                }

                .count-accent { color: #c9a84c; font-weight: 600; }

                /* ── MODAL ── */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15,17,23,0.7);
                    backdrop-filter: blur(6px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    z-index: 50;
                    animation: fadeIn 0.15s ease;
                }

                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }

                .modal-card {
                    background: #fff;
                    border-radius: 18px;
                    width: 100%;
                    max-width: 440px;
                    overflow: hidden;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.2);
                    animation: slideUp 0.2s ease;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid #f0ece8;
                    background: #faf8f5;
                }

                .modal-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 22px;
                    font-weight: 700;
                    color: #0f1117;
                    margin: 0;
                }

                .modal-close {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: 1.5px solid #e8e4df;
                    background: #fff;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #9a9590;
                    transition: all 0.14s;
                }

                .modal-close:hover { background: #f0ece8; color: #1a1814; }

                .modal-body { padding: 24px; }

                .form-field { margin-bottom: 18px; }

                .form-label {
                    display: block;
                    font-size: 12.5px;
                    font-weight: 600;
                    color: #5a5550;
                    margin-bottom: 7px;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                }

                .form-label .req { color: #c9a84c; }

                .form-input {
                    width: 100%;
                    border: 1.5px solid #e8e4df;
                    border-radius: 10px;
                    padding: 11px 14px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px;
                    color: #1a1814;
                    outline: none;
                    transition: border-color 0.15s, box-shadow 0.15s;
                    background: #fff;
                }

                .form-input:focus {
                    border-color: #c9a84c;
                    box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
                }

                .form-input::placeholder { color: #c0bbb5; }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    padding: 16px 24px;
                    border-top: 1px solid #f0ece8;
                    background: #faf8f5;
                }

                .btn-ghost {
                    padding: 9px 18px;
                    border-radius: 10px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13.5px;
                    font-weight: 500;
                    background: #ede9e4;
                    color: #5a5550;
                    border: none;
                    cursor: pointer;
                    transition: background 0.14s;
                }

                .btn-ghost:hover { background: #e0dbd4; }

                .btn-submit {
                    padding: 9px 20px;
                    border-radius: 10px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13.5px;
                    font-weight: 500;
                    background: #0f1117;
                    color: #f0ede8;
                    border: none;
                    cursor: pointer;
                    transition: background 0.14s;
                    position: relative;
                    overflow: hidden;
                }

                .btn-submit::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(201,168,76,0.2), transparent 60%);
                    pointer-events: none;
                }

                    background: #1e2130; 
                }

                /* Checkboxes for tags/categories */
                .cat-checkboxes {
                    display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px;
                }
                .cat-check-lbl {
                    display: inline-flex; align-items: center; gap: 5px;
                    background: #fdfdfc; border: 1.5px solid #e8e4df;
                    border-radius: 8px; padding: 6px 10px; font-size: 13px; font-weight: 500;
                    cursor: pointer; transition: all 0.15s;
                }
                .cat-check-lbl:hover { border-color: #d8c494; }
                .cat-check-lbl input:checked + span { color: #c9a84c; font-weight: 600; }
                .cat-check-lbl:has(input:checked) { border-color: #c9a84c; background: #fffdf8; }

                @media (max-width: 640px) {
                    .page-header { flex-direction: column; }
                    .header-actions { width: 100%; }
                    .search-input { width: 100%; }
                    .control-select { width: 100%; }
                }
            `}</style>

            <div className="songs-page">
                {/* Header */}
                <div className="page-header">
                    <div className="page-title-wrap">
                        <h1>Songs Library</h1>
                        <p>Manage and browse your core song catalog</p>
                    </div>

                    <div className="header-actions">
                        <div style={{ position: 'relative' }}>
                            <Filter size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#b0aba5', pointerEvents: 'none' }} />
                            <select
                                value={leaderFilter}
                                onChange={e => setLeaderFilter(e.target.value)}
                                className="control-select"
                                style={{ paddingLeft: 32 }}
                            >
                                <option value="">All Leaders</option>
                                {leadersFilterData.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <TagIcon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#b0aba5', pointerEvents: 'none' }} />
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="control-select"
                                style={{ paddingLeft: 32 }}
                            >
                                <option value="">All Categories</option>
                                {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="search-wrap">
                            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#b0aba5' }} />
                            <input
                                type="text"
                                placeholder="Search songs…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        {canCreate && (
                            <button onClick={openCreateModal} className="btn-primary">
                                <Plus size={16} />
                                <span>Add Song</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Count */}
                <div className="count-bar">
                    <span className="count-text">
                        <span className="count-accent">{filteredSongs.length}</span> song{filteredSongs.length !== 1 ? 's' : ''}
                        {searchQuery || leaderFilter || categoryFilter ? ' found' : ' total'}
                    </span>
                </div>

                {/* List */}
                <div className="songs-list">
                    {filteredSongs.length === 0 ? (
                        <div className="songs-empty">
                            <div className="songs-empty-icon">
                                <Music size={22} color="#c0bbb5" />
                            </div>
                            <h3>No songs found</h3>
                            <p>Try adjusting your filters or add a new song.</p>
                        </div>
                    ) : filteredSongs.map(song => {
                        const isExpanded = expandedSongId === song.id;
                        return (
                            <div key={song.id} className="song-row">
                                <div className="song-row-header" onClick={() => toggleExpand(song.id)}>
                                    <div className="song-icon-wrap">
                                        <Music size={18} color="#b0aba5" />
                                    </div>
                                    <div className="song-info">
                                        <p className="song-title">{song.title}</p>
                                    </div>
                                    {isExpanded ? <ChevronDown size={16} className="song-chevron" /> : <ChevronRight size={16} className="song-chevron" />}
                                </div>

                                {isExpanded && (
                                    <div className="song-row-body">
                                        <div className="song-details-block" style={{ marginBottom: 16 }}>
                                            {song.original_artist && <p className="song-artist">by {song.original_artist}</p>}
                                            <div className="song-meta">
                                                {song.versions?.length ? (
                                                    <span className="meta-badge meta-badge-neutral">
                                                        {song.versions.length} version{song.versions.length !== 1 ? 's' : ''}
                                                    </span>
                                                ) : null}
                                                {song.tags?.map(t => (
                                                    <span key={t.id} className="meta-badge meta-badge-accent">{t.name}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="song-actions-block" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <Link to={`/songs/${song.id}`} className="btn-ghost" style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}>
                                                View Details
                                            </Link>

                                            <div className="song-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                                                {(user?.role === 'admin' || user?.role === 'leader') && (
                                                    // Only show "Add to List" if I'm an admin OR if I'm a leader and I DON'T have a version yet.
                                                    !myLeaderProfile || !song.versions?.some(v => v.song_leader_id === myLeaderProfile.id) ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                openQuickAdd(song);
                                                            }}
                                                            className="icon-btn"
                                                            title="Add to My List"
                                                            style={{ color: '#c9a84c', background: 'rgba(201,168,76,0.1)' }}
                                                        >
                                                            <ArrowDownToLine size={15} />
                                                        </button>
                                                    ) : (
                                                        <div
                                                            className="icon-btn"
                                                            title="Already in your list"
                                                            style={{ color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', cursor: 'default' }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                        </div>
                                                    )
                                                )}
                                                {(user?.role === 'admin' || (user?.role === 'leader' && song.user_id === user?.id)) && (
                                                    <>
                                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(song); }} className="icon-btn icon-btn-edit" title="Edit Master Song">
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(song.id); }} className="icon-btn icon-btn-delete" title="Delete Master Song">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2 className="modal-title">{editingSong ? 'Edit Song' : 'Add New Song'}</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={16} /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-field">
                                    <label className="form-label">Song Title <span className="req">*</span></label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="form-input"
                                        placeholder="e.g. How Great Is Our God"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Original Artist <span style={{ color: '#b0aba5', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
                                    <input
                                        type="text"
                                        value={originalArtist}
                                        onChange={e => setOriginalArtist(e.target.value)}
                                        className="form-input"
                                        placeholder="e.g. Chris Tomlin"
                                    />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Original Key <span style={{ color: '#b0aba5', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
                                    <select
                                        value={originalKey}
                                        onChange={e => setOriginalKey(e.target.value)}
                                        className="form-input"
                                    >
                                        <option value="">Select Key...</option>
                                        {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map(k => (
                                            <option key={k} value={k}>{k}</option>
                                        ))}
                                    </select>
                                </div>
                                {user?.role === 'admin' && !editingSong && (
                                    <div className="form-field">
                                        <label className="form-label">Assign to Leader <span style={{ color: '#b0aba5', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
                                        <select
                                            value={assignedOwnerId}
                                            onChange={e => setAssignedOwnerId(e.target.value)}
                                            className="form-input"
                                        >
                                            <option value="">Self (Admin)</option>
                                            {allUsers.filter(u => u.role === 'leader').map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Categories <span style={{ color: '#b0aba5', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
                                    {allCategories.length === 0 ? (
                                        <p style={{ fontSize: 13, color: '#b0aba5', margin: 0 }}>No categories available. Admins can add them under Categories.</p>
                                    ) : (
                                        <div className="cat-checkboxes">
                                            {allCategories.map(cat => (
                                                <label key={cat.id} className="cat-check-lbl">
                                                    <input
                                                        type="checkbox"
                                                        style={{ display: 'none' }}
                                                        checked={selectedCategories.includes(cat.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedCategories(prev => [...prev, cat.id]);
                                                            else setSelectedCategories(prev => prev.filter(c => c !== cat.id));
                                                        }}
                                                    />
                                                    <span>{cat.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                                <button type="submit" className="btn-submit">
                                    {editingSong ? 'Save Changes' : 'Create Song'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quick Add Modal */}
            {isQuickAddModalOpen && (
                <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setIsQuickAddModalOpen(false); }}>
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2 className="modal-title">Add to My List</h2>
                            <button className="modal-close" onClick={() => setIsQuickAddModalOpen(false)}><X size={16} /></button>
                        </div>

                        <form onSubmit={handleQuickAddSubmit}>
                            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                                <p style={{ fontSize: 13.5, color: '#8a8680', marginBottom: 20 }}>
                                    Adding <strong>{quickAddSong?.title}</strong> to your personal setlist library.
                                    {quickAddSong?.versions && quickAddSong.versions.length > 0 && " Default details have been copied from an existing master version."}
                                </p>

                                {user?.role === 'admin' && (
                                    <div className="form-field">
                                        <label className="form-label">Select Leader / List <span className="req">*</span></label>
                                        <select
                                            value={quickAddLeaderId}
                                            onChange={e => setQuickAddLeaderId(e.target.value)}
                                            className="form-input"
                                            required
                                        >
                                            <option value="">Choose...</option>
                                            {leadersFilterData.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className="form-field">
                                    <label className="form-label">Your Preferred Key <span className="req">*</span></label>
                                    <select
                                        value={quickAddKey}
                                        onChange={e => setQuickAddKey(e.target.value)}
                                        className="form-input"
                                        required
                                    >
                                        {musicalKeys.map(k => (
                                            <option key={k} value={k}>{k}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Tempo / BPM</label>
                                    <input type="text" value={quickAddTempo} onChange={e => setQuickAddTempo(e.target.value)} className="form-input" placeholder="e.g. 120 BPM, Slow" />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Special Notes</label>
                                    <input type="text" value={quickAddNotes} onChange={e => setQuickAddNotes(e.target.value)} className="form-input" placeholder="e.g. Skip bridge" />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">YouTube Link</label>
                                    <input type="url" value={quickAddYoutube} onChange={e => setQuickAddYoutube(e.target.value)} className="form-input" placeholder="https://youtube.com/..." />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Drive Link</label>
                                    <input type="url" value={quickAddDrive} onChange={e => setQuickAddDrive(e.target.value)} className="form-input" placeholder="https://drive.google.com/..." />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Chord Reference (Ultimate Guitar)</label>
                                    <input type="url" value={quickAddChordRef} onChange={e => setQuickAddChordRef(e.target.value)} className="form-input" placeholder="https://..." />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Chords / Lyrics</label>
                                    <p style={{ fontSize: 12, color: '#b0aba5', marginBottom: 10, marginTop: '-4px' }}>Basic text format. Use spaces instead of tabs to align chords.</p>
                                    <textarea
                                        value={quickAddChords}
                                        onChange={e => setQuickAddChords(e.target.value)}
                                        className="form-input"
                                        style={{ fontFamily: "'JetBrains Mono', monospace", height: '240px', resize: 'vertical' }}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsQuickAddModalOpen(false)} className="btn-ghost">Cancel</button>
                                <button type="submit" className="btn-submit">
                                    Add to List
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Songs;