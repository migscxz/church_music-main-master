import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, X, Edit3, Trash2 } from 'lucide-react';

interface User {
    id: number;
    name: string;
}

interface WeekSchedule {
    date: string; // YYYY-MM-DD
    assignments: Record<string, string>;
}

interface Schedule {
    id: number;
    month_year: string; // "YYYY-MM"
    weeks: WeekSchedule[];
}

const DEFAULT_ROLES = [
    'Song Leader',
    'Back-up 1',
    'Back-up 2',
    'Backup Trainee',
    'Keyboard',
    'Lead Guitar',
    'Rhythm Guitar',
    'Bass Guitar',
    'Drum',
    'Devotion/Prayer'
];

// Helper to get all Sundays in a given YYYY-MM
const getSundaysInMonth = (monthYear: string): string[] => {
    if (!monthYear) return [];
    const [yearStr, monthStr] = monthYear.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed

    const sundays: string[] = [];
    const date = new Date(year, month, 1);

    // Find the first Sunday
    while (date.getDay() !== 0) {
        date.setDate(date.getDate() + 1);
    }

    // Get all Sundays in the month
    while (date.getMonth() === month) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        sundays.push(`${y}-${m}-${d}`);
        date.setDate(date.getDate() + 7);
    }

    return sundays;
};

