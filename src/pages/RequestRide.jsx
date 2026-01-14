import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Navigation, Search, Clock, CreditCard, 
  Car, Shield, Users, ChevronRight, Loader2, Star,
  Wallet, X, Check, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import MapView from '../components/map/MapView';

export default function RequestRide() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('address'); // address, options, searching, driver_found, in_ride
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [selectedRideType, setSelectedRideType] = useState('standard');
  const [selectedPayment, setSelectedPayment] = useState('pix');
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [driver, setDriver] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (userData.preferred_payment) {
          setSelectedPayment(userData.preferred_payment);
        }
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
    
    // Simulate nearby drivers
    setNearbyDrivers([
      { lat: -23.5505, lng: -46.6333, name: 'Maria', rating: 4.9 },
      { lat: -23.5525, lng: -46.6353, name: 'Ana', rating: 4.8 },
      { lat: -23.5495, lng: -46.6313, name: 'Julia', rating: 5.0 },
    ]);
  }, []);

  const rideTypes = [
    { id: 'standard', name: 'Della Standard', icon: Car, price: 15, time: '5 min', description: 'Econômico e confortável' },
    { id: 'shared', name: 'Carona Segura', icon: Users, price: 10, time: '8 min', description: 'Compartilhe com outras' },
    { id: 'premium', name: 'Della Premium', icon: Star, price: 25, time: '3 min', description: 'Carros top e prioridade' },
  ];

  const paymentMethods = [
    { id: 'pix', name: 'Pix', icon: '💜' },
    { id: 'credit_card', name: 'Cartão de Crédito', icon: '💳' },
    { id: 'debit_card', name: 'Cartão de Débito', icon: '💳' },
    { id: 'wallet', name: 'Carteira Digital', icon: '👛' },
  ];

  const handleSearch = () => {
    if (pickup && destination) {
      // Simulate geocoding
      setPickupLocation({ lat: -23.5505, lng: -46.6333 });
      setDestinationLocation({ lat: -23.5605, lng: -46.6533 });
      
      const selectedType = rideTypes.find(r => r.id === selectedRideType);
      setEstimatedPrice(selectedType.price);
      setEstimatedTime(selectedType.time);
      
      setStep('options');
    }
  };

  const handleConfirmRide = async () => {
    setStep('searching');
    
    // Simulate finding driver
    setTimeout(() => {
      setDriver({
        name: 'Maria Silva',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        rating: 4.9,
        totalRides: 234,
        vehicle: {
          model: 'Honda Fit',
          color: 'Prata',
          plate: 'ABC-1234'
        },
        eta: 4
      });
      setStep('driver_found');
    }, 3000);
  };

  const simulatedDriver = {
    name: 'Maria Silva',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    rating: 4.9,
    totalRides: 234,
    vehicle: {
      model: 'Honda Fit',
      color: 'Prata',
      plate: 'ABC-1234'
    },
    eta: 4
  };

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[300px] lg:h-[600px] rounded-3xl overflow-hidden"
          >
            <MapView
              pickupLocation={pickupLocation}
              destinationLocation={destinationLocation}
              nearbyDrivers={nearbyDrivers}
              className="h-full"
            />
          </motion.div>

          {/* Controls */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {/* Address Input Step */}
              {step === 'address' && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl">
                    <h2 className="text-xl font-semibold text-[#F2F2F2] mb-6">Para onde vamos?</h2>
                    
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <Input
                          placeholder="De onde você está?"
                          value={pickup}
                          onChange={(e) => setPickup(e.target.value)}
                          className="pl-10 py-6 bg-[#0D0D0D] border-[#F22998]/20 rounded-xl text-[#F2F2F2] placeholder:text-[#F2F2F2]/40"
                        />
                      </div>
                      
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <div className="w-3 h-3 rounded-full bg-[#F22998]" />
                        </div>
                        <Input
                          placeholder="Para onde vai?"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className="pl-10 py-6 bg-[#0D0D0D] border-[#F22998]/20 rounded-xl text-[#F2F2F2] placeholder:text-[#F2F2F2]/40"
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleSearch}
                      disabled={!pickup || !destination}
                      className="w-full mt-6 btn-gradient py-6 rounded-2xl text-lg font-semibold disabled:opacity-50"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Buscar Motoristas
                    </Button>
                  </Card>

                  {/* Recent Destinations */}
                  <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl">
                    <h3 className="text-sm font-medium text-[#F2F2F2]/60 mb-4">Destinos Recentes</h3>
                    <div className="space-y-3">
                      {[
                        { name: 'Shopping Ibirapuera', address: 'Av. Ibirapuera, 3103' },
                        { name: 'Aeroporto Congonhas', address: 'Av. Washington Luís' },
                        { name: 'Parque Villa-Lobos', address: 'Av. Prof. Fonseca Rodrigues, 1025' },
                      ].map((place, index) => (
                        <button
                          key={index}
                          onClick={() => setDestination(place.address)}
                          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#F22998]/10 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#F22998]/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-[#F22998]" />
                          </div>
                          <div>
                            <p className="text-[#F2F2F2] font-medium">{place.name}</p>
                            <p className="text-[#F2F2F2]/50 text-sm">{place.address}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Options Step */}
              {step === 'options' && (
                <motion.div
                  key="options"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Ride Types */}
                  <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl">
                    <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">Escolha seu tipo de corrida</h3>
                    <div className="space-y-3">
                      {rideTypes.map((type) => (
                        <motion.button
                          key={type.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            setSelectedRideType(type.id);
                            setEstimatedPrice(type.price);
                            setEstimatedTime(type.time);
                          }}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                            selectedRideType === type.id
                              ? 'border-[#F22998] bg-[#F22998]/10'
                              : 'border-transparent bg-[#0D0D0D] hover:border-[#F22998]/30'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              selectedRideType === type.id
                                ? 'bg-gradient-to-br from-[#BF3B79] to-[#F22998]'
                                : 'bg-[#F22998]/20'
                            }`}>
                              <type.icon className={`w-6 h-6 ${selectedRideType === type.id ? 'text-white' : 'text-[#F22998]'}`} />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-[#F2F2F2]">{type.name}</p>
                              <p className="text-sm text-[#F2F2F2]/50">{type.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#F22998]">R$ {type.price},00</p>
                            <p className="text-sm text-[#F2F2F2]/50">{type.time}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </Card>

                  {/* Payment Methods */}
                  <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl">
                    <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">Forma de Pagamento</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPayment(method.id)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            selectedPayment === method.id
                              ? 'border-[#F22998] bg-[#F22998]/10'
                              : 'border-transparent bg-[#0D0D0D] hover:border-[#F22998]/30'
                          }`}
                        >
                          <span className="text-2xl mb-2 block">{method.icon}</span>
                          <p className="text-sm font-medium text-[#F2F2F2]">{method.name}</p>
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* Summary and Confirm */}
                  <Card className="p-6 bg-gradient-to-br from-[#BF3B79]/20 to-[#F22998]/20 border-[#F22998]/30 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[#F2F2F2]/60 text-sm">Valor estimado</p>
                        <p className="text-3xl font-bold text-[#F2F2F2]">R$ {estimatedPrice},00</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#F2F2F2]/60 text-sm">Tempo estimado</p>
                        <p className="text-xl font-semibold text-[#F22998]">{estimatedTime}</p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleConfirmRide}
                      className="w-full btn-gradient py-6 rounded-2xl text-lg font-semibold"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Confirmar Corrida
                    </Button>
                    
                    <button 
                      onClick={() => setStep('address')}
                      className="w-full mt-3 text-[#F2F2F2]/50 hover:text-[#F2F2F2] transition-colors"
                    >
                      Voltar
                    </button>
                  </Card>
                </motion.div>
              )}

              {/* Searching Step */}
              {step === 'searching' && (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <Card className="p-10 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-[#F22998]/20 border-t-[#F22998]"
                    />
                    <h2 className="text-2xl font-bold text-[#F2F2F2] mb-2">Buscando motorista...</h2>
                    <p className="text-[#F2F2F2]/60">Aguarde enquanto encontramos a melhor opção para você</p>
                    
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <Shield className="w-5 h-5 text-[#F22998]" />
                      <span className="text-sm text-[#F2F2F2]/60">Motoristas verificadas</span>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Driver Found Step */}
              {step === 'driver_found' && driver && (
                <motion.div
                  key="driver_found"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="space-y-4"
                >
                  <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                        <Check className="w-4 h-4" />
                        Motorista encontrada!
                      </div>
                      <p className="text-[#F22998] font-semibold">
                        {driver.eta} min até você
                      </p>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <img 
                          src={driver.photo}
                          alt={driver.name}
                          className="w-20 h-20 rounded-full object-cover border-3 border-[#F22998]"
                        />
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center text-white text-xs font-bold">
                          {driver.rating}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#F2F2F2]">{driver.name}</h3>
                        <div className="flex items-center gap-2 text-[#F2F2F2]/60">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span>{driver.rating} • {driver.totalRides} corridas</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#0D0D0D] mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Car className="w-8 h-8 text-[#F22998]" />
                          <div>
                            <p className="font-medium text-[#F2F2F2]">{driver.vehicle.model}</p>
                            <p className="text-sm text-[#F2F2F2]/50">{driver.vehicle.color} • {driver.vehicle.plate}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline"
                        className="py-6 rounded-2xl border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
                      >
                        <Phone className="w-5 h-5 mr-2" />
                        Ligar
                      </Button>
                      <Button 
                        variant="outline"
                        className="py-6 rounded-2xl border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Mensagem
                      </Button>
                    </div>
                  </Card>

                  {/* Emergency Button */}
                  <Card className="p-4 bg-red-500/10 border-red-500/30 rounded-3xl">
                    <button className="w-full flex items-center justify-center gap-3 text-red-400 font-medium">
                      <Shield className="w-5 h-5" />
                      Botão de Emergência
                    </button>
                  </Card>

                  {/* Share Route */}
                  <button className="w-full p-4 rounded-2xl border border-[#F22998]/20 text-[#F22998] hover:bg-[#F22998]/10 transition-colors flex items-center justify-center gap-2">
                    <Navigation className="w-5 h-5" />
                    Compartilhar minha rota
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageCircle(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
  );
}