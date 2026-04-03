'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import UserModal from '@/components/UserModal';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  client_id: number | null;
  client?: {
    name: string;
  } | null;
}

export default function TeamSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'admin') {
        router.push('/dashboard');
      } else {
        fetchUsers();
      }
    }
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingUser(null);
    fetchUsers();
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
        <Sidebar />
        <div className="flex-1 ml-60" style={{ backgroundColor: 'var(--bg-page)' }}>
          <TopBar title="Team Settings" />
          <div className="p-8 text-center" style={{ color: '#8b8b9e' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      <Sidebar />
      <div className="flex-1 ml-60" style={{ backgroundColor: 'var(--bg-page)' }}>
        <TopBar title="Team Settings" />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">Manage Team</h3>
            <button onClick={handleAdd} className="btn-teal">
              Add User
            </button>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(147,107,218,0.08) 0%, rgba(13,17,23,0.95) 50%, rgba(0,0,0,0.98) 100%)',
            border: '1px solid rgba(147,107,218,0.15)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(147,107,218,0.1)' }}>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#8b8b9e' }}>Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#8b8b9e' }}>Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#8b8b9e' }}>Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#8b8b9e' }}>Client</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#8b8b9e' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid rgba(147,107,218,0.06)',
                      background: hoveredRow === user.id ? 'rgba(147,107,218,0.04)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={() => setHoveredRow(user.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#8b8b9e' }}>{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize" style={{ color: '#8b8b9e' }}>{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#8b8b9e' }}>{user.client?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm" style={{ display: 'table-cell' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button onClick={() => handleEdit(user)} className="text-accent hover:text-accent/80 font-medium">Edit</button>
                        <button onClick={() => handleDelete(user.id)} className="text-red-400 hover:text-red-300 font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && <UserModal user={editingUser} onClose={handleModalClose} />}
    </div>
  );
}
