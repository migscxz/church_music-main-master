import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Shield, Edit3, Trash2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserData {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'leader' | 'member';
    created_at: string;
}

const Users = () => {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'leader' | 'member'>('member');

    // React Query Hooks
    const { data: users = [], isLoading: loadingUsers } = useQuery<UserData[]>({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(res => res.data),
        enabled: currentUser?.role === 'admin'
    });

    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editingUser) {
                return api.put(`/users/${editingUser.id}`, payload);
            } else {
                return api.post('/users', payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsModalOpen(false);
        },
        onError: (error: any) => {
            console.error("Failed to save user", error);
            alert(error.response?.data?.message || "Error saving user.");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/users/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
        onError: (error: any) => {
            console.error("Failed to delete user", error);
            alert(error.response?.data?.message || "Failed to delete user.");
        }
    });

    const openCreateModal = () => {
        setEditingUser(null);
        setName('');
        setEmail('');
        setPassword('');
        setRole('member');
        setIsModalOpen(true);
    };

    const openEditModal = (user: UserData) => {
        setEditingUser(user);
        setName(user.name);
        setEmail(user.email);
        setPassword('');
        setRole(user.role);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: any = { name, email, role };
        if (password) payload.password = password;
        saveMutation.mutate(payload);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to deactivate and delete this user?')) return;
        deleteMutation.mutate(id);
    };

    if (currentUser?.role !== 'admin') {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', padding: '100px 20px', color: '#8a8680' }}
            >
                <Shield size={48} style={{ opacity: 0.2, marginBottom: 20 }} />
                <h3>Access Denied</h3>
                <p>You do not have administrative privileges to view this page.</p>
            </motion.div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <div className="users-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

                .users-page { font-family: 'DM Sans', sans-serif; color: #1a1814; }
                .header-section { margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; }
                .page-title { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 700; color: #0f1117; margin: 0 0 4px 0; }
                .page-desc { font-size: 14px; color: #8a8680; margin: 0; }
                
                .btn-primary {
                    display: inline-flex; align-items: center; gap: 7px;
                    background: #0f1117; color: #f0ede8;
                    border: none; border-radius: 10px; padding: 10px 18px;
                    font-size: 13.5px; font-weight: 500; cursor: pointer; transition: all 0.2s;
                }
                .btn-primary:hover { background: #1e2130; transform: translateY(-1px); }

                .users-card {
                    background: #fff; border-radius: 14px; border: 1.5px solid #ede9e4;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.02); overflow: hidden;
                }

                .users-table { width: 100%; border-collapse: collapse; text-align: left; }
                .users-table th { padding: 16px 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #a09d98; border-bottom: 1.5px solid #ede9e4; background: #faf9f7; }
                .users-table td { padding: 16px 20px; font-size: 14px; color: #1a1814; border-bottom: 1px solid #f5f3f0; vertical-align: middle; }
                
                .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: rgba(201,168,76,0.1); color: #c9a84c; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; }
                
                .role-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
                .role-admin { background: rgba(220, 38, 38, 0.1); color: #dc2626; }
                .role-leader { background: rgba(14, 165, 233, 0.1); color: #0ea5e9; }
                .role-pianist { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
                .role-member { background: rgba(138, 134, 128, 0.1); color: #8a8680; }

                .action-btn { width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid #ede9e4; display: inline-flex; align-items: center; justify-content: center; background: transparent; cursor: pointer; color: #a09d98; transition: all 0.2s; }
                .action-btn:hover { background: #f7f5f2; color: #1a1814; border-color: #d0ccc7; }
                .action-btn.delete:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(15,17,23,0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 24px; }
                .modal-card { background: #fff; width: 100%; max-width: 440px; border-radius: 18px; overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,0.22); }
                .modal-header { padding: 20px 24px; border-bottom: 1px solid #f0ece8; display: flex; justify-content: space-between; align-items: center; background: #faf8f5; }
                .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; color: #0f1117; margin: 0; }
                .modal-body { padding: 24px; }
                .form-field { margin-bottom: 20px; }
                .form-label { display: block; font-size: 12px; font-weight: 600; color: #5a5550; margin-bottom: 8px; text-transform: uppercase; }
                .form-input, .form-select { width: 100%; padding: 11px 14px; border: 1.5px solid #e8e4df; border-radius: 10px; font-size: 14px; outline: none; }
                .form-input:focus, .form-select:focus { border-color: #c9a84c; }
                .modal-footer { padding: 16px 24px; border-top: 1px solid #f0ece8; display: flex; justify-content: flex-end; gap: 10px; background: #faf8f5; }
                .btn-ghost { padding: 9px 18px; border-radius: 10px; background: #ede9e4; border: none; font-size: 13.5px; font-weight: 500; cursor: pointer; }
            `}</style>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="header-section">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-desc">Manage system access, roles, and administrative privileges.</p>
                </div>
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openCreateModal} 
                    className="btn-primary"
                >
                    <Plus size={16} /> Register User
                </motion.button>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="users-card"
            >
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email Address</th>
                            <th>System Role</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <motion.tbody
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                    >
                        {loadingUsers ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: '#a09d98' }}>Loading users...</td></tr>
                        ) : users.map(u => (
                            <motion.tr key={u.id} variants={itemVariants}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div className="user-avatar">{u.name.charAt(0)}</div>
                                        <strong style={{ fontWeight: 600 }}>{u.name}</strong>
                                    </div>
                                </td>
                                <td style={{ color: '#5a5550' }}>{u.email}</td>
                                <td>
                                    <span className={`role-badge role-${u.role}`}>{u.role}</span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'inline-flex', gap: 6 }}>
                                        <button className="action-btn" title="Edit details" onClick={() => openEditModal(u)}>
                                            <Edit3 size={15} />
                                        </button>
                                        <button className="action-btn delete" title="Delete user" onClick={() => handleDelete(u.id)}>
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </motion.tbody>
                </table>
            </motion.div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="modal-card" 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2 className="modal-title">{editingUser ? 'Edit User Profile' : 'Register New User'}</h2>
                                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#a09d98' }} onClick={() => setIsModalOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <form id="user-form" onSubmit={handleSubmit}>
                                    <div className="form-field">
                                        <label className="form-label">Full Name</label>
                                        <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label">Email Address</label>
                                        <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label">System Role</label>
                                        <select className="form-select" value={role} onChange={e => setRole(e.target.value as any)} required>
                                            <option value="member">Member (View Only)</option>
                                            <option value="leader">Song Leader (Manage Own Songs)</option>
                                            <option value="pianist">Pianist / Arranger (Manage All Songs)</option>
                                            <option value="admin">Administrator (Full Access)</option>
                                        </select>
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label">{editingUser ? 'Reset Password (optional)' : 'Temporary Password'}</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder={editingUser ? "Leave blank to keep current" : "Min 8 characters"}
                                            required={!editingUser}
                                            minLength={8}
                                        />
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" form="user-form" className="btn-primary" style={{ background: '#0f1117' }}>
                                    {editingUser ? 'Save Changes' : 'Register User'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Users;
