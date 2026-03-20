import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { UserPlus, Trash2, ShieldCheck, ShieldAlert, UserCog, ScanFace } from 'lucide-react';
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
    if (!newUsername || !newPassword) return toast.error("Isi semua field");

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
      });

      if (res.ok) {
        toast.success("Admin baru berhasil dibuat");
        setNewUsername('');
        setNewPassword('');
        fetchAdmins();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Gagal membuat admin");
      }
    } catch (e) {
      toast.error("Kesalahan jaringan");
    } finally {
      setIsLoading(false);
    }
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
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Tambah Admin Baru
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
                <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
                <Input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 karakter"
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
              <Button disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold">
                {isLoading ? 'Proses...' : 'Simpan Akun'}
              </Button>
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
                        {adm.id !== currentUser?.id && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteAdmin(adm.id)}
                            className="text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        {adm.id === currentUser?.id && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase italic">Anda</span>
                        )}
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
