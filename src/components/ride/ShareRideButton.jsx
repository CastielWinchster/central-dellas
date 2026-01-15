import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ShareRideButton({ ride, passenger }) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [contacts, setContacts] = useState([
    { name: '', phone: '' }
  ]);

  const generateShareLink = async () => {
    try {
      // Gerar token único
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      // Criar registro de rastreamento
      await base44.entities.SharedTracking.create({
        ride_id: ride.id,
        passenger_id: passenger.id,
        share_token: token,
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
      });

      // Gerar link
      const link = `${window.location.origin}/TrackRide?token=${token}`;
      setShareLink(link);
      
      return link;
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error('Erro ao gerar link de compartilhamento');
      return null;
    }
  };

  const handleShare = async () => {
    setIsOpen(true);
    
    if (!shareLink) {
      const link = await generateShareLink();
      if (!link) return;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success('Link copiado! Cole no WhatsApp');
    
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const message = `🚗 Olá! Estou em uma corrida da Central Dellas e quero que você acompanhe meu trajeto.\n\nAcompanhe em tempo real aqui:\n${shareLink}\n\n💕 Central Dellas - Mobilidade segura para mulheres`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const addContact = () => {
    setContacts([...contacts, { name: '', phone: '' }]);
  };

  const updateContact = (index, field, value) => {
    const updated = [...contacts];
    updated[index][field] = value;
    setContacts(updated);
  };

  const saveContacts = async () => {
    try {
      // Salvar contatos de confiança no perfil
      await base44.auth.updateMe({
        emergency_contacts: contacts.filter(c => c.name && c.phone)
      });
      
      toast.success('Contatos salvos com sucesso!');
    } catch (error) {
      console.error('Error saving contacts:', error);
      toast.error('Erro ao salvar contatos');
    }
  };

  return (
    <>
      <Button
        onClick={handleShare}
        variant="outline"
        className="border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Compartilhar Trajeto
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#F2F2F2] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#F22998]" />
              Compartilhar Trajeto em Tempo Real
            </DialogTitle>
            <DialogDescription className="text-[#F2F2F2]/60">
              Seus contatos de confiança poderão acompanhar sua localização e horário estimado de chegada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Link de Compartilhamento */}
            {shareLink && (
              <div className="space-y-3">
                <label className="text-sm text-[#F2F2F2]/80">Link de Rastreamento</label>
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="bg-[#F2F2F2]/5 border-[#F22998]/20 text-[#F2F2F2] text-sm"
                  />
                  <Button
                    onClick={copyToClipboard}
                    size="icon"
                    className={`${copied ? 'bg-green-500' : 'bg-[#F22998]'} hover:opacity-80`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                <Button
                  onClick={shareViaWhatsApp}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  Compartilhar via WhatsApp
                </Button>
              </div>
            )}

            {/* Contatos de Confiança */}
            <div className="space-y-3 pt-4 border-t border-[#F22998]/10">
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#F2F2F2]/80 font-semibold">
                  Contatos de Confiança
                </label>
                <Button
                  onClick={addContact}
                  size="sm"
                  variant="outline"
                  className="border-[#F22998]/30 text-[#F22998]"
                >
                  + Adicionar
                </Button>
              </div>

              {contacts.map((contact, index) => (
                <div key={index} className="space-y-2 p-3 rounded-lg bg-[#F2F2F2]/5 border border-[#F22998]/10">
                  <Input
                    placeholder="Nome (ex: Mãe, Namorado)"
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                  />
                  <Input
                    placeholder="Telefone (ex: +5511999999999)"
                    value={contact.phone}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                  />
                </div>
              ))}

              <Button
                onClick={saveContacts}
                variant="outline"
                className="w-full border-[#F22998]/30 text-[#F22998]"
              >
                Salvar Contatos
              </Button>
            </div>

            {/* Info */}
            <div className="p-3 rounded-lg bg-[#BF3B79]/10 border border-[#F22998]/20">
              <p className="text-xs text-[#F2F2F2]/70">
                💡 O link de rastreamento expira em 24 horas ou quando a corrida terminar. 
                Seus contatos verão sua localização atualizada a cada 5 segundos.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}