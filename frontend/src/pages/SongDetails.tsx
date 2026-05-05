import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Music2, Edit3, Trash2, Plus, X, Type, Clock, Music, Youtube, HardDrive, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import ChordViewer from '../components/ChordViewer';

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
    // canCreateVersion allows admins and leaders to ADD a new version
    const canCreateVersion = user?.role === 'admin' || user?.role === 'leader';


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
                key,
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", color: '#888', fontSize: 14 }}>Loading song details…</span>
        </div>
    );

    if (!song) return (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: "'DM Sans', sans-serif", color: '#c53030' }}>Song not found.</div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

                .sd-page * { box-sizing: border-box; }
                .sd-page { font-family: 'DM Sans', sans-serif; color: #1a1814; }

                /* ── BACK LINK ── */
                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #9a9590;
                    text-decoration: none;
                    margin-bottom: 22px;
                    transition: color 0.14s;
                    letter-spacing: 0.02em;
                }

                .back-link:hover { color: #c9a84c; }

                /* ── SONG HERO ── */
                .song-hero {
                    background: #0f1117;
                    border-radius: 16px;
                    padding: 28px 32px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                    position: relative;
                    overflow: hidden;
                    flex-wrap: wrap;
                    gap: 20px;
                }

                .song-hero::before {
                    content: '';
                    position: absolute;
                    top: -40px;
                    right: -40px;
                    width: 180px;
                    height: 180px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%);
                    pointer-events: none;
                }

                .song-hero::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent);
                }

                .hero-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 12px;
                    background: rgba(201,168,76,0.12);
                    border: 1.5px solid rgba(201,168,76,0.25);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 14px;
                }

                .hero-title {
                    font-family: 'Cormorant Garamond', Georgia, serif;
                    font-size: 32px;
                    font-weight: 700;
                    color: #f0ede8;
                    margin: 0 0 6px 0;
                    letter-spacing: -0.01em;
                    line-height: 1.1;
                }

                .hero-artist {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13.5px;
                    color: rgba(240,237,232,0.5);
                    margin: 0;
                }

                .hero-artist svg { color: rgba(201,168,76,0.6); }

                .btn-add-version {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(201,168,76,0.15);
                    border: 1.5px solid rgba(201,168,76,0.3);
                    color: #c9a84c;
                    border-radius: 10px;
                    padding: 10px 20px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13.5px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                    white-space: nowrap;
                    letter-spacing: 0.02em;
                }

                .btn-add-version:hover {
                    background: rgba(201,168,76,0.22);
                    border-color: rgba(201,168,76,0.5);
                    transform: translateY(-1px);
                }

                /* ── SECTION TITLE ── */
                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 18px;
                }

                .section-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 22px;
                    font-weight: 700;
                    color: #0f1117;
                    margin: 0;
                }

                .section-count {
                    font-size: 12px;
                    font-weight: 600;
                    padding: 3px 9px;
                    border-radius: 20px;
                    background: #f2eeea;
                    color: #7a7570;
                    letter-spacing: 0.04em;
                    border: 1px solid #e8e4df;
                }

                /* ── EMPTY STATE ── */
                .versions-empty {
                    background: #faf8f5;
                    border: 2px dashed #e8e4df;
                    border-radius: 14px;
                    padding: 60px 24px;
                    text-align: center;
                }

                .versions-empty-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 14px;
                    background: #f2eeea;
                    border: 1.5px solid #e8e4df;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                }

                .versions-empty h3 {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 22px;
                    font-weight: 600;
                    color: #1a1814;
                    margin: 0 0 6px 0;
                }

                .versions-empty p { font-size: 13.5px; color: #8a8680; margin: 0 0 16px 0; }

                .btn-link {
                    font-size: 13.5px;
                    font-weight: 600;
                    color: #c9a84c;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    text-decoration: underline;
                    text-underline-offset: 3px;
                }

                /* ── VERSION GRID ── */
                .versions-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 18px;
                }

                /* ── VERSION CARD ── */
                .version-card {
                    background: #fff;
                    border-radius: 14px;
                    border: 1.5px solid #ede9e4;
                    overflow: visible;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04);
                    transition: border-color 0.15s, box-shadow 0.15s;
                }

                .version-card:hover {
                    border-color: rgba(201,168,76,0.3);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(201,168,76,0.08);
                }

                /* keep rounded corners on header since card no longer clips */
                .version-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 18px;
                    background: #faf8f5;
                    border-radius: 13px 13px 0 0;
                    cursor: pointer;
                    transition: background 0.14s;
                }

                .version-card-header:hover {
                    background: #f2eeea;
                }

                .leader-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .leader-chevron {
                    color: #d0ccc7;
                    transition: color 0.14s, transform 0.14s;
                    display: flex;
                    align-items: center;
                }

                .version-card-header:hover .leader-chevron {
                    color: #c9a84c;
                    transform: translateX(2px);
                }

                .leader-avatar {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    background: #0f1117;
                    border: 1.5px solid rgba(201,168,76,0.25);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .leader-name {
                    font-size: 15px;
                    font-weight: 600;
                    color: #1a1814;
                    margin: 0;
                }

                .card-actions {
                    display: flex;
                    gap: 4px;
                }

                .card-btn {
                    width: 30px;
                    height: 30px;
                    border-radius: 7px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1.5px solid transparent;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.14s;
                }

                .card-btn-edit:hover {
                    background: rgba(201,168,76,0.1);
                    border-color: rgba(201,168,76,0.25);
                    color: #8a6d2f;
                }

                .card-btn-delete:hover {
                    background: rgba(220,60,60,0.08);
                    border-color: rgba(220,60,60,0.2);
                    color: #c53030;
                }

                .version-card-body {
                    padding: 0 18px 18px 18px;
                    flex: 1;
                    border-radius: 0 0 13px 13px;
                    border-top: 1px solid #f0ece8;
                    overflow: visible;
                }

                /* ensure ChordViewer inner toolbar wraps instead of overflowing */
                .version-card-body > div > div {
                    min-width: 0;
                }

                /* ── CHORDVIEWER TOOLBAR FIX ── */
                /* Force the ChordViewer controls bar to wrap so Print/PDF buttons stay visible */
                .version-card-body [class*="toolbar"],
                .version-card-body [class*="controls"],
                .version-card-body > div > div:first-child {
                    flex-wrap: wrap !important;
                    gap: 8px !important;
                }

                /* Give ChordViewer container full width */
                .version-card-body > div {
                    width: 100%;
                    min-width: 0;
                    overflow: visible;
                }

                /* ── PRINT / PDF ── */
                @media print {
                    .sd-page .back-link,
                    .sd-page .song-hero .btn-add-version,
                    .sd-page .card-actions,
                    .sd-page .section-header {
                        display: none !important;
                    }
                    .sd-page .song-hero {
                        background: #fff !important;
                        border: 2px solid #0f1117;
                        color: #0f1117 !important;
                    }
                    .sd-page .hero-title { color: #0f1117 !important; }
                    .sd-page .versions-grid {
                        grid-template-columns: 1fr !important;
                        gap: 24px !important;
                    }
                    .sd-page .version-card {
                        break-inside: avoid;
                        border: 1.5px solid #ccc !important;
                        box-shadow: none !important;
                        page-break-inside: avoid;
                    }
                }

                .version-pills {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-bottom: 14px;
                }

                .version-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 5px 11px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 0.03em;
                }

                .pill-key {
                    background: #0f1117;
                    color: #c9a84c;
                    border: 1.5px solid rgba(201,168,76,0.2);
                }

                .pill-tempo {
                    background: #f2eeea;
                    color: #5a5550;
                    border: 1.5px solid #e8e4df;
                }

                .version-notes {
                    background: rgba(201,168,76,0.07);
                    border: 1px solid rgba(201,168,76,0.18);
                    border-radius: 8px;
                    padding: 10px 13px;
                    font-size: 13px;
                    color: #6a5830;
                    margin-bottom: 16px;
                    line-height: 1.5;
                }

                .version-notes strong { font-weight: 600; }

                .chords-section-label {
                    font-size: 10.5px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: #b0aba5;
                    margin-bottom: 10px;
                }

                .no-chords {
                    font-size: 13px;
                    color: #c0bbb5;
                    font-style: italic;
                }

                /* ── MODAL ── */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15,17,23,0.75);
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
                    max-width: 720px;
                    max-height: 90vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.25);
                    animation: slideUp 0.2s ease;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 26px;
                    border-bottom: 1px solid #f0ece8;
                    background: #faf8f5;
                    flex-shrink: 0;
                }

                .modal-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 22px;
                    font-weight: 700;
                    color: #0f1117;
                    margin: 0;
                }

                .modal-close {
                    width: 32px; height: 32px;
                    border-radius: 8px;
                    border: 1.5px solid #e8e4df;
                    background: #fff;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: #9a9590;
                    transition: all 0.14s;
                }

                .modal-close:hover { background: #f0ece8; color: #1a1814; }

                .modal-body { padding: 24px 26px; overflow-y: auto; flex: 1; }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 18px;
                    margin-bottom: 20px;
                }

                .form-field { display: flex; flex-direction: column; }

                .form-label {
                    font-size: 11.5px;
                    font-weight: 700;
                    color: #5a5550;
                    margin-bottom: 7px;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                }

                .form-label .req { color: #c9a84c; }

                .form-input, .form-select {
                    border: 1.5px solid #e8e4df;
                    border-radius: 10px;
                    padding: 10px 14px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px;
                    color: #1a1814;
                    outline: none;
                    background: #fff;
                    transition: border-color 0.15s, box-shadow 0.15s;
                }

                .form-input:focus, .form-select:focus {
                    border-color: #c9a84c;
                    box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
                }

                .form-input::placeholder { color: #c0bbb5; }

                .chords-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11.5px;
                    font-weight: 700;
                    color: #5a5550;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    margin-bottom: 6px;
                }

                .chords-tip {
                    font-size: 12px;
                    color: #b0aba5;
                    margin-bottom: 10px;
                    font-weight: 400;
                    letter-spacing: 0;
                    text-transform: none;
                }

                .chords-textarea {
                    width: 100%;
                    height: 240px;
                    border: 1.5px solid #e8e4df;
                    border-radius: 10px;
                    padding: 12px 14px;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 13px;
                    color: #1a1814;
                    outline: none;
                    resize: vertical;
                    background: #faf8f5;
                    line-height: 1.7;
                    transition: border-color 0.15s, box-shadow 0.15s;
                }

                .chords-textarea:focus {
                    border-color: #c9a84c;
                    box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
                    background: #fff;
                }

                .chords-textarea::placeholder { color: #c0bbb5; }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    padding: 16px 26px;
                    border-top: 1px solid #f0ece8;
                    background: #faf8f5;
                    flex-shrink: 0;
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
                    padding: 9px 22px;
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

                .btn-submit:hover { background: #1e2130; }

                @media (max-width: 640px) {
                    .versions-grid { grid-template-columns: 1fr; }
                    .form-grid { grid-template-columns: 1fr; }
                    .song-hero { padding: 22px 20px; }
                    .hero-title { font-size: 26px; }
                }
            `}</style>

            <div className="sd-page">
                {/* Back */}
                <Link to="/songs" className="back-link">
                    <ArrowLeft size={14} /> Back to Songs
                </Link>

                {/* Hero */}
                <div className="song-hero">
                    <div>
                        <div className="hero-icon">
                            <Music size={24} color="#c9a84c" />
                        </div>
                        <h1 className="hero-title">{song.title}</h1>
                        {song.original_artist && (
                            <p className="hero-artist" style={{ marginRight: 16 }}>
                                <User size={13} /> {song.original_artist}
                            </p>
                        )}
                        {song.original_key && (
                            <p className="hero-artist">
                                <Music2 size={13} /> Original Key: {song.original_key}
                            </p>
                        )}
                    </div>
                    {canCreateVersion && (
                        <button onClick={openCreateModal} className="btn-add-version">
                            <Plus size={16} /> Add Leader Version
                        </button>
                    )}
                </div>

                {/* Versions */}
                <div className="section-header">
                    <h2 className="section-title">Leader Versions</h2>
                    <span className="section-count">{song.versions?.length ?? 0}</span>
                </div>

                {song.versions && song.versions.length === 0 ? (
                    <div className="versions-empty">
                        <div className="versions-empty-icon">
                            <Music2 size={22} color="#c0bbb5" />
                        </div>
                        <h3>No versions yet</h3>
                        <p>Create specific keys and chord sheets for different song leaders.</p>
                        <button onClick={openCreateModal} className="btn-link">Add the first version</button>
                    </div>
                ) : (
                    <div className="versions-grid">
                        {song.versions?.map(version => {
                            const isExpanded = expandedVersionId === version.id;
                            return (
                                <div key={version.id} className="version-card">
                                    <div className="version-card-header" onClick={() => toggleExpand(version.id)}>
                                        <div className="leader-info">
                                            <div className="leader-chevron">
                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </div>
                                            <div className="leader-avatar">
                                                <User size={15} color="#c9a84c" />
                                            </div>
                                            <p className="leader-name">{version.leader?.name || 'Unknown Leader'}</p>
                                        </div>
                                        {/* Admins can edit anything; Leaders can edit if they own the SONG, or potentially limit to owning the VERSION. But plan says check song ownership. */}
                                        {(user?.role === 'admin' || (user?.role === 'leader' && song?.user_id === user?.id)) && (
                                            <div className="card-actions">
                                                <button onClick={(e) => { e.stopPropagation(); openEditModal(version); }} className="card-btn card-btn-edit" title="Edit version">
                                                    <Edit3 size={14} color="#8a8680" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(version.id); }} className="card-btn card-btn-delete" title="Delete version">
                                                    <Trash2 size={14} color="#8a8680" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {isExpanded && (
                                        <div className="version-card-body">
                                            <div className="version-pills" style={{ marginTop: '16px' }}>
                                                <span className="version-pill pill-key">
                                                    <Music2 size={11} /> Key of {version.key || 'N/A'}
                                                </span>
                                                {version.tempo && (
                                                    <span className="version-pill pill-tempo">
                                                        <Clock size={11} /> {version.tempo}
                                                    </span>
                                                )}
                                            </div>

                                            {version.notes && (
                                                <div className="version-notes">
                                                    <strong>Notes:</strong> {version.notes}
                                                </div>
                                            )}

                                            {/* References Section */}
                                            {(version.youtube_link || version.drive_link || version.chord_reference) && (
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                                    {version.youtube_link && (
                                                        <a href={version.youtube_link} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                                                            <Youtube size={14} color="#dc2626" /> YouTube
                                                        </a>
                                                    )}
                                                    {version.drive_link && (
                                                        <a href={version.drive_link} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                                                            <HardDrive size={14} color="#2563eb" /> Drive Audio
                                                        </a>
                                                    )}
                                                    {version.chord_reference && (
                                                        <a href={version.chord_reference} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                                                            <ExternalLink size={14} color="#16a34a" /> Reference Chords
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            <div>
                                                <p className="chords-section-label">Chord Sheet</p>
                                                {version.chords ? (
                                                    <ChordViewer
                                                        originalKey={version.key || 'C'}
                                                        chords={version.chords}
                                                        songTitle={song.title}
                                                        leaderName={version.leader?.name || 'Unknown Leader'}
                                                    />
                                                ) : (
                                                    <p className="no-chords">No chords added yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2 className="modal-title">{editingVersion ? 'Edit Song Version' : 'Add Leader Version'}</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={16} /></button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-field">
                                        <label className="form-label">Song Leader <span className="req">*</span></label>
                                        <select value={leaderId} onChange={e => setLeaderId(e.target.value)} className="form-select" required>
                                            <option value="" disabled>Select a leader</option>
                                            {leaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="form-field">
                                        <label className="form-label">Key <span className="req">*</span></label>
                                        <select value={key} onChange={e => setKey(e.target.value)} className="form-select" required>
                                            {musicalKeys.map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    </div>

                                    <div className="form-field">
                                        <label className="form-label">Tempo / BPM</label>
                                        <input type="text" value={tempo} onChange={e => setTempo(e.target.value)} className="form-input" placeholder="e.g. 120 BPM, Slow" />
                                    </div>

                                    <div className="form-field">
                                        <label className="form-label">Special Notes</label>
                                        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="form-input" placeholder="e.g. Skip bridge" />
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '14px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, margin: '0 0 12px 0', borderBottom: '1px solid #f0ece8', paddingBottom: '8px' }}>Reference Links</h3>
                                <div className="form-grid" style={{ marginBottom: '24px' }}>
                                    <div className="form-field">
                                        <label className="form-label">YouTube Link</label>
                                        <input type="url" value={youtubeLink} onChange={e => setYoutubeLink(e.target.value)} className="form-input" placeholder="https://youtube.com/..." />
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label">Drive Link</label>
                                        <input type="url" value={driveLink} onChange={e => setDriveLink(e.target.value)} className="form-input" placeholder="https://drive.google.com/..." />
                                    </div>
                                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Chord Reference Link (Ultimate Guitar, etc.)</label>
                                        <input type="url" value={chordReference} onChange={e => setChordReference(e.target.value)} className="form-input" placeholder="https://..." />
                                    </div>
                                </div>

                                <div>
                                    <div className="chords-label">
                                        <Type size={13} /> Chords / Lyrics
                                    </div>
                                    <p className="chords-tip">Use spaces instead of tabs for consistent chord alignment across all devices.</p>
                                    <textarea
                                        value={chords}
                                        onChange={e => setChords(e.target.value)}
                                        className="chords-textarea"
                                        placeholder="Type or paste chords and lyrics here…"
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                                <button type="submit" className="btn-submit">
                                    {editingVersion ? 'Save Changes' : 'Create Version'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default SongDetails;