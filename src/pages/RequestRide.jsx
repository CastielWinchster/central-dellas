import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Navigation, Search, Clock, CreditCard, 
  Car, Shield, ChevronRight, Loader2, Star,
  X, Check, Phone, Dog, Crosshair, Package, ChevronDown
} from 'lucide-react';
import RideChat from '../components/chat/RideChat';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import MapView from '../components/map/MapView';
import AddressSearchField from '../components/map/AddressSearchField';
import { toast } from 'sonner';
import { 
  searchPlaces, 
  reverseGeocode, 
  formatAddressDisplay, 
  loadFavoritesAndRecents,
  parseQuery 
} from '@/components/utils/geocoding';
import { loadMapboxToken } from '@/components/utils/mapboxConfig';
import { calculateEtaWithGoogle } from '@/components/utils/googlePlaces';
import { calculateCityPrice, getFixedPrice, applyFirstMotoDiscount, applyCoupon } from '@/utils/pricing';

export default function RequestRide() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('address');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupLocation, setPickupLocation] = useState(null); // { lat, lng, text, userProvidedNumber }
  const [destinationLocation, setDestinationLocation] = useState(null); // { lat, lng, text, userProvidedNumber }
  const [pickupMarkerDraggable, setPickupMarkerDraggable] = useState(false);
  const [destinationMarkerDraggable, setDestinationMarkerDraggable] = useState(false);
  const [selectedRideType, setSelectedRideType] = useState('standard');
  const [isFirstMotoRide, setIsFirstMotoRide] = useState(false);
  // Pagamento unificado
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  // Cupom
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('pix');
  const [acceptsPets, setAcceptsPets] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [driver, setDriver] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [pickupError, setPickupError] = useState('');
  const [destinationError, setDestinationError] = useState('');
  const [loadingPickup, setLoadingPickup] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [favoritesAndRecents, setFavoritesAndRecents] = useState([]);
  const [userCity, setUserCity] = useState('Orlândia');
  const [locationPermissionAsked, setLocationPermissionAsked] = useState(false);
  const [activeField, setActiveField] = useState(null); // 'pickup' | 'destination'
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [mapTopView, setMapTopView] = useState(false);
  const abortControllerRef = useRef(null);
  const mapRef = useRef(null);

  // Handlers para arrastar pins
  const handleMapClick = async (lat, lng) => {
    // Clicar no mapa define o destino
    if (!destination || destination.length === 0) {
      try {
        const reverseData = await reverseGeocode(lat, lng);

        if (reverseData) {
          const finalAddress = formatAddressDisplay(reverseData);

          setDestination(finalAddress);
          setDestinationLocation({
            lat,
            lng,
            text: finalAddress,
            userProvidedNumber: reverseData.housenumber,
            hasHouseNumber: !!reverseData.housenumber
          });

          if (!reverseData.housenumber) {
            setDestinationMarkerDraggable(true);
            toast.info('📍 Destino definido. Arraste o pin para ajustar', { duration: 3000 });
          } else {
            setDestinationMarkerDraggable(false);
            toast.success('📍 Destino definido no mapa');
          }

          if (pickupLocation) {
            calculateRouteAndPrice(pickupLocation, { lat, lng });
          }
        }
      } catch (error) {
        console.error('Erro ao processar clique no mapa:', error);
      }
    }
  };

  const handlePickupDragEnd = async (lat, lng) => {
    try {
      const reverseData = await reverseGeocode(lat, lng);

      if (reverseData) {
        const number = pickupLocation?.userProvidedNumber || reverseData.housenumber;
        const finalAddress = formatAddressDisplay(reverseData, pickupLocation?.userProvidedNumber);

        setPickup(finalAddress);
        setPickupLocation({
          lat,
          lng,
          text: finalAddress,
          userProvidedNumber: pickupLocation?.userProvidedNumber || reverseData.housenumber,
          hasHouseNumber: !!number && number !== 's/n'
        });

        toast.success('📍 Localização de origem ajustada');

        if (destinationLocation) {
          calculateRouteAndPrice({ lat, lng }, destinationLocation);
        }
      }
    } catch (error) {
      console.error('Erro no reverse geocode:', error);
      toast.error('Erro ao atualizar endereço');
    }
  };

  const handleDestinationDragEnd = async (lat, lng) => {
    try {
      const reverseData = await reverseGeocode(lat, lng);

      if (reverseData) {
        const number = destinationLocation?.userProvidedNumber || reverseData.housenumber;
        const finalAddress = formatAddressDisplay(reverseData, destinationLocation?.userProvidedNumber);

        setDestination(finalAddress);
        setDestinationLocation({
          lat,
          lng,
          text: finalAddress,
          userProvidedNumber: destinationLocation?.userProvidedNumber || reverseData.housenumber,
          hasHouseNumber: !!number && number !== 's/n'
        });

        toast.success('📍 Localização de destino ajustada');

        if (pickupLocation) {
          calculateRouteAndPrice(pickupLocation, { lat, lng });
        }
      }
    } catch (error) {
      console.error('Erro no reverse geocode:', error);
      toast.error('Erro ao atualizar endereço');
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Garantir token do Mapbox carregado antes de qualquer busca
        await loadMapboxToken(base44);
        console.log('[RequestRide] Token Mapbox carregado');

        const userData = await base44.auth.me();
        setUser(userData);
        if (userData.preferred_payment) {
          setSelectedPayment(userData.preferred_payment);
        }
        
        // Carregar favoritos e recentes
        const favRec = await loadFavoritesAndRecents(userData.id, base44);
        setFavoritesAndRecents(favRec);

        // Verificar se é a primeira corrida de moto
        const pastMotoRides = await base44.entities.Ride.filter({
          passenger_id: userData.id,
          ride_type: 'rotta_roza',
          status: 'completed'
        });
        setIsFirstMotoRide(pastMotoRides.length === 0);
      } catch (e) {
        if (e.message?.includes('401') || e.message?.includes('Unauthorized')) {
          base44.auth.redirectToLogin();
        } else {
          toast.error('Erro ao carregar dados');
        }
      }
    };
    loadUser();
    
    setNearbyDrivers([]);
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (locationPermissionAsked) return;
    setLocationPermissionAsked(true);
    
    if (navigator.geolocation) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setPickupLocation({ lat: latitude, lng: longitude });
          
          // Geocodificação reversa
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
            );
            const data = await response.json();
            if (data.address) {
              const city = data.address.city || data.address.town || data.address.village || 'Orlândia';
              setUserCity(city);
              
              const address = `${data.address.road || ''}, ${data.address.house_number || 's/n'}, ${data.address.suburb || data.address.neighbourhood || ''}, ${city}`.trim();
              setPickup(address);
              toast.success('📍 Localização detectada automaticamente!');
            }
          } catch (error) {
            console.error('Erro na geocodificação reversa:', error);
          }
          setGettingLocation(false);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setGettingLocation(false);
          toast.info('💡 Ative a localização para preencher seu endereço automaticamente', {
            duration: 5000
          });
        }
      );
    } else {
      toast.info('💡 Seu navegador não suporta geolocalização. Digite seu endereço manualmente.');
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const reverseData = await reverseGeocode(latitude, longitude);

            if (reverseData) {
            const city = reverseData.city || 'Orlândia';
            setUserCity(city);

            const finalAddress = formatAddressDisplay(reverseData);

            const locationData = {
              lat: latitude,
              lng: longitude,
              text: finalAddress,
              userProvidedNumber: reverseData.housenumber,
              hasHouseNumber: !!reverseData.housenumber
            };

            setPickup(finalAddress);
            setPickupLocation(locationData);

            if (!reverseData.housenumber) {
              setPickupMarkerDraggable(true);
              toast.info('📍 Arraste o pin de origem para ajustar se necessário', { duration: 3000 });
            } else {
              setPickupMarkerDraggable(false);
              toast.success('📍 Localização atualizada');
            }
            }
            } catch (error) {
            console.error('Erro na geocodificação reversa:', error);
            setPickupLocation({ lat: latitude, lng: longitude, text: '' });
            }
          setGettingLocation(false);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setGettingLocation(false);
          toast.error('Não foi possível obter sua localização');
        }
      );
    } else {
      setGettingLocation(false);
      toast.error('Geolocalização não suportada');
    }
  };


  // Handler para seleção no campo de ORIGEM
  const handlePickupSuggestionSelect = async (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon || suggestion.lng);

    // POI local: coordenadas já são precisas, não precisa de reverse geocode
    if (suggestion.isLocalPOI) {
      const address = [
        suggestion.name,
        suggestion.street && suggestion.housenumber
          ? `${suggestion.street}, ${suggestion.housenumber}`
          : suggestion.street || '',
        'Orlândia - SP'
      ].filter(Boolean).join(' - ');
      const locationData = { lat, lng: lon, text: address, hasHouseNumber: true };
      setPickup(suggestion.name);
      setPickupLocation(locationData);
      setPickupError('');
      setPickupMarkerDraggable(false);
      if (destinationLocation) calculateRouteAndPrice(locationData, destinationLocation);
      setActiveField(null);
      return;
    }

    try {
      const reverseData = await reverseGeocode(lat, lon);
      const finalAddress = reverseData
        ? formatAddressDisplay(reverseData, suggestion.userProvidedNumber)
        : suggestion.name || suggestion.street || '';
      const locationData = {
        lat, lng: lon, text: finalAddress,
        userProvidedNumber: suggestion.userProvidedNumber || reverseData?.housenumber,
        hasHouseNumber: !!(reverseData?.housenumber || suggestion.userProvidedNumber)
      };
      setPickup(finalAddress);
      setPickupLocation(locationData);
      setPickupError('');
      if (!locationData.hasHouseNumber) setPickupMarkerDraggable(true);
      if (destinationLocation) calculateRouteAndPrice(locationData, destinationLocation);
    } catch (e) {
      setPickup(suggestion.name || suggestion.street || '');
      setPickupLocation({ lat, lng: lon, text: suggestion.name || '' });
    }
    setActiveField(null);
  };

  // Handler para seleção no campo de DESTINO
  const handleDestinationSuggestionSelect = async (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon || suggestion.lng);

    if (suggestion.isFavorite || suggestion.isRecent) {
      const locationData = { lat, lng: lon, text: suggestion.street || suggestion.name, userProvidedNumber: null, hasHouseNumber: true };
      setDestination(suggestion.street || suggestion.name);
      setDestinationLocation(locationData);
      setDestinationError('');
      setActiveField(null);
      if (pickupLocation) calculateRouteAndPrice(pickupLocation, { lat, lng: lon });
      return;
    }

    // POI local: coordenadas já são precisas
    if (suggestion.isLocalPOI) {
      const address = [
        suggestion.name,
        suggestion.street && suggestion.housenumber
          ? `${suggestion.street}, ${suggestion.housenumber}`
          : suggestion.street || '',
        'Orlândia - SP'
      ].filter(Boolean).join(' - ');
      const locationData = { lat, lng: lon, text: address, hasHouseNumber: true };
      setDestination(suggestion.name);
      setDestinationLocation(locationData);
      setDestinationError('');
      setDestinationMarkerDraggable(false);
      setActiveField(null);
      if (pickupLocation) calculateRouteAndPrice(pickupLocation, { lat, lng: lon });
      return;
    }

    try {
      const reverseData = await reverseGeocode(lat, lon);
      const number = suggestion.userProvidedNumber || reverseData?.housenumber;
      const finalAddress = reverseData
        ? formatAddressDisplay({ street: reverseData.street || suggestion.name, housenumber: number, suburb: reverseData.suburb, city: reverseData.city }, suggestion.userProvidedNumber)
        : suggestion.name || suggestion.street || '';
      const locationData = { lat, lng: lon, text: finalAddress, userProvidedNumber: suggestion.userProvidedNumber, hasHouseNumber: !!number && number !== 's/n' };
      setDestination(finalAddress);
      setDestinationLocation(locationData);
      if (!locationData.hasHouseNumber) setDestinationMarkerDraggable(true);
      else setDestinationMarkerDraggable(false);
      setDestinationError('');
      setActiveField(null);

      // Salvar como recente
      try {
        const existingRecent = await base44.entities.RecentPlace.filter({ user_id: user.id, address_text: finalAddress });
        if (existingRecent.length > 0) {
          await base44.entities.RecentPlace.update(existingRecent[0].id, { last_used_at: new Date().toISOString(), times_used: (existingRecent[0].times_used || 0) + 1 });
        } else {
          await base44.entities.RecentPlace.create({ user_id: user.id, address_text: finalAddress, lat, lng: lon, last_used_at: new Date().toISOString() });
        }
      } catch (e) {}

      if (pickupLocation) calculateRouteAndPrice(pickupLocation, { lat, lng: lon });
    } catch (e) {
      setDestination(suggestion.name || suggestion.street || '');
      setDestinationLocation({ lat, lng: lon, text: suggestion.name || '' });
    }
  };



  // Ícone de moto customizado
  const MotoIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="5.5" cy="17.5" r="3.5"/>
      <circle cx="18.5" cy="17.5" r="3.5"/>
      <path d="M15 6h-4l-3 7h10l-1-4"/>
      <path d="M15 6l2 4"/>
      <path d="M9 13l-2-4"/>
    </svg>
  );

  // Calcular preço para um tipo e distância
  const computePrice = (distKm, rideType, dest) => {
    const fixed = (rideType === 'rotta_roza') ? getFixedPrice(dest, 'moto') : null;
    let price = fixed ?? calculateCityPrice(distKm, rideType);
    if (rideType === 'rotta_roza') price = applyFirstMotoDiscount(price, isFirstMotoRide);
    if (appliedCoupon) {
      const r = applyCoupon(price, appliedCoupon.code, [appliedCoupon]);
      price = r.price;
    }
    return price;
  };

  // Calcular distância e preço da rota — usa Google Distance Matrix com fallback OSRM
  const calculateRouteAndPrice = async (origin, destination) => {
    try {
      let distanceKm, durationMin;

      // Tentativa 1: Google Distance Matrix
      const google = await calculateEtaWithGoogle(origin, destination);
      if (google) {
        distanceKm = google.distanceKm;
        durationMin = google.durationMin;
        console.log(`[RouteCalc] Google: ${distanceKm}km, ${durationMin}min`);
      } else {
        // Fallback: OSRM
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`
        );
        const data = await response.json();
        if (data.routes && data.routes[0]) {
          distanceKm = parseFloat((data.routes[0].distance / 1000).toFixed(1));
          durationMin = Math.ceil(data.routes[0].duration / 60);
          console.log(`[RouteCalc] OSRM fallback: ${distanceKm}km, ${durationMin}min`);
        }
      }

      if (distanceKm == null) return;

      setRouteDistance(distanceKm);
      setRouteDuration(durationMin);

      const destText = destination?.text || '';
      setRideTypes(prevTypes =>
        prevTypes.map(type => {
          const price = computePrice(distanceKm, type.id, destText);
          return { ...type, price: price.toFixed(2), time: `${durationMin} min` };
        })
      );

      const price = computePrice(distanceKm, selectedRideType, destText);
      setEstimatedPrice(price.toFixed(2));
      setEstimatedTime(`${durationMin} min`);
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
    }
  };

  // Aplicar cupom
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const coupons = await base44.entities.PromoCode.filter({ code: couponCode.toUpperCase(), is_active: true });
      const result = applyCoupon(parseFloat(estimatedPrice ?? '0'), couponCode, coupons);
      setCouponResult(result);
      if (result.valid) {
        setAppliedCoupon(result.coupon);
        setEstimatedPrice(result.price.toFixed(2));
        toast.success(`Cupom aplicado! -R$ ${result.discount.toFixed(2)}`);
      } else {
        setAppliedCoupon(null);
        toast.error('Cupom inválido ou expirado');
      }
    } catch (e) {
      console.error('Erro ao validar cupom:', e);
      setCouponResult({ valid: false });
    }
  };

  const [rideTypes, setRideTypes] = useState([
    { id: 'standard', name: 'Della Standard', iconType: 'car', price: '9.99', time: '5 min', description: 'Econômico e confortável', badge: null },
    { id: 'rotta_roza', name: 'Rotta Roza', iconType: 'moto', price: '9.99', time: '3 min', description: 'Moto rápida e econômica', badge: null },
  ]);

  const paymentOptions = [
    { id: 'pix',   label: 'Pix',              icon: '💜' },
    { id: 'card',  label: 'Cartão de Crédito', icon: '💳' },
    { id: 'cash',  label: 'Dinheiro',          icon: '💵' },
  ];

  const paymentMethods = [
    { id: 'pix', name: 'Pix', icon: '💜' },
    { id: 'credit_card', name: 'Cartão de Crédito', icon: '💳' },
    { id: 'debit_card', name: 'Cartão de Débito', icon: '💳' },
  ];

  const validateAddress = async (address, isPickup = true) => {
    if (!address || address.trim().length < 5) return false;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const data = await response.json();
      
      if (data.length === 0) {
        if (isPickup) {
          setPickupError('Por favor, insira um local válido existente na cidade');
        } else {
          setDestinationError('Por favor, insira um local válido existente na cidade');
        }
        return false;
      }
      
      if (isPickup) {
        setPickupError('');
        setPickupLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      } else {
        setDestinationError('');
        setDestinationLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      }
      
      return true;
    } catch (error) {
      console.error('Erro na validação:', error);
      return false;
    }
  };

  const handleSearch = async () => {
    if (!pickupLocation?.lat || !pickupLocation?.lng || !destinationLocation?.lat || !destinationLocation?.lng) {
      toast.error('Selecione endereços válidos com localização no mapa');
      return;
    }

    setLoadingPickup(true);

    try {
      // Calcular rota e preços
      await calculateRouteAndPrice(pickupLocation, destinationLocation);
      // Garantir preço padrão se cálculo falhar
      setEstimatedPrice(prev => prev ?? '9.99');
      setEstimatedTime(prev => prev ?? '5 min');
      setStep('options');
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      toast.error('Ocorreu um problema ao buscar motoristas. Tente novamente.');
    } finally {
      setLoadingPickup(false);
    }
  };

  const [currentRide, setCurrentRide] = useState(null);
  const [searchingDrivers, setSearchingDrivers] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const handleConfirmRide = async () => {
    setStep('searching');
    setSearchingDrivers(true);
    
    try {
      const response = await base44.functions.invoke('dispatchRide', {
        pickupLat: pickupLocation.lat,
        pickupLng: pickupLocation.lng,
        pickupText: pickup,
        dropoffLat: destinationLocation.lat,
        dropoffLng: destinationLocation.lng,
        dropoffText: destination,
        estimatedPrice,
        estimatedDuration: parseInt(routeDuration),
        rideType: selectedRideType,
        hasPet: acceptsPets,
        paymentMethod: paymentMethod || selectedPayment,
        firstMotoDiscount: (selectedRideType === 'rotta_roza' && isFirstMotoRide) ? 2.00 : 0,
        couponCode: appliedCoupon?.code || null,
      });
      
      if (response.data.success) {
        setCurrentRide(response.data.ride);
        startRidePolling(response.data.ride.id);
      } else {
        toast.error(response.data.error || 'Erro ao buscar motoristas');
        setStep('options');
      }
    } catch (error) {
      console.error('Erro ao buscar motorista:', error);
      toast.error('Erro ao buscar motoristas. Tente novamente.');
      setStep('options');
    } finally {
      setSearchingDrivers(false);
    }
  };
  
  const startRidePolling = (rideId) => {
    console.log('[Polling] Iniciando polling para rideId:', rideId);
    let consecutiveEmptyResults = 0;

    const pollInterval = setInterval(async () => {
      try {
        console.log('[Polling] Consultando ride:', rideId);
        const res = await base44.functions.invoke('getRideStatus', { rideId });
        const rideData = res.data;
        console.log('[Polling] Resultado:', rideData);

        if (!rideData?.found) {
          consecutiveEmptyResults++;
          console.warn(`[Polling] Corrida não encontrada (tentativa ${consecutiveEmptyResults})`);
          if (consecutiveEmptyResults >= 10) {
            clearInterval(pollInterval);
            toast.error('Não foi possível acompanhar sua corrida. Tente novamente.');
            setStep('options');
          }
          return;
        }

        consecutiveEmptyResults = 0;
        const ride = rideData;

        if (ride.status === 'accepted') {
          console.log('[Polling] Corrida aceita! assigned_driver_id:', ride.assigned_driver_id);
          clearInterval(pollInterval);

          if (!ride.assigned_driver_id) {
            console.error('[Polling] assigned_driver_id está vazio mesmo com status accepted!');
            toast.error('Erro ao identificar a motorista. Tente novamente.');
            setStep('options');
            return;
          }

          try {
            const res = await base44.functions.invoke('getDriverInfo', {
              driverId: ride.assigned_driver_id
            });
            const info = res.data || {};

            console.log('[Polling] Dados da motorista via backend:', info.name, '| Veículo:', info.vehicle?.model);

            setDriver({
              id: ride.assigned_driver_id,
              name: info.name || 'Motorista',
              photo: info.photo || null,
              phone: info.phone || null,
              rating: info.rating ?? null,
              totalRides: info.totalRides ?? null,
              vehicle: info.vehicle || null,
              eta: null,
            });
            setStep('driver_found');
            console.log('[Polling] Motorista carregada:', ride.assigned_driver_id, info.name);
          } catch (driverError) {
            console.error('[Polling] Erro ao buscar dados da motorista:', driverError);
            setDriver({
              id: ride.assigned_driver_id,
              name: 'Motorista',
              photo: null,
              rating: null,
              totalRides: null,
              vehicle: null,
              eta: null,
            });
            setStep('driver_found');
          }

        } else if (rideData.status === 'expired' || rideData.status === 'cancelled') {
          console.log('[Polling] Corrida encerrada com status:', rideData.status);
          clearInterval(pollInterval);
          toast.error('Nenhuma motorista aceitou sua corrida');
          setStep('options');
        } else {
          console.log('[Polling] Aguardando... status atual:', ride.status);
        }
      } catch (error) {
        console.error('[Polling] Erro na consulta:', error);
      }
    }, 2000);

    // Timeout de 5 minutos
    const timeoutId = setTimeout(() => {
      clearInterval(pollInterval);
      setStep(prev => {
        if (prev === 'searching') {
          console.log('[Polling] Timeout de 5 minutos atingido');
          toast.error('Nenhuma motorista disponível no momento. Tente novamente.');
          return 'options';
        }
        return prev;
      });
    }, 300000);
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
      <PassengerRideChat
        currentRide={currentRide}
        user={user}
        driver={driver}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
      />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[300px] lg:h-[600px] rounded-3xl overflow-hidden relative"
          >
            <MapView
              pickupLocation={pickupLocation}
              destinationLocation={destinationLocation}
              nearbyDrivers={[]}
              showRoute={!!pickupLocation && !!destinationLocation}
              className="h-full"
              showRealTimeDrivers={true}
              filterPets={acceptsPets}
              onPickupDragEnd={handlePickupDragEnd}
              onDestinationDragEnd={handleDestinationDragEnd}
              pickupDraggable={pickupMarkerDraggable}
              destinationDraggable={destinationMarkerDraggable}
              onMapClick={step === 'address' ? handleMapClick : null}
              forcePitch={mapTopView ? 0 : undefined}
            />
            
            {/* Card flutuante compacto com informações da rota */}
            {routeDistance && routeDuration && step === 'options' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white rounded-2xl shadow-lg px-4 py-2 flex items-center gap-3 w-auto max-w-[88%]"
              >
                <div className="text-center">
                  <p className="text-xs text-gray-400 leading-none">Distância</p>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{routeDistance} km</p>
                </div>
                <div className="w-px h-6 bg-gray-200" />
                <div className="text-center">
                  <p className="text-xs text-gray-400 leading-none">Tempo</p>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{routeDuration} min</p>
                </div>
                <div className="w-px h-6 bg-gray-200" />
                <div className="text-center">
                  <p className="text-xs text-gray-400 leading-none">Preço</p>
                  <p className="text-sm font-bold text-[#F22998] leading-tight">R$ {String(estimatedPrice ?? '0.00').replace('.', ',')}</p>
                </div>
              </motion.div>
            )}

            {/* Aviso para ajustar pin */}
            {(pickupMarkerDraggable || destinationMarkerDraggable) && step === 'address' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-500/95 backdrop-blur-sm rounded-2xl shadow-2xl px-4 py-2 z-10"
              >
                <p className="text-xs text-white font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Arraste o pin {pickupMarkerDraggable ? 'verde' : 'rosa'} para ajustar a localização exata
                </p>
              </motion.div>
            )}
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
                  <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl overflow-visible">
                    {/* Linha conectora visual */}
                    <div className="space-y-1" style={{ overflow: 'visible' }}>
                      <AddressSearchField
                        label="De onde você está"
                        value={pickup}
                        onChange={(v) => { setPickup(v); setPickupError(''); }}
                        onSelect={handlePickupSuggestionSelect}
                        placeholder="Digite seu endereço de origem"
                        dotColor="#22c55e"
                        userLocation={pickupLocation}
                        favoritesAndRecents={favoritesAndRecents}
                        isActive={activeField === 'pickup'}
                        onFocus={() => setActiveField('pickup')}
                        error={pickupError}
                        icon={
                          <button
                            onClick={getCurrentLocation}
                            className="p-1 rounded-full hover:bg-[#F22998]/10 transition-colors"
                            title="Usar minha localização"
                          >
                            {gettingLocation
                              ? <Loader2 className="w-4 h-4 text-[#F22998] animate-spin" />
                              : <Crosshair className="w-4 h-4 text-[#F22998]" />
                            }
                          </button>
                        }
                      />

                      {/* Divisor com ícone de seta */}
                      <div className="flex items-center gap-2 py-1 pl-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="w-px h-2 bg-[#F22998]/30 ml-[5px]" />
                          <div className="w-px h-2 bg-[#F22998]/20 ml-[5px]" />
                        </div>
                      </div>

                      <AddressSearchField
                        label="Para onde vai"
                        value={destination}
                        onChange={(v) => { setDestination(v); setDestinationError(''); }}
                        onSelect={handleDestinationSuggestionSelect}
                        placeholder="Restaurante, loja, endereço..."
                        dotColor="#F22998"
                        userLocation={pickupLocation}
                        favoritesAndRecents={favoritesAndRecents}
                        isActive={activeField === 'destination'}
                        onFocus={() => setActiveField('destination')}
                        error={destinationError}
                      />
                    </div>

                    {/* Botão Della Entrega */}
                    <motion.button
                      onClick={() => navigate('/RequestDelivery')}
                      animate={{ boxShadow: ['0 0 0px rgba(242,41,152,0.2)', '0 0 18px rgba(242,41,152,0.5)', '0 0 0px rgba(242,41,152,0.2)'] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-full mt-5 flex items-center justify-between px-5 py-4 rounded-xl border border-[#F22998] hover:brightness-110 hover:shadow-[0_0_24px_rgba(242,41,152,0.4)] transition-all"
                      style={{ background: 'linear-gradient(135deg, #8C0D60 0%, #BF3B79 100%)' }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📦</span>
                        <div className="text-left">
                          <p className="font-semibold text-white text-sm">Gostaria de solicitar uma entrega?</p>
                          <p className="text-white/60 text-xs">Clique aqui!</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/80 flex-shrink-0" />
                    </motion.button>

                    <Button 
                      onClick={handleSearch}
                      disabled={!pickupLocation?.lat || !destinationLocation?.lat || loadingPickup}
                      className="w-full mt-4 btn-gradient py-6 rounded-2xl text-lg font-semibold disabled:opacity-50"
                    >
                      {loadingPickup ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Validando...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5 mr-2" />
                          Próximo
                        </>
                      )}
                    </Button>

                    {/* Status dos endereços */}
                    <div className="flex items-center justify-center gap-4 mt-3 text-xs">
                      <div className={`flex items-center gap-1 ${pickupLocation?.lat ? 'text-green-400' : 'text-[#F2F2F2]/40'}`}>
                        <div className={`w-2 h-2 rounded-full ${pickupLocation?.lat ? 'bg-green-400' : 'bg-[#F2F2F2]/40'}`} />
                        Origem
                      </div>
                      <div className={`flex items-center gap-1 ${destinationLocation?.lat ? 'text-green-400' : 'text-[#F2F2F2]/40'}`}>
                        <div className={`w-2 h-2 rounded-full ${destinationLocation?.lat ? 'bg-green-400' : 'bg-[#F2F2F2]/40'}`} />
                        Destino
                      </div>
                    </div>
                  </Card>

                  {/* Favoritos e recentes são exibidos no dropdown do campo de destino */}
                  {favoritesAndRecents.length > 0 && (
                    <Card className="p-4 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-2xl">
                      <h3 className="text-xs font-semibold text-[#F2F2F2]/40 uppercase tracking-wider mb-3">Locais salvos</h3>
                      <div className="space-y-1">
                        {favoritesAndRecents.slice(0, 4).map((place, index) => (
                          <button
                            key={place.id || index}
                            onClick={() => handleDestinationSuggestionSelect(place)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F22998]/10 transition-colors text-left"
                          >
                            <span className="text-lg">{place.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#F2F2F2] font-medium truncate">{place.name}</p>
                              <p className="text-xs text-[#F2F2F2]/40 truncate">{place.street}</p>
                            </div>
                            <span className="text-xs text-[#F22998]/60">{place.categoryLabel}</span>
                          </button>
                        ))}
                      </div>
                    </Card>
                  )}
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
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
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
                            {/* Logo da empresa */}
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-black flex-shrink-0">
                              {type.id === 'standard' ? (
                                <img
                                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ea008a15739746d55f4e/50cfce50f_central2.png"
                                  alt="Central Dellas"
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                <img
                                  src="https://media.base44.com/images/public/6966ea008a15739746d55f4e/4a806ee12_Rota.png"
                                  alt="Rotta Roza"
                                  className="w-full h-full object-contain"
                                />
                              )}
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-[#F2F2F2]">{type.name}</p>
                                {type.badge && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#F59E0B22', color: '#F59E0B' }}>
                                    {type.badge}
                                  </span>
                                )}
                                {type.id === 'rotta_roza' && isFirstMotoRide && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400">
                                    🎉 R$ 2,00 OFF 1ª moto!
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-[#F2F2F2]/50">{type.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#F22998]">R$ {String(type.price ?? '0.00').replace('.', ',')}</p>
                            <p className="text-sm text-[#F2F2F2]/50">{type.time}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Filtro Aceita Pets */}
                    <div className="mt-4 pt-4 border-t border-[#F22998]/10">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-[#0D0D0D]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Dog className="w-5 h-5 text-purple-400" />
                          </div>
                          <span className="font-medium text-[#F2F2F2]">Aceita Pets</span>
                        </div>
                        <Switch
                          checked={acceptsPets}
                          onCheckedChange={setAcceptsPets}
                        />
                      </div>
                      {acceptsPets && (
                        <p className="text-xs text-purple-400 mt-2 ml-1">
                          Mostrando apenas motoristas que aceitam pets no mapa
                        </p>
                      )}
                    </div>
                  </Card>

                  {/* Payment Methods — seletor unificado */}
                  <Card className="p-6 bg-[#F2F2F2]/5 border-[#F22998]/10 rounded-3xl">
                    <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">Forma de Pagamento</h3>

                    {/* Botão principal do seletor */}
                    <button
                      onClick={() => setShowPaymentPicker(v => !v)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                        paymentMethod
                          ? 'border-[#F22998] bg-[#F22998]/10'
                          : 'border-[#F2F2F2]/10 bg-[#0D0D0D] hover:border-[#F22998]/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {paymentMethod ? paymentOptions.find(o => o.id === paymentMethod)?.icon : '💳'}
                        </span>
                        <span className="text-sm font-medium text-[#F2F2F2]">
                          {paymentMethod
                            ? paymentOptions.find(o => o.id === paymentMethod)?.label
                            : 'Escolher forma de pagamento'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {paymentMethod && <Check className="w-4 h-4 text-[#F22998]" />}
                        <ChevronDown className={`w-4 h-4 text-[#F2F2F2]/50 transition-transform ${showPaymentPicker ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {/* Dropdown de opções */}
                    <AnimatePresence>
                      {showPaymentPicker && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="mt-2 rounded-2xl overflow-hidden border border-[#F22998]/20"
                        >
                          {paymentOptions.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => { setPaymentMethod(opt.id); setSelectedPayment(opt.id); setShowPaymentPicker(false); }}
                              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                paymentMethod === opt.id
                                  ? 'bg-[#F22998]/15 text-[#F22998]'
                                  : 'bg-[#0D0D0D] text-[#F2F2F2] hover:bg-[#F22998]/10'
                              }`}
                            >
                              <span className="text-xl">{opt.icon}</span>
                              <span className="text-sm font-medium flex-1 text-left">{opt.label}</span>
                              {paymentMethod === opt.id && <Check className="w-4 h-4" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Campo de cupom */}
                    <div className="mt-4">
                      <p className="text-sm text-[#F2F2F2]/50 mb-2">Cupom de desconto</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Digite seu cupom"
                          value={couponCode}
                          onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
                          className="flex-1 bg-[#0D0D0D] text-[#F2F2F2] rounded-xl px-4 py-2 text-sm border border-[#F2F2F2]/10 focus:border-[#F22998]/50 outline-none placeholder-[#F2F2F2]/30"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          className="bg-[#F22998] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#BF3B79] transition-colors"
                        >
                          Aplicar
                        </button>
                      </div>
                      {couponResult && (
                        <p className={`text-xs mt-1.5 ${couponResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                          {couponResult.valid
                            ? `✅ Cupom aplicado! -R$ ${couponResult.discount.toFixed(2)}`
                            : '❌ Cupom inválido ou expirado'}
                        </p>
                      )}
                    </div>
                  </Card>

                  {/* Summary and Confirm */}
                  <Card className="p-6 bg-gradient-to-br from-[#BF3B79]/20 to-[#F22998]/20 border-[#F22998]/30 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[#F2F2F2]/60 text-sm">Valor estimado</p>
                        <p className="text-3xl font-bold text-[#F2F2F2]">R$ {String(estimatedPrice ?? '0.00').replace('.', ',')}</p>
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

                    <button
                      onClick={() => setStep('options')}
                      className="mt-6 text-sm text-[#F2F2F2]/40 hover:text-[#F2F2F2]/70 transition-colors"
                    >
                      Cancelar busca
                    </button>
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
                     {driver.eta != null && (
                       <p className="text-[#F22998] font-semibold">
                         {driver.eta} min até você
                       </p>
                     )}
                   </div>

                   <div className="flex items-center gap-4 mb-6">
                     <div className="relative">
                       {driver.photo ? (
                         <img
                           src={driver.photo}
                           alt={driver.name}
                           className="w-20 h-20 rounded-full object-cover border-2 border-[#F22998]"
                         />
                       ) : (
                         <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center border-2 border-[#F22998]">
                           <span className="text-white text-2xl font-bold">
                             {driver.name?.charAt(0)?.toUpperCase() || 'M'}
                           </span>
                         </div>
                       )}
                       {driver.rating != null && (
                         <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center text-white text-xs font-bold">
                           {driver.rating.toFixed(1)}
                         </div>
                       )}
                     </div>
                     <div>
                       <h3 className="text-xl font-bold text-[#F2F2F2]">{driver.name}</h3>
                       {(driver.rating != null || driver.totalRides != null) && (
                         <div className="flex items-center gap-2 text-[#F2F2F2]/60">
                           {driver.rating != null && (
                             <>
                               <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                               <span>{driver.rating.toFixed(1)}</span>
                             </>
                           )}
                           {driver.rating != null && driver.totalRides != null && (
                             <span>•</span>
                           )}
                           {driver.totalRides != null && (
                             <span>{driver.totalRides} corridas</span>
                           )}
                         </div>
                       )}
                     </div>
                   </div>

                   <div className="p-4 rounded-2xl bg-[#0D0D0D] mb-6">
                     <div className="flex items-center gap-3">
                       <Car className="w-8 h-8 text-[#F22998] flex-shrink-0" />
                       {driver.vehicle ? (
                         <div>
                           <p className="font-medium text-[#F2F2F2]">{driver.vehicle.model}</p>
                           <p className="text-sm text-[#F2F2F2]/50">
                             {[driver.vehicle.color, driver.vehicle.plate].filter(Boolean).join(' • ')}
                           </p>
                         </div>
                       ) : (
                         <p className="text-sm text-[#F2F2F2]/50">Veículo não informado</p>
                       )}
                     </div>
                   </div>

                    <div className="grid grid-cols-2 gap-3">
                      {driver.phone ? (
                        <a
                          href={`tel:+55${driver.phone.replace(/\D/g, '')}`}
                          className="py-6 rounded-2xl border border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10 flex items-center justify-center font-medium transition-colors"
                        >
                          <Phone className="w-5 h-5 mr-2" />
                          Ligar
                        </a>
                      ) : (
                        <Button
                          variant="outline"
                          disabled
                          className="py-6 rounded-2xl border-[#F22998]/30 text-[#F22998]/40"
                        >
                          <Phone className="w-5 h-5 mr-2" />
                          Ligar
                        </Button>
                      )}
                      <Button 
                        variant="outline"
                        onClick={() => setIsChatOpen(true)}
                        className="py-6 rounded-2xl border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Mensagem
                      </Button>
                    </div>
                  </Card>


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

// RideChat renderizado fora do fluxo principal
function PassengerRideChat({ currentRide, user, driver, isChatOpen, setIsChatOpen }) {
  if (!currentRide) return null;
  return (
    <RideChat
      rideId={currentRide.id}
      currentUserId={user?.id}
      otherUser={{ name: driver?.name, photo: driver?.photo }}
      isOpen={isChatOpen}
      onClose={() => setIsChatOpen(false)}
      rideStatus={currentRide.status || 'accepted'}
    />
  );
}