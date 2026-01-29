import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { UserX, Trash2, ChevronLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function BlockedUsers() {
  const [user, setUser] = useState(null);
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const blockedList = await base44.entities.BlockedUser.filter({ user_id: userData.id });
      
      const blockedWithInfo = await Promise.all(
        blockedList.map(async (block) => {
          const blockedUserInfo = await base44.entities.User.filter({ id: block.blocked_user_id });
          return {
            ...block,
            blockedUser: blockedUserInfo[0]
          };
        })
      );
      
      setBlocked(blockedWithInfo);
    } catch (error) {
      console.error('Erro ao carregar:', error);
      base44.auth.redirectToLogin();
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockId, userName) => {
    if (!confirm(`Desbloquear ${userName}?`)) return;
    
    try {
      await base44.entities.BlockedUser.delete(blockId);
      toast.success('Usuária desbloqueada');
      loadData();
    } catch (error) {
      toast.error('Erro ao desbloquear');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-10">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('PassengerOptions')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#F2F2F2]">Usuárias Bloqueadas</h1>
        </div>

        {/* Info */}
        <Card className="p-4 mb-6 bg-blue-500/10 border-blue-500/30 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-200 font-medium">Privacidade e Segurança</p>
              <p className="text-xs text-blue-200/70 mt-1">
                Motoristas bloqueadas não verão suas solicitações de corrida e vice-versa.
              </p>
            </div>
          </div>
        </Card>

        {/* Empty State */}
        {blocked.length === 0 && (
          <Card className="p-8 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl text-center">
            <UserX className="w-12 h-12 text-[#F22998]/50 mx-auto mb-3" />
            <p className="text-[#F2F2F2]/60 mb-2">Nenhuma usuária bloqueada</p>
            <p className="text-sm text-[#F2F2F2]/40">
              Você pode bloquear motoristas durante ou após uma corrida
            </p>
          </Card>
        )}

        {/* Blocked List */}
        <div className="space-y-3">
          {blocked.map((block) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                      <UserX className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#F2F2F2]">
                        {block.blockedUser?.full_name || 'Usuária'}
                      </h3>
                      {block.reason && (
                        <p className="text-sm text-[#F2F2F2]/60 mt-1">
                          Motivo: {block.reason}
                        </p>
                      )}
                      <p className="text-xs text-[#F2F2F2]/40 mt-1">
                        Bloqueado em {format(new Date(block.created_date), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleUnblock(block.id, block.blockedUser?.full_name || 'usuária')}
                    variant="outline"
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    Desbloquear
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}