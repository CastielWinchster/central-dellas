import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Navigation, FileText, Car, Dog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ScheduleRide() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pickup_address: '',
    destination_address: '',
    scheduled_date: '',
    scheduled_time: '',
    notes: '',
    ride_type: 'standard'
  });
  const [loading, setLoading] = useState(false);

  const rideTypes = [
    { 
      value: 'standard', 
      label: 'Dellas Standard', 
      icon: Car, 
      color: 'from-[#BF3B79] to-[#F22998]',
    },
    { 
      value: 'roza', 
      label: 'Rotta Roza', 
      color: 'from-[#F22998] to-[#8C0D60]',
    },
    { 
      value: 'pet', 
      label: 'Dellas Pet', 
      icon: Dog, 
      color: 'from-[#BF3B79] to-[#F22998]',
      description: 'Carros pet-friendly'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await base44.auth.me();
      
      // Validar data (até 30 dias)
      const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      const now = new Date();
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);

      if (scheduledDateTime < now) {
        toast.error('A data agendada deve ser futura');
        setLoading(false);
        return;
      }

      if (scheduledDateTime > maxDate) {
        toast.error('Agendamento máximo de 30 dias');
        setLoading(false);
        return;
      }

      // Criar agendamento
      await base44.entities.ScheduledRide.create({
        passenger_id: user.id,
        pickup_address: formData.pickup_address,
        destination_address: formData.destination_address,
        scheduled_time: scheduledDateTime.toISOString(),
        notes: formData.notes,
        ride_type: formData.ride_type,
        status: 'pending'
      });

      toast.success('Corrida agendada com sucesso!');
      navigate(createPageUrl('RideHistory'));
    } catch (error) {
      toast.error('Erro ao agendar corrida');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isDark = true;

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#0D0D0D]' : 'bg-gray-50'}`}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
            Agendar Corrida
          </h1>
          <p className={isDark ? 'text-[#F2F2F2]/60' : 'text-black/70'}>
            Programe sua corrida com até 30 dias de antecedência
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Endereços */}
          <Card className={`p-6 rounded-2xl ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white border-gray-200'}`}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
              <MapPin className="w-5 h-5 text-[#F22998]" />
              Endereços
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-[#F2F2F2]/70' : 'text-black/70'}`}>
                  Origem
                </label>
                <Input
                  required
                  value={formData.pickup_address}
                  onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}
                  placeholder="Digite o endereço de origem"
                  className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-white' : ''}
                />
              </div>
              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-[#F2F2F2]/70' : 'text-black/70'}`}>
                  Destino
                </label>
                <Input
                  required
                  value={formData.destination_address}
                  onChange={(e) => setFormData({...formData, destination_address: e.target.value})}
                  placeholder="Digite o endereço de destino"
                  className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-white' : ''}
                />
              </div>
            </div>
          </Card>

          {/* Data e Hora */}
          <Card className={`p-6 rounded-2xl ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white border-gray-200'}`}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
              <Calendar className="w-5 h-5 text-[#F22998]" />
              Data e Horário
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-[#F2F2F2]/70' : 'text-black/70'}`}>
                  Data
                </label>
                <Input
                  required
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                  className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-white' : ''}
                />
              </div>
              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-[#F2F2F2]/70' : 'text-black/70'}`}>
                  Horário
                </label>
                <Input
                  required
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
                  className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-white' : ''}
                />
              </div>
            </div>
          </Card>

          {/* Tipo de Corrida */}
          <Card className={`p-6 rounded-2xl ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white border-gray-200'}`}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
              <Car className="w-5 h-5 text-[#F22998]" />
              Categoria
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {rideTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({...formData, ride_type: type.value})}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.ride_type === type.value
                      ? 'border-[#F22998] bg-[#F22998]/10'
                      : isDark ? 'border-[#F22998]/10 hover:border-[#F22998]/30' : 'border-gray-200 hover:border-[#F22998]/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-2`}>
                    {type.icon && <type.icon className="w-5 h-5 text-white" />}
                  </div>
                  <p className={`font-medium text-sm ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
                    {type.label}
                  </p>
                  <p className="text-xs text-[#F22998]">{type.price}</p>
                  {type.description && (
                    <p className={`text-xs mt-1 ${isDark ? 'text-[#F2F2F2]/50' : 'text-black/60'}`}>
                      {type.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* Observações */}
          <Card className={`p-6 rounded-2xl ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white border-gray-200'}`}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-[#F2F2F2]' : 'text-black'}`}>
              <FileText className="w-5 h-5 text-[#F22998]" />
              Observações (Opcional)
            </h3>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Paradas no caminho, preferências especiais, etc."
              rows={4}
              className={isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-white' : ''}
            />
          </Card>

          {/* Botão de Agendar */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 rounded-2xl btn-gradient text-lg font-semibold"
          >
            {loading ? 'Agendando...' : 'Agendar Corrida'}
          </Button>

          <p className={`text-xs text-center ${isDark ? 'text-[#F2F2F2]/50' : 'text-black/60'}`}>
            Cancelamento gratuito até 2 horas antes do horário agendado
          </p>
        </form>
      </div>
    </div>
  );
}