const SchedulePage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
    
    // Form state
    const [monthYear, setMonthYear] = useState('');
    const [weeks, setWeeks] = useState<WeekSchedule[]>([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [schedulesRes, usersRes] = await Promise.all([
                api.get('/schedules'),
                api.get('/users')
            ]);
            setSchedules(schedulesRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // When monthYear changes in the form, regenerate weeks if it's a new creation
    useEffect(() => {
        if (!editingSchedule && monthYear) {
            const sundays = getSundaysInMonth(monthYear);
            setWeeks(sundays.map(date => ({ date, assignments: {} })));
        }
    }, [monthYear, editingSchedule]);

    const openCreateModal = () => {
        setEditingSchedule(null);
        // Default to current month
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        setMonthYear(currentMonth);
        setIsModalOpen(true);
    };

    const openEditModal = (schedule: Schedule) => {
        setEditingSchedule(schedule);
        setMonthYear(schedule.month_year);
        // Deep copy weeks to avoid mutating state directly
        setWeeks(JSON.parse(JSON.stringify(schedule.weeks || [])));
        setIsModalOpen(true);
    };

    const handleAssignmentChange = (weekIndex: number, role: string, value: string) => {
        setWeeks(prevWeeks => {
            const newWeeks = [...prevWeeks];
            newWeeks[weekIndex] = {
                ...newWeeks[weekIndex],
                assignments: {
                    ...newWeeks[weekIndex].assignments,
                    [role]: value
                }
            };
            return newWeeks;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                month_year: monthYear,
                weeks
            };

            if (editingSchedule) {
                await api.put(`/schedules/${editingSchedule.id}`, payload);
            } else {
                await api.post('/schedules', payload);
            }
            
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            console.error('Error saving schedule:', error);
            alert(error.response?.data?.message || 'Failed to save schedule. This month may already exist.');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this ENTIRE month schedule?')) {
            try {
                await api.delete(`/schedules/${id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting schedule:', error);
            }
        }
    };

    // Format YYYY-MM to readable string "June 2026"
    const formatMonthYear = (my: string) => {
        if (!my) return '';
        const [y, m] = my.split('-');
        const date = new Date(parseInt(y), parseInt(m) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const formatDay = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getDate()}-${d.toLocaleString('en-US', { month: 'short' })}-${d.getFullYear().toString().substr(-2)}`;
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
            <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#c9a84c' }} 
            />
            <span style={{ fontFamily: "'DM Sans', sans-serif", color: '#888', fontSize: 14 }}>Loading schedules…</span>
        </div>
    );

    return (
        <>
            <style>{`
                .schedule-hero {
                    background: #0f1117; border-radius: 16px; padding: 28px 32px;
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 32px; position: relative; overflow: hidden; flex-wrap: wrap; gap: 20px;
                }
                .schedule-hero::after {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent);
                }
                .hero-icon {
                    width: 52px; height: 52px; border-radius: 12px;
                    background: rgba(201,168,76,0.12); border: 1.5px solid rgba(201,168,76,0.25);
                    display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
                }
                .hero-title {
                    font-family: 'Cormorant Garamond', serif; font-size: 32px;
                    font-weight: 700; color: #f0ede8; margin: 0 0 6px 0;
                }
                .hero-sub {
                    font-size: 13.5px; color: rgba(240,237,232,0.5); margin: 0;
                }
                .btn-add {
                    display: inline-flex; align-items: center; gap: 8px;
                    background: rgba(201,168,76,0.15); border: 1.5px solid rgba(201,168,76,0.3);
                    color: #c9a84c; border-radius: 10px; padding: 10px 20px;
                    font-weight: 600; cursor: pointer; transition: all 0.15s;
                }
                
                .schedule-table-container {
                    background: #fff;
                    border-radius: 14px;
                    border: 1px solid #ede9e4;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    overflow-x: auto;
                    margin-bottom: 40px;
                }
                
                .schedule-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }
                
                .schedule-table th, .schedule-table td {
                    padding: 12px 16px;
                    border: 1px solid #ede9e4;
                }
                
                .schedule-table th {
                    font-weight: 600;
                    color: #1a1814;
                    background: #f2eeea;
                }
                
                .month-header {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 18px;
                    font-weight: 700;
                    background: #ede9e4 !important;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .role-cell {
                    font-weight: 600;
                    color: #6a6560;
                    background: #faf8f5;
                    white-space: nowrap;
                    text-transform: uppercase;
                    font-size: 11px;
                    letter-spacing: 0.05em;
                    width: 180px;
                }

                .assignment-cell {
                    font-weight: 500;
                    color: #1a1814;
                    min-width: 140px;
                }

                .date-header {
                    text-align: center;
                    font-size: 14px;
                }
                
                .admin-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .action-btn {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: #a09a94;
                    padding: 4px;
                    border-radius: 4px;
                }
                
                .action-btn:hover {
                    background: #f0ece8;
                    color: #1a1814;
                }

                /* Modals */
                .modal-overlay { position: fixed; inset: 0; background: rgba(15,17,23,0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 24px; }
                .modal-card { background: #fff; border-radius: 18px; width: 100%; max-width: 1100px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
                .modal-header { padding: 20px 24px; border-bottom: 1px solid #f0ece8; display: flex; justify-content: space-between; align-items: center; }
                .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; margin: 0; }
                .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
                .modal-footer { padding: 16px 24px; border-top: 1px solid #f0ece8; background: #faf8f5; display: flex; justify-content: flex-end; gap: 10px; }
                
                .form-field { margin-bottom: 16px; }
                .form-label { display: block; font-size: 11px; font-weight: 700; color: #8a8680; text-transform: uppercase; margin-bottom: 6px; }
                .form-input { width: 100%; border: 1.5px solid #e8e4df; border-radius: 10px; padding: 10px 14px; outline: none; transition: border-color 0.2s; font-family: inherit; }
                .form-input:focus { border-color: #c9a84c; }
                
                .btn-ghost { background: transparent; border: none; color: #6a6560; font-weight: 600; cursor: pointer; padding: 9px 18px; border-radius: 10px; transition: background 0.2s; }
                .btn-ghost:hover { background: #f2eeea; }
                .btn-submit { background: #0f1117; color: #f0ede8; border: none; font-weight: 600; cursor: pointer; padding: 9px 18px; border-radius: 10px; transition: background 0.2s; }
                .btn-submit:hover { background: #1a1a1a; }
                
                .edit-grid {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 16px;
                }
                .edit-grid th, .edit-grid td {
                    border: 1px solid #e8e4df;
                    padding: 10px;
                }
                .edit-grid th {
                    background: #faf8f5;
                    font-size: 13px;
                    font-weight: 600;
                    text-align: center;
                }
                .edit-grid .role-col {
                    background: #faf8f5;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: #8a8680;
                    width: 150px;
                }
                .edit-select {
                    width: 100%;
                    padding: 8px;
                    border-radius: 6px;
                    border: 1px solid #e8e4df;
                    background: #fff;
                    font-family: inherit;
                    font-size: 13px;
                }
            `}</style>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="schedule-hero"
            >
                <div>
                    <div className="hero-icon">
                        <Calendar size={24} color="#c9a84c" />
                    </div>
                    <h1 className="hero-title">Ministry Schedule</h1>
                    <p className="hero-sub">Manage team line-ups for upcoming services, planned by month.</p>
                </div>
                {isAdmin && (
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={openCreateModal} 
                        className="btn-add"
                    >
                        <Plus size={16} /> Plan Month
                    </motion.button>
                )}
            </motion.div>

            {schedules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#a09a94' }}>
                    <Calendar size={48} color="#e0dbd5" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: 18, color: '#1a1814', marginBottom: 8 }}>No Schedules Found</h3>
                    <p>There are no monthly schedules set up yet.</p>
                </div>
            ) : (
                schedules.map(schedule => (
                    <div key={schedule.id} className="schedule-table-container">
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #ede9e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#faf8f5' }}>
                            <h2 className="month-header" style={{ margin: 0, background: 'transparent' }}>{formatMonthYear(schedule.month_year)}</h2>
                            {isAdmin && (
                                <div className="admin-actions">
                                    <button onClick={() => openEditModal(schedule)} className="action-btn" title="Edit Month"><Edit3 size={16} /></button>
                                    <button onClick={() => handleDelete(schedule.id)} className="action-btn" title="Delete Month"><Trash2 size={16} /></button>
                                </div>
                            )}
                        </div>
                        <table className="schedule-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 180 }}>Role</th>
                                    {schedule.weeks.map((week, idx) => (
                                        <th key={idx} className="date-header">
                                            {formatDay(week.date)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {DEFAULT_ROLES.map(role => (
                                    <tr key={role}>
                                        <td className="role-cell">{role}</td>
                                        {schedule.weeks.map((week, idx) => (
                                            <td key={idx} className="assignment-cell">
                                                {week.assignments[role] || ''}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))
            )}

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
                                <h2 className="modal-title">{editingSchedule ? `Edit ${formatMonthYear(editingSchedule.month_year || monthYear)}` : 'Plan New Month'}</h2>
                                <button className="action-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
                                <div className="modal-body">
                                    <div className="form-field" style={{ maxWidth: 300 }}>
                                        <label className="form-label">Select Month</label>
                                        <input 
                                            type="month" 
                                            value={monthYear} 
                                            onChange={e => setMonthYear(e.target.value)} 
                                            className="form-input" 
                                            required 
                                            disabled={!!editingSchedule} // Cannot change month once created
                                        />
                                    </div>
                                    
                                    {weeks.length > 0 && (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="edit-grid">
                                                <thead>
                                                    <tr>
                                                        <th className="role-col">Role</th>
                                                        {weeks.map((week, idx) => (
                                                            <th key={idx}>{formatDay(week.date)}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {DEFAULT_ROLES.map(role => (
                                                        <tr key={role}>
                                                            <td className="role-col">{role}</td>
                                                            {weeks.map((week, weekIdx) => (
                                                                <td key={weekIdx}>
                                                                    <select
                                                                        value={week.assignments[role] || ''}
                                                                        onChange={e => handleAssignmentChange(weekIdx, role, e.target.value)}
                                                                        className="edit-select"
                                                                    >
                                                                        <option value="">-</option>
                                                                        {users.map(u => (
                                                                            <option key={u.id} value={u.name}>{u.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
                                    <button type="submit" className="btn-submit">Save Month Schedule</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SchedulePage;
