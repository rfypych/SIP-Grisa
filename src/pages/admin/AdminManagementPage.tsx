import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { UserPlus, Trash2, ShieldCheck, ShieldAlert, UserCog, ScanFace, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
  id: number;
  username: string;
  role: 'superadmin' | 'admin' | 'kiosk';
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'superadmin' | 'kiosk'>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const { token, user: currentUser } = useAuthStore();

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setAdmins(await res.json());
    } catch (e) {
      toast.error("Gagal memuat daftar admin");
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [token]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername) return toast.error("Username harus diisi");
    if (!editingId && !newPassword) return toast.error("Password harus diisi untuk akun baru");

    setIsLoading(true);
    try {
      const url = editingId ? `/api/admin/users/${editingId}` : '/api/admin/users';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          username: newUsername, 
          password: newPassword || undefined, 
          role: newRole 
        })
      });

      if (res.ok) {
        toast.success(editingId ? "Admin berhasil diperbarui" : "Admin baru berhasil dibuat");
        handleCancelEdit();
        fetchAdmins();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Gagal menyimpan data");
      }
    } catch (e) {
      toast.error("Kesalahan jaringan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (adm: AdminUser) => {
    setEditingId(adm.id);
    setNewUsername(adm.username);
    setNewRole(adm.role);
    setNewPassword(''); // Password opsional saat edit
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewUsername('');
    setNewPassword('');
    setNewRole('admin');
  };

  const handleDeleteAdmin = async (id: number) => {
    if (!confirm("Hapus akun admin ini?")) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Admin dihapus");
        fetchAdmins();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Gagal menghapus");
      }
    } catch (e) {
      toast.error("Kesalahan jaringan");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Akun Admin</h2>
        <p className="text-sm text-slate-500 mt-1">Kelola hak akses dan akun pengelola sistem.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Create */}
        <Card className="lg:col-span-1 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {editingId ? (
                <Pencil className="w-5 h-5 text-blue-600" />
              ) : (
                <UserPlus className="w-5 h-5 text-emerald-600" />
              )}
              {editingId ? 'Edit Akun Admin' : 'Tambah Admin Baru'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Username</label>
                <Input 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Username unik"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Password {editingId && <span className="text-[10px] lowercase font-normal italic">(Kosongkan jika tidak diubah)</span>}
                </label>
                <Input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={editingId ? "********" : "Min 8 karakter"}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Role</label>
                <select 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="admin">Admin Standar</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="kiosk">Akun Gerbang (Kios Only)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Button disabled={isLoading} className={`w-full font-bold ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                  {isLoading ? 'Proses...' : editingId ? 'Simpan Perubahan' : 'Simpan Akun'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit} className="w-full">
                    <X className="w-4 h-4 mr-2" /> Batal
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List Admins */}
        <Card className="lg:col-span-2 border-slate-200 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCog className="w-5 h-5 text-blue-600" />
              Daftar Pengelola Saat Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Username</th>
                    <th className="px-6 py-3">Hak Akses</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admins.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">{adm.username}</td>
                      <td className="px-6 py-4">
                        {adm.role === 'superadmin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                            <ShieldCheck className="w-3 h-3" /> Super Admin
                          </span>
                        ) : adm.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                            <ShieldAlert className="w-3 h-3" /> Administrator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                            <ScanFace className="w-3 h-3" /> Petugas Gerbang
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditClick(adm)}
                            className="text-blue-500 hover:bg-blue-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          
                          {adm.id !== currentUser?.id && adm.username !== 'grisa_super_admin_2026' ? (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteAdmin(adm.id)}
                              className="text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ) : (
                            <div className="w-10 h-10 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                                {adm.id === currentUser?.id ? 'Anda' : 'System'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
