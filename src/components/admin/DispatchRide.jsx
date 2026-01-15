import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, User, Car, Send, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DispatchRide({ onRideDispatched }) {
  const [loading, setLoading] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [existingPassenger, setExistingPassenger] = useState(null);
  const [searchingPhone, setSearchingPhone] = useState(false);

  const [formData, setFormData] = useState({
    passenger_phone: '',
    passenger_name: '',
    pickup_address: '',
    pickup_lat: null,
    pickup_lng: null,
    destination_address: '',
    destination_lat: null,
    destination_lng: null,
    driver_id: '',
    notes: '',
    dispatched_by: 'admin',
    payment_method: 'cash'
  });

  useEffect(() => {
    loadAvailableDrivers();
  }, []);

  const loadAvailableDrivers = async () => {
    try {
      const drivers = await base44.entities.User.filter({ 
        user_type: 'driver',
        is_online: true
      });
      setAvailableDrivers(drivers);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const searchPassengerByPhone = async () => {
    if (!formData.passenger_phone) return;

    setSearchingPhone(true);
    try {
      const users = await base44.entities.User.filter({ 
        phone: formData.passenger_phone 
      });

      if (users.length > 0) {
        const passenger = users[0];
        setExistingPassenger(passenger);
        setFormData(prev => ({
          ...prev,
          passenger_name: passenger.full_name
        }));
        toast.success('Cliente encontrado na base de dados!');
      } else {
        setExistingPassenger(null);
        toast.info('Cliente não encontrado. Preencha os dados manualmente.');
      }
    } catch (error) {
      console.error('Error searching passenger:', error);
      toast.error('Erro ao buscar cliente');
    } finally {
      setSearchingPhone(false);
    }
  };

  const geocodeAddress = async (address, isPickup = true) => {
    try {
      // Usar uma API de geocoding (aqui simulado)
      // Em produção, usar Google Maps Geocoding API ou similar
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        
        if (isPickup) {
          setFormData(prev => ({
            ...prev,
            pickup_lat: parseFloat(lat),
            pickup_lng: parseFloat(lon)
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            destination_lat: parseFloat(lat),
            destination_lng: parseFloat(lon)
          }));
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const dispatchRide = async () => {
    // Validação
    if (!formData.passenger_phone || !formData.passenger_name) {
      toast.error('Preencha telefone e nome do passageiro');
      return;
    }

    if (!formData.pickup_address || !formData.destination_address) {
      toast.error('Preencha origem e destino');
      return;
    }

    if (!formData.driver_id) {
      toast.error('Selecione uma motorista');
      return;
    }

    setLoading(true);

    try {
      // Geocodificar endereços se necessário
      if (!formData.pickup_lat) {
        await geocodeAddress(formData.pickup_address, true);
      }
      if (!formData.destination_lat) {
        await geocodeAddress(formData.destination_address, false);
      }

      // Criar passageira se não existir
      let passengerId = existingPassenger?.id;
      
      if (!existingPassenger) {
        const newPassenger = await base44.entities.User.create({
          full_name: formData.passenger_name,
          phone: formData.passenger_phone,
          user_type: 'passenger',
          email: `${formData.passenger_phone}@temp.centraldellas.com`
        });
        passengerId = newPassenger.id;
      }

      // Criar corrida
      const ride = await base44.entities.Ride.create({
        passenger_id: passengerId,
        driver_id: formData.driver_id,
        pickup_address: formData.pickup_address,
        pickup_lat: formData.pickup_lat,
        pickup_lng: formData.pickup_lng,
        destination_address: formData.destination_address,
        destination_lat: formData.destination_lat,
        destination_lng: formData.destination_lng,
        status: 'accepted',
        payment_method: formData.payment_method,
        dispatched_by: 'admin',
        notes: formData.notes
      });

      // Enviar notificação para motorista
      await base44.entities.Notification.create({
        user_id: formData.driver_id,
        title: '🚗 Nova corrida despachada!',
        message: `Central despachou corrida de ${formData.passenger_name}`,
        type: 'ride_available',
        related_id: ride.id
      });

      toast.success('Corrida despachada com sucesso!');
      
      // Limpar formulário
      setFormData({
        passenger_phone: '',
        passenger_name: '',
        pickup_address: '',
        pickup_lat: null,
        pickup_lng: null,
        destination_address: '',
        destination_lat: null,
        destination_lng: null,
        driver_id: '',
        notes: '',
        dispatched_by: 'admin',
        payment_method: 'cash'
      });
      setExistingPassenger(null);

      if (onRideDispatched) onRideDispatched();

    } catch (error) {
      console.error('Error dispatching ride:', error);
      toast.error('Erro ao despachar corrida');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-6">
      <h2 className="text-xl font-bold text-[#F2F2F2] mb-6 flex items-center gap-2">
        <Phone className="w-6 h-6 text-[#F22998]" />
        Despacho Manual de Corrida
      </h2>

      <div className="space-y-6">
        {/* Telefone do Cliente */}
        <div className="space-y-2">
          <label className="text-sm text-[#F2F2F2]/80 font-semibold">
            Telefone do Cliente *
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="+55 11 99999-9999"
              value={formData.passenger_phone}
              onChange={(e) => setFormData({ ...formData, passenger_phone: e.target.value })}
              className="bg-[#0D0D0D] border-[#F22998]/20 text-white"
            />
            <Button
              onClick={searchPassengerByPhone}
              disabled={searchingPhone || !formData.passenger_phone}
              className="bg-[#F22998] hover:bg-[#BF3B79]"
            >
              <Search className="w-4 h-4 mr-2" />
              {searchingPhone ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
          {existingPassenger && (
            <p className="text-green-500 text-xs">
              ✓ Cliente encontrado: {existingPassenger.full_name}
            </p>
          )}
        </div>

        {/* Nome do Cliente */}
        <div className="space-y-2">
          <label className="text-sm text-[#F2F2F2]/80 font-semibold">
            Nome do Cliente *
          </label>
          <Input
            placeholder="Nome completo"
            value={formData.passenger_name}
            onChange={(e) => setFormData({ ...formData, passenger_name: e.target.value })}
            className="bg-[#0D0D0D] border-[#F22998]/20 text-white"
          />
        </div>

        {/* Endereços */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-[#F2F2F2]/80 font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-500" />
              Origem *
            </label>
            <Input
              placeholder="Endereço de origem"
              value={formData.pickup_address}
              onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
              onBlur={() => geocodeAddress(formData.pickup_address, true)}
              className="bg-[#0D0D0D] border-[#F22998]/20 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#F2F2F2]/80 font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#F22998]" />
              Destino *
            </label>
            <Input
              placeholder="Endereço de destino"
              value={formData.destination_address}
              onChange={(e) => setFormData({ ...formData, destination_address: e.target.value })}
              onBlur={() => geocodeAddress(formData.destination_address, false)}
              className="bg-[#0D0D0D] border-[#F22998]/20 text-white"
            />
          </div>
        </div>

        {/* Motorista */}
        <div className="space-y-2">
          <label className="text-sm text-[#F2F2F2]/80 font-semibold flex items-center gap-2">
            <Car className="w-4 h-4 text-[#F22998]" />
            Motorista Disponível * ({availableDrivers.length} online)
          </label>
          <Select
            value={formData.driver_id}
            onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
          >
            <SelectTrigger className="bg-[#0D0D0D] border-[#F22998]/20 text-white">
              <SelectValue placeholder="Selecione uma motorista" />
            </SelectTrigger>
            <SelectContent className="bg-[#0D0D0D] border-[#F22998]/20">
              {availableDrivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id} className="text-white">
                  {driver.full_name} {driver.vehicle_model && `- ${driver.vehicle_model}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Método de Pagamento */}
        <div className="space-y-2">
          <label className="text-sm text-[#F2F2F2]/80 font-semibold">
            Método de Pagamento
          </label>
          <Select
            value={formData.payment_method}
            onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
          >
            <SelectTrigger className="bg-[#0D0D0D] border-[#F22998]/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0D0D0D] border-[#F22998]/20">
              <SelectItem value="cash" className="text-white">Dinheiro</SelectItem>
              <SelectItem value="pix" className="text-white">PIX</SelectItem>
              <SelectItem value="credit_card" className="text-white">Cartão de Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <label className="text-sm text-[#F2F2F2]/80 font-semibold">
            Observações
          </label>
          <Input
            placeholder="Informações adicionais (ex: idade avançada, bagagem extra)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="bg-[#0D0D0D] border-[#F22998]/20 text-white"
          />
        </div>

        {/* Botão de Despacho */}
        <Button
          onClick={dispatchRide}
          disabled={loading}
          className="w-full py-6 bg-gradient-to-r from-[#BF3B79] to-[#F22998] hover:opacity-90 text-white font-bold text-lg"
        >
          <Send className="w-5 h-5 mr-2" />
          {loading ? 'Despachando...' : 'Despachar Corrida'}
        </Button>
      </div>
    </Card>
  );
}