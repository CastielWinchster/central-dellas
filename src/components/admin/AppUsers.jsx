import React, { useState, useEffect, useMemo } from 'react';
import { User, Mail, Calendar, Search, Car, UserCheck, Bike } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { toBrasiliaDateOnly, toBrasiliaDateInput, todayBrasiliaDateInput } from '@/utils/dateUtils';
import { toast } from 'sonner';

function isDriverUser(u) {
  return u.user_type === 'driver' || u.user_type === 'both';
}

export default function AppUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

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

  const handleToggleRottaRoza = async (user, checked) => {
    setUpdatingId(user.id);
    try {
      await base44.entities.User.update(user.id, { is_rotta_roza: checked });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_rotta_roza: checked } : u)),
      );

      try {
        const presences = await base44.entities.DriverPresence.filter({ driver_id: user.id });
        if (presences[0]?.id) {
          const currentTags = presences[0].tags || [];
          const newTags = checked
            ? [...new Set([...currentTags, 'rotta_roza'])]
            : currentTags.filter((t) => t !== 'rotta_roza');
          await base44.entities.DriverPresence.update(presences[0].id, {
            vehicle_type: checked ? 'motorcycle' : 'car',
            tags: newTags,
          });
        }
      } catch (presenceErr) {
        console.warn('[AppUsers] DriverPresence sync:', presenceErr);
      }

      toast.success(
        checked
          ? `${user.full_name || 'Motorista'} marcada como Rotta Roza`
          : `${user.full_name || 'Motorista'} removida de Rotta Roza`,
      );
    } catch (error) {
      console.error('Error updating Rotta Roza:', error);
      toast.error('Erro ao atualizar Rotta Roza');
    } finally {
      setUpdatingId(null);
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

  const summary = useMemo(() => {
    const total = users.length;
    const todayStr = todayBrasiliaDateInput();
    const today = users.filter(u => toBrasiliaDateInput(u.created_date) === todayStr).length;
    const drivers = users.filter(isDriverUser).length;
    const rottaRoza = users.filter((u) => isDriverUser(u) && u.is_rotta_roza).length;
    return { total, today, drivers, rottaRoza };
  }, [users]);

  if (loading) {
    return (
      <Card className="bg-[#F2F2F2]/5 border-[#F472B6]/10 p-8 text-center">
        <p className="text-[#F2F2F2]/60">Carregando usuárias...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-[#F2F2F2]/5 border-[#F472B6]/10 p-4 text-center">
          <UserCheck className="w-6 h-6 text-[#F472B6] mx-auto mb-1" />
          <p className="text-xs text-[#F2F2F2]/50">Total cadastradas</p>
          <p className="text-2xl font-bold text-[#F2F2F2]">{summary.total}</p>
        </Card>
        <Card className="bg-[#F2F2F2]/5 border-[#F472B6]/10 p-4 text-center">
          <Calendar className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <p className="text-xs text-[#F2F2F2]/50">Cadastros hoje</p>
          <p className="text-2xl font-bold text-green-400">{summary.today}</p>
        </Card>
        <Card className="bg-[#F2F2F2]/5 border-[#F472B6]/10 p-4 text-center">
          <Car className="w-6 h-6 text-blue-400 mx-auto mb-1" />
          <p className="text-xs text-[#F2F2F2]/50">Motoristas</p>
          <p className="text-2xl font-bold text-blue-400">{summary.drivers}</p>
        </Card>
        <Card className="bg-[#F2F2F2]/5 border-[#F472B6]/10 p-4 text-center">
          <Bike className="w-6 h-6 text-pink-400 mx-auto mb-1" />
          <p className="text-xs text-[#F2F2F2]/50">Rotta Roza</p>
          <p className="text-2xl font-bold text-pink-400">{summary.rottaRoza}</p>
        </Card>
      </div>

      <Card className="bg-[#F2F2F2]/5 border-[#F472B6]/10 p-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[#F472B6] flex-shrink-0" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#0D0D0D] border-[#F472B6]/20 text-white"
          />
        </div>
      </Card>

      <div className="space-y-2">
        {filtered.map((u) => {
          const isDriver = isDriverUser(u);
          return (
            <Card key={u.id} className="bg-[#F2F2F2]/5 border-[#F472B6]/10 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#EC4899] to-[#BE185D] flex items-center justify-center">
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

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex gap-1 flex-wrap justify-end">
                    {u.role === 'admin' && <Badge className="bg-[#F472B6]">Admin</Badge>}
                    {isDriver && <Badge className="bg-blue-500">Motorista</Badge>}
                    {u.is_rotta_roza && <Badge className="bg-pink-500">Rotta Roza</Badge>}
                  </div>

                  {isDriver && (
                    <label className="flex items-center gap-2 text-xs text-[#F2F2F2]/70 cursor-pointer">
                      <Bike className="w-3.5 h-3.5 text-pink-400" />
                      <span>Moto</span>
                      <Switch
                        checked={!!u.is_rotta_roza}
                        disabled={updatingId === u.id}
                        onCheckedChange={(checked) => handleToggleRottaRoza(u, checked)}
                        className="data-[state=checked]:bg-pink-500"
                      />
                    </label>
                  )}

                  <div className="flex items-center gap-1 text-xs text-[#F2F2F2]/50">
                    <Calendar className="w-3 h-3" />
                    <span>{toBrasiliaDateOnly(u.created_date)}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card className="bg-[#F2F2F2]/5 border-[#F472B6]/10 p-8 text-center">
            <p className="text-[#F2F2F2]/60">Nenhuma usuária encontrada</p>
          </Card>
        )}
      </div>
    </div>
  );
}
