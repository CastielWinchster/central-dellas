import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function DeleteAccountDialog({ open, onOpenChange }) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === 'EXCLUIR';

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    try {
      await base44.functions.invoke('deleteMyAccount', {});
      toast.success('Sua conta foi excluída.');
      setTimeout(async () => {
        await base44.auth.logout(window.location.origin);
      }, 1200);
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast.error('Não foi possível excluir a conta. Tente novamente ou contate o suporte.');
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#1A1A1A] border border-red-500/40 text-[#F2F2F2]">
        <AlertDialogHeader>
          <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mb-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <AlertDialogTitle className="text-[#F2F2F2]">Excluir minha conta</AlertDialogTitle>
          <AlertDialogDescription className="text-[#F2F2F2]/70">
            Esta ação é permanente e não pode ser desfeita. Todos os seus dados (perfil,
            endereços, favoritos, carteira, mensagens e preferências) serão removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2">
          <label className="text-sm text-[#F2F2F2]/70 mb-2 block">
            Digite <strong className="text-red-400">EXCLUIR</strong> para confirmar:
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="EXCLUIR"
            className="bg-[#2A2A2A] border-[#EC4899]/30 text-[#F2F2F2]"
          />
        </div>

        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 bg-[#2A2A2A] border-[#EC4899]/30 text-[#F2F2F2] hover:bg-[#3A3A3A]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!canDelete || loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </>
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}