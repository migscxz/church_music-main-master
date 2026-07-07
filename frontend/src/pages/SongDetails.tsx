import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Music2, Edit3, Trash2, Plus, X, Music, Youtube, HardDrive, ChevronDown } from 'lucide-react';
import Preloader from '../components/Preloader';
import ChordViewer from '../components/ChordViewer';
import { transposeText, getStepDifference } from '../utils/transposer';
import { motion, AnimatePresence } from 'framer-motion';

interface SongLeader {
    id: number;
    name: string;
}

interface SongVersion {
    id: number;
    song_id: number;
    song_leader_id: number;
    key: string;
    chords: string;
    tempo: string;
    notes: string;
    capo?: number;
    youtube_link?: string | null;
    drive_link?: string | null;
    chord_reference?: string | null;
    leader?: SongLeader;
}

interface Song {
    id: number;
    title: string;
    original_artist: string | null;
    original_key: string | null;
    original_capo?: number;
    user_id?: number;
    versions?: SongVersion[];
}

const SongDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [song, setSong] = useState<Song | null>(null);
    const [leaders, setLeaders] = useState<SongLeader[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVersion, setEditingVersion] = useState<SongVersion | null>(null);

    const { user } = useAuth();
    const canCreateVersion = user?.role === 'admin' || user?.role === 'leader' || user?.role === 'pianist';

    const [leaderId, setLeaderId] = useState('');
    const [key, setKey] = useState('C');
    const [tempo, setTempo] = useState('');
    const [notes, setNotes] = useState('');
    const [chords, setChords] = useState('');
    const [youtubeLink, setYoutubeLink] = useState('');
    const [driveLink, setDriveLink] = useState('');
    const [chordReference, setChordReference] = useState('');

    const [expandedVersionId, setExpandedVersionId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        setExpandedVersionId(prev => prev === id ? null : id);
    };

    const musicalKeys = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

    const fetchData = async () => {
        try {
            setLoading(true);
            const [songRes, leadersRes] = await Promise.all([
                api.get(`/songs/${id}`),
                api.get('/song-leaders')
            ]);
            setSong(songRes.data);
            setLeaders(leadersRes.data);
            
            // Auto-expand if there's only one version
            if (songRes.data.versions?.length === 1) {
                setExpandedVersionId(songRes.data.versions[0].id);
            }
        } catch (error) {
            console.error('Error fetching song details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                song_id: id,
                song_leader_id: leaderId,
                key: key || null,
                tempo: tempo || null,
                notes: notes || null,
                chords: chords || null,
                youtube_link: youtubeLink || null,
                drive_link: driveLink || null,
                chord_reference: chordReference || null
            };
            if (editingVersion) {
                await api.put(`/song-versions/${editingVersion.id}`, payload);
            } else {
                await api.post('/song-versions', payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving song version:', error);
        }
    };

    const handleDelete = async (versionId: number) => {
        if (window.confirm('Are you sure you want to delete this specific version?')) {
            try {
                await api.delete(`/song-versions/${versionId}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting song version:', error);
            }
        }
    };

    const openCreateModal = () => {
        setEditingVersion(null);
        setLeaderId(leaders.length > 0 ? leaders[0].id.toString() : '');
        setKey('C'); setTempo(''); setNotes(''); setChords('');
        setYoutubeLink(''); setDriveLink(''); setChordReference('');
        setIsModalOpen(true);
    };

    const openEditModal = (version: SongVersion) => {
        setEditingVersion(version);
        setLeaderId(version.song_leader_id.toString());
        setKey(version.key || 'C');
        setTempo(version.tempo || '');
        setNotes(version.notes || '');
        setChords(version.chords || '');
        setYoutubeLink(version.youtube_link || '');
        setDriveLink(version.drive_link || '');
        setChordReference(version.chord_reference || '');
        setIsModalOpen(true);
    };

    if (loading) return (
        <div style={{ position: 'relative', height: 400, borderRadius: 14, overflow: 'hidden' }}>
            <Preloader text="Loading song details..." fullScreen={false} />
        </div>
    );

    if (!song) return (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: "'DM Sans', sans-serif", color: '#c53030' }}>Song not found.</div>
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

                .sd-page * { box-sizing: border-box; }
                .sd-page { font-family: 'DM Sans', sans-serif; color: #1a1814; }

                .back-link {
                    display: inline-flex; align-items: center; gap: 6px;
                    font-size: 13px; font-weight: 500; color: #9a9590;
                    text-decoration: none; margin-bottom: 22px; transition: color 0.14s;
                }
                .back-link:hover { color: var(--accent); }

                .song-hero {
                    background: var(--bg-surface); border-radius: 16px; padding: 28px 32px;
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 32px; position: relative; overflow: hidden; flex-wrap: wrap; gap: 20px;
                }
                .song-hero::after {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent);
                }

                .hero-icon {
                    width: 52px; height: 52px; border-radius: 12px;
                    background: var(--active-bg); border: 1.5px solid rgba(201,168,76,0.25);
                    display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
                }

                .hero-title {
                    font-family: 'Cormorant Garamond', serif; font-size: 32px;
                    font-weight: 700; color: var(--text-primary); margin: 0 0 6px 0;
                }

                .hero-artist {
                    display: inline-flex; align-items: center; gap: 6px;
                    font-size: 13.5px; color: var(--text-muted); margin: 0;
                }

                .btn-add-version {
                    display: inline-flex; align-items: center; gap: 8px;
                    background: var(--accent-muted); border: 1.5px solid rgba(201,168,76,0.3);
                    color: var(--accent); border-radius: 10px; padding: 10px 20px;
                    font-weight: 600; cursor: pointer; transition: all 0.15s;
                }

                .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
                .section-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; }
                .section-count { font-size: 12px; padding: 3px 9px; border-radius: 20px; background: #f2eeea; border: 1px solid  var(--border-color); }

                .version-card {
                    background: var(--bg-card); border-radius: 14px; border: 1.5px solid #ede9e4;
                    margin-bottom: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow: hidden;
                }

                .version-card-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 16px 18px; background: var(--bg-card-alt); cursor: pointer;
                }

                .leader-info { display: flex; align-items: center; gap: 12px; }
                .leader-avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--bg-surface); display: flex; align-items: center; justify-content: center; }

                .card-btn { width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; color: #b0aba5; }
                .card-btn:hover { background: #f0ece8; color: #1a1814; }

                .version-card-body { padding: 20px; border-top: 1px solid #f0ece8; }
                .version-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
                .version-pill { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
                .pill-key { background: var(--bg-surface); color: var(--accent); }
                .pill-tempo { background: #f2eeea; color: #5a5550; }

                .version-notes { background: #fcfaf7; border-radius: 8px; padding: 12px; font-size: 13px; color: #6a5830; margin-bottom: 16px; border-left: 3px solid var(--accent); }

                .modal-overlay { position: fixed; inset: 0; background: rgba(15,17,23,0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 24px; }
                .modal-card { background: var(--bg-card); border-radius: 18px; width: 100%; max-width: 680px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
                .modal-header { padding: 20px 24px; border-bottom: 1px solid #f0ece8; display: flex; justify-content: space-between; align-items: center; }
                .modal-title { margin: 0; font-size: 18px; font-weight: 700; color: #0f1117; }
                .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
                .modal-footer { padding: 16px 24px; border-top: 1px solid #f0ece8; background: var(--bg-card-alt); display: flex; justify-content: flex-end; gap: 10px; }

                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
                .form-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
                .form-grid .form-field { margin-bottom: 0; }
                .form-label { font-size: 11px; font-weight: 700; color: #6a6560; text-transform: uppercase; }
                .form-input { border: 1.5px solid  var(--border-color); border-radius: 10px; padding: 10px 14px; outline: none; transition: border-color 0.2s; }
                .form-input:focus { border-color: var(--accent); }
                .btn-ghost { background: transparent; border: none; color: #6a6560; font-weight: 600; cursor: pointer; padding: 9px 18px; border-radius: 10px; transition: background 0.2s; }
                .btn-ghost:hover { background: #f2eeea; }
                .btn-submit { background: var(--bg-surface); color: var(--text-primary); border: none; font-weight: 600; cursor: pointer; padding: 9px 18px; border-radius: 10px; transition: background 0.2s; }
                .btn-submit:hover { background: #1a1a1a; }
            `}</style>

            <div className="sd-page">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <Link to="/songs" className="back-link">
                        <ArrowLeft size={14} /> Back to Songs
                    </Link>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="song-hero"
                >
                    <div>
                        <div className="hero-icon">
                            <Music size={24} color="var(--accent)" />
                        </div>
                        <h1 className="hero-title">{song.title}</h1>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {song.original_artist && (
                                <p className="hero-artist"><User size={13} /> {song.original_artist}</p>
                            )}
                            {song.original_key && (
                                <p className="hero-artist"><Music2 size={13} /> Original Key: {song.original_key}</p>
                            )}
                        </div>
                    </div>
                    {canCreateVersion && (
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={openCreateModal} 
                            className="btn-add-version"
                        >
                            <Plus size={16} /> Add Leader Version
                        </motion.button>
                    )}
                </motion.div>

                <div className="section-header">
                    <h2 className="section-title">Leader Versions</h2>
                    <span className="section-count">{song.versions?.length ?? 0}</span>
                </div>

                <AnimatePresence mode="popLayout">
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="versions-grid"
                    >
                        {song.versions?.length === 0 ? (
                            <motion.div variants={itemVariants} className="versions-empty">
                                <div className="versions-empty-icon"><Music size={22} color="#c0bbb5" /></div>
                                <h3>No versions yet</h3>
                                <p>Add a leader version to include chords and performance notes.</p>
                            </motion.div>
                        ) : (
                            song.versions?.map((version) => {
                                const isExpanded = expandedVersionId === version.id;
                                const canEdit = user?.role === 'admin' || user?.role === 'pianist' || (user?.name === version.leader?.name);
                                return (
                                    <motion.div 
                                        key={version.id} 
                                        variants={itemVariants}
                                        layout
                                        className="version-card"
                                    >
                                        <div className="version-card-header" onClick={() => toggleExpand(version.id)}>
                                            <div className="leader-info">
                                                <div className="leader-avatar">
                                                    <User size={16} color="var(--accent)" />
                                                </div>
                                                <div>
                                                    <p className="leader-name">{version.leader?.name || 'Unknown Leader'}</p>
                                                    <span style={{ fontSize: 12, color: '#9a9590' }}>Key of {version.key}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                {canEdit && (
                                                    <div className="card-actions">
                                                        <button onClick={(e) => { e.stopPropagation(); openEditModal(version); }} className="card-btn"><Edit3 size={14} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(version.id); }} className="card-btn"><Trash2 size={14} /></button>
                                                    </div>
                                                )}
                                                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                                                    <ChevronDown size={18} color="#b0aba5" />
                                                </motion.div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <div className="version-card-body">
                                                        <div className="version-pills">
                                                            <span className="version-pill pill-key">KEY OF {version.key}</span>
                                                            {version.tempo && <span className="version-pill pill-tempo">{version.tempo}</span>}
                                                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                                                {version.youtube_link && (
                                                                    <a href={version.youtube_link} target="_blank" rel="noreferrer" className="card-btn" title="YouTube"><Youtube size={16} /></a>
                                                                )}
                                                                {version.drive_link && (
                                                                    <a href={version.drive_link} target="_blank" rel="noreferrer" className="card-btn" title="Drive"><HardDrive size={16} /></a>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {version.notes && (
                                                            <div className="version-notes">
                                                                <strong>Notes:</strong> {version.notes}
                                                            </div>
                                                        )}

                                                        <div style={{ marginTop: 20 }}>
                                                            <ChordViewer 
                                                                chords={version.chords} 
                                                                originalKey={version.key} 
                                                                originalCapo={song.original_capo || 0}
                                                                songTitle={song.title}
                                                                leaderName={version.leader?.name || 'Unknown Leader'}
                                                                tempo={version.tempo}
                                                                youtubeLink={version.youtube_link}
                                                            />
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

            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="modal-card"
                        >
                            <div className="modal-header">
                                <h2 className="modal-title">{editingVersion ? 'Edit Version' : 'Add Version'}</h2>
                                <button className="card-btn" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
                            </div>
                            <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
                                <div className="modal-body">
                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label className="form-label">Leader</label>
                                            <select value={leaderId} onChange={e => setLeaderId(e.target.value)} className="form-input" required>
                                                {leaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-field">
                                            <label className="form-label">Key</label>
                                            <select 
                                                value={key} 
                                                onChange={e => {
                                                    const newKey = e.target.value;
                                                    if (key && newKey && chords) {
                                                        const stepDiff = getStepDifference(key, newKey);
                                                        if (stepDiff !== 0) {
                                                            const transposed = transposeText(chords, stepDiff);
                                                            setChords(transposed);
                                                        }
                                                    }
                                                    setKey(newKey);
                                                }} 
                                                className="form-input"
                                            >
                                                {musicalKeys.map(k => <option key={k} value={k}>{k}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label className="form-label">Tempo</label>
                                            <input type="text" value={tempo} onChange={e => setTempo(e.target.value)} className="form-input" placeholder="e.g. 120 BPM" />
                                        </div>
                                        <div className="form-field">
                                            <label className="form-label">YouTube Link</label>
                                            <input type="url" value={youtubeLink} onChange={e => setYoutubeLink(e.target.value)} className="form-input" placeholder="https://youtube.com/..." />
                                        </div>
                                    </div>
                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label className="form-label">Google Drive Link</label>
                                            <input type="url" value={driveLink} onChange={e => setDriveLink(e.target.value)} className="form-input" placeholder="https://drive.google.com/..." />
                                        </div>
                                        <div className="form-field">
                                            <label className="form-label">Chord Reference (URL)</label>
                                            <input type="url" value={chordReference} onChange={e => setChordReference(e.target.value)} className="form-input" placeholder="https://..." />
                                        </div>
                                    </div>
                                    <div className="form-field" style={{ marginBottom: 16 }}>
                                        <label className="form-label">Notes</label>
                                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-input" style={{ height: 60 }} />
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label">Chords & Lyrics</label>
                                        <textarea 
                                            value={chords} 
                                            onChange={e => setChords(e.target.value)} 
                                            className="form-input" 
                                            style={{ height: 200, fontFamily: 'monospace' }} 
                                            placeholder="[G] How [D] great is our [Em] God..."
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                                    <button type="submit" className="btn-submit">Save Version</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SongDetails;
