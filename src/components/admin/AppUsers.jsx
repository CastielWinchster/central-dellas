import React, { useState, useEffect, useMemo } from 'react';
import { User, Mail, Calendar, Search, Car, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toBrasiliaDateOnly, toBrasiliaDateInput, todayBrasiliaDateInput } from '@/utils/dateUtils';

export default function AppUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await base44.entities.User.list('-created_date', 1000);
      setUsers(allUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(u =>
      (u.full_name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Métricas de cadastro
  const summary = useMemo(() => {
    const total = users.length;
    const todayStr = todayBrasiliaDateInput();
    const today = users.filter(u => toBrasiliaDateInput(u.created_date) === todayStr).length;
    const drivers = users.filter(u => u.user_type === 'driver' || u.user_type === 'both').length;
    return { total, today, drivers };
  }, [users]);

  if (loading) {
    return (
      <Card className="bg-[#F2F2F2]/5 border-[#A855F7]/10 p-8 text-center">
        <p className="text-[#F2F2F2]/60">Carregando usuárias...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Métricas de download/cadastro */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-[#F2F2F2]/5 border-[#A855F7]/10 p-4 text-center">
          <UserCheck className="w-6 h-6 text-[#A855F7] mx-auto mb-1" />
          <p className="text-xs text-[#F2F2F2]/50">Total cadastradas</p>
          <p className="text-2xl font-bold text-[#F2F2F2]">{summary.total}</p>
        </Card>
        <Card className="bg-[#F2F2F2]/5 border-[#A855F7]/10 p-4 text-center">
          <Calendar className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <p className="text-xs text-[#F2F2F2]/50">Cadastros hoje</p>
          <p className="text-2xl font-bold text-green-400">{summary.today}</p>
        </Card>
        <Card className="bg-[#F2F2F2]/5 border-[#A855F7]/10 p-4 text-center">
          <Car className="w-6 h-6 text-blue-400 mx-auto mb-1" />
          <p className="text-xs text-[#F2F2F2]/50">Motoristas</p>
          <p className="text-2xl font-bold text-blue-400">{summary.drivers}</p>
        </Card>
      </div>

      {/* Busca */}
      <Card className="bg-[#F2F2F2]/5 border-[#A855F7]/10 p-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[#A855F7] flex-shrink-0" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#0D0D0D] border-[#A855F7]/20 text-white"
          />
        </div>
      </Card>

      {/* Lista de usuárias */}
      <div className="space-y-2">
        {filtered.map((u) => (
          <Card key={u.id} className="bg-[#F2F2F2]/5 border-[#A855F7]/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex items-center justify-center">
                  {u.photo_url
                    ? <img src={u.photo_url} alt={u.full_name} className="w-full h-full object-cover" />
                    : <User className="w-5 h-5 text-white" />
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-[#F2F2F2] font-medium truncate">{u.full_name || 'Sem nome'}</p>
                  <div className="flex items-center gap-1 text-xs text-[#F2F2F2]/50 truncate">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="flex gap-1">
                  {u.role === 'admin' && <Badge className="bg-[#A855F7]">Admin</Badge>}
                  {(u.user_type === 'driver' || u.user_type === 'both') && (
                    <Badge className="bg-blue-500">Motorista</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-[#F2F2F2]/50">
                  <Calendar className="w-3 h-3" />
                  <span>{toBrasiliaDateOnly(u.created_date)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card className="bg-[#F2F2F2]/5 border-[#A855F7]/10 p-8 text-center">
            <p className="text-[#F2F2F2]/60">Nenhuma usuária encontrada</p>
          </Card>
        )}
      </div>
    </div>
  );
}