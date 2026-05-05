import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Shield, Edit3, Trash2, Plus, X } from 'lucide-react';

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
        setPassword(''); // Always reset password field, only send if changing
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
        if (!confirm('Are you sure you want to deactivate and delete this user? This cannot be undone.')) return;
        deleteMutation.mutate(id);
    };

    if (currentUser?.role !== 'admin') {
        return (
            <div style={{ textAlign: 'center', padding: '100px 20px', color: '#8a8680' }}>
                <Shield size={48} style={{ opacity: 0.2, marginBottom: 20 }} />
                <h3>Access Denied</h3>
                <p>You do not have administrative privileges to view this page.</p>
            </div>
        );
    }

    return (
        <div className="users-page">
            <style>{`
                .header-section { margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; }
                .page-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 700; color: #1a1814; margin: 0 0 8px 0; }
                .page-desc { font-size: 15px; color: #8a8680; margin: 0; }
                
                .btn-primary {
                    background: #c9a84c; color: #fff; border: none; padding: 10px 20px; border-radius: 8px;
                    font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;
                    transition: all 0.2s;
                }
                .btn-primary:hover { background: #b59540; transform: translateY(-1px); }

                .users-card {
                    background: #fff; border-radius: 12px; border: 1px solid #ede9e4;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.02); overflow: hidden;
                }

                .users-table { width: 100%; border-collapse: collapse; text-align: left; }
                .users-table th { padding: 16px 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #a09d98; border-bottom: 1px solid #ede9e4; background: #faf9f7; }
                .users-table td { padding: 16px 20px; font-size: 14px; color: #1a1814; border-bottom: 1px solid #f5f3f0; vertical-align: middle; }
                
                .user-cell { display: flex; align-items: center; gap: 12px; }
                .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: rgba(201,168,76,0.1); color: #c9a84c; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; }
                
                .role-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
                .role-admin { background: rgba(220, 38, 38, 0.1); color: #dc2626; }
                .role-leader { background: rgba(14, 165, 233, 0.1); color: #0ea5e9; }
                .role-member { background: rgba(138, 134, 128, 0.1); color: #8a8680; }

                .actions-cell { text-align: right; }
                .actions-group { display: inline-flex; gap: 6px; }
                .action-btn { width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--sidebar-border); display: inline-flex; align-items: center; justify-content: center; background: transparent; cursor: pointer; color: #a09d98; transition: all 0.2s; }
                .action-btn:hover { background: #f7f5f2; color: #1a1814; border-color: #d0ccc7; }
                .action-btn.delete:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }

                /* Modal Styles */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
                .modal-content { background: #fff; width: 100%; max-width: 460px; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); display: flex; flex-direction: column; max-height: 90vh; }
                .modal-header { padding: 24px 28px; border-bottom: 1px solid #ede9e4; display: flex; justify-content: space-between; align-items: center; background: #faf9f7; }
                .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; color: #1a1814; margin: 0; }
                .modal-close { background: transparent; border: none; cursor: pointer; color: #a09d98; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.2s; }
                .modal-close:hover { background: rgba(0,0,0,0.05); color: #1a1814; }
                .modal-body { padding: 28px; overflow-y: auto; }
                .form-group { margin-bottom: 20px; }
                .form-label { display: block; font-size: 13px; font-weight: 600; color: #5a5550; margin-bottom: 8px; }
                .form-input, .form-select { width: 100%; padding: 12px 14px; border: 1px solid #d0ccc7; border-radius: 8px; font-family: inherit; font-size: 14px; color: #1a1814; background: #fff; outline: none; transition: border-color 0.2s; }
                .form-input:focus, .form-select:focus { border-color: #c9a84c; }
                .modal-footer { padding: 20px 28px; border-top: 1px solid #ede9e4; display: flex; justify-content: flex-end; gap: 12px; background: #faf9f7; }
                .btn-secondary { background: #f0ede8; color: #5a5550; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
                .btn-secondary:hover { background: #e6e2db; }
            `}</style>

            <div className="header-section">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-desc">Manage system access, roles, and administrative privileges.</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary">
                    <Plus size={16} /> Register User
                </button>
            </div>

            <div className="users-card">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email Address</th>
                            <th>System Role</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingUsers ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#a09d98' }}>Loading users...</td></tr>
                        ) : users.map(u => (
                            <tr key={u.id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar">{u.name.charAt(0)}</div>
                                        <strong style={{ fontWeight: 600 }}>{u.name}</strong>
                                    </div>
                                </td>
                                <td style={{ color: '#5a5550' }}>{u.email}</td>
                                <td>
                                    <span className={`role-badge role-${u.role}`}>{u.role}</span>
                                </td>
                                <td className="actions-cell">
                                    <div className="actions-group">
                                        <button className="action-btn" title="Edit details" onClick={() => openEditModal(u)}>
                                            <Edit3 size={15} />
                                        </button>
                                        <button className="action-btn delete" title="Deactivate user" onClick={() => handleDelete(u.id)}>
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* User Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingUser ? 'Edit User Profile' : 'Register New User'}</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <form id="user-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">System Role</label>
                                    <select className="form-select" value={role} onChange={e => setRole(e.target.value as any)} required>
                                        <option value="member">Member (View Only)</option>
                                        <option value="leader">Song Leader (Manage Own Songs)</option>
                                        <option value="admin">Administrator (Full Access)</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">
                                        {editingUser ? 'Reset Password (optional)' : 'Temporary Password'}
                                    </label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder={editingUser ? "Leave blank to keep current" : "Enter temporary password"}
                                        required={!editingUser}
                                        minLength={8}
                                    />
                                    <p style={{ fontSize: 11, color: '#a09d98', marginTop: 6, marginBottom: 0 }}>
                                        Must be at least 8 characters long.
                                    </p>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button type="submit" form="user-form" className="btn-primary">
                                {editingUser ? 'Save Changes' : 'Register User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
