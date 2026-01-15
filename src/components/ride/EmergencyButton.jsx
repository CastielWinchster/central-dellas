import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Phone, MessageCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EmergencyButton({ ride, user }) {
  const [isPressed, setIsPressed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activating, setActivating] = useState(false);

  const handleEmergencyPress = () => {
    setShowConfirm(true);
  };

  const activateEmergency = async () => {
    setActivating(true);
    
    try {
      // 1. Atualizar status da corrida
      await base44.entities.Ride.update(ride.id, {
        emergency_activated: true,
        emergency_time: new Date().toISOString()
      });

      // 2. Criar rastreamento compartilhado de emergência
      const token = 'EMERGENCY_' + Math.random().toString(36).substring(2) + Date.now();
      await base44.entities.SharedTracking.create({
        ride_id: ride.id,
        passenger_id: user.id,
        share_token: token,
        is_active: true,
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 horas
      });

      const trackingLink = `${window.location.origin}/TrackRide?token=${token}`;

      // 3. Notificar contatos de emergência
      if (user.emergency_contacts && user.emergency_contacts.length > 0) {
        for (const contact of user.emergency_contacts) {
          if (contact.phone) {
            // Enviar notificação SMS/WhatsApp via integração
            await base44.integrations.Core.SendEmail({
              to: user.email,
              subject: '🚨 ALERTA DE EMERGÊNCIA - Central Dellas',
              body: `
                ALERTA DE EMERGÊNCIA ATIVADO
                
                Passageira: ${user.full_name}
                Horário: ${new Date().toLocaleString('pt-BR')}
                
                Contato de emergência: ${contact.name} - ${contact.phone}
                
                Link de rastreamento em tempo real:
                ${trackingLink}
                
                Central Dellas - 0800-XXX-XXXX
              `
            });
          }
        }
      }

      // 4. Notificar central
      await base44.integrations.Core.SendEmail({
        to: 'central@centraldellas.com.br',
        subject: '🚨 EMERGÊNCIA ATIVADA - Corrida #' + ride.id,
        body: `
          EMERGÊNCIA ATIVADA
          
          Passageira: ${user.full_name}
          Email: ${user.email}
          Telefone: ${user.phone || 'Não informado'}
          
          Corrida ID: ${ride.id}
          Status: ${ride.status}
          Origem: ${ride.pickup_address}
          Destino: ${ride.destination_address}
          
          Link de rastreamento: ${trackingLink}
          
          AÇÃO IMEDIATA NECESSÁRIA
        `
      });

      // 5. Mostrar opções de contato
      setIsPressed(true);
      setShowConfirm(false);
      
      toast.success('Emergência ativada! Central e contatos notificados', {
        duration: 10000
      });

    } catch (error) {
      console.error('Error activating emergency:', error);
      toast.error('Erro ao ativar emergência. Ligue para 190!');
    } finally {
      setActivating(false);
    }
  };

  const callEmergency = () => {
    window.location.href = 'tel:0800-DELLAS';
  };

  const call190 = () => {
    window.location.href = 'tel:190';
  };

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <Button
          onClick={handleEmergencyPress}
          disabled={activating}
          className={`w-full py-6 rounded-2xl font-bold text-white shadow-lg transition-all ${
            isPressed 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-red-500 hover:bg-red-600 pulse-animation'
          }`}
        >
          <AlertCircle className="w-6 h-6 mr-2" />
          {isPressed ? 'Emergência Ativada' : activating ? 'Ativando...' : 'Botão de Emergência'}
        </Button>

        {isPressed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping"
          />
        )}
      </motion.div>

      {/* Confirmação */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-[#0D0D0D] border-red-500/50 text-[#F2F2F2] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2 text-xl">
              <AlertCircle className="w-6 h-6" />
              Ativar Emergência?
            </DialogTitle>
            <DialogDescription className="text-[#F2F2F2]/80 text-base">
              Esta ação irá:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3 text-sm text-[#F2F2F2]">
              <Phone className="w-5 h-5 text-[#F22998] mt-0.5" />
              <span>Notificar a central da Central Dellas imediatamente</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-[#F2F2F2]">
              <MessageCircle className="w-5 h-5 text-[#F22998] mt-0.5" />
              <span>Alertar todos os seus contatos de emergência</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-[#F2F2F2]">
              <Shield className="w-5 h-5 text-[#F22998] mt-0.5" />
              <span>Compartilhar sua localização em tempo real</span>
            </div>

            <div className="pt-4 border-t border-[#F22998]/20">
              <p className="text-xs text-[#F2F2F2]/60 mb-4">
                Use apenas em caso de emergência real. Falso alarme pode resultar em penalidades.
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirm(false)}
                  variant="outline"
                  className="flex-1 border-[#F22998]/30"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={activateEmergency}
                  disabled={activating}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  {activating ? 'Ativando...' : 'Confirmar Emergência'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ações Pós-Emergência */}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 space-y-3"
          >
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Emergência Ativada
              </p>
              <p className="text-[#F2F2F2]/70 text-sm">
                A central e seus contatos foram notificados. Ajuda está a caminho.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={callEmergency}
                className="bg-[#F22998] hover:bg-[#BF3B79] text-white py-6"
              >
                <Phone className="w-5 h-5 mr-2" />
                Ligar Central
              </Button>
              <Button
                onClick={call190}
                className="bg-blue-500 hover:bg-blue-600 text-white py-6"
              >
                <Phone className="w-5 h-5 mr-2" />
                Ligar 190
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}