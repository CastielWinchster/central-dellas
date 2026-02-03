import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, Edit2, ChevronLeft, Home, Briefcase, Church, ShoppingCart, Dumbbell, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { searchPlaces, formatAddressDisplay } from '@/components/utils/geocoding';

const labelIcons = {
  'Casa': Home,
  'Trabalho': Briefcase,
  'Igreja': Church,
  'Mercado': ShoppingCart,
  'Academia': Dumbbell,
  'Outros': MoreHorizontal
};

export default function FavoritePlaces() {
  const [user, setUser] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  
  const [selectedLabel, setSelectedLabel] = useState('Casa');
  const [addressInput, setAddressInput] = useState('');
  const [instructions, setInstructions] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const favPlaces = await base44.entities.FavoritePlace.filter({ user_id: userData.id });
      setPlaces(favPlaces);
    } catch (error) {
      console.error('Erro ao carregar:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        base44.auth.redirectToLogin();
      } else {
        toast.error('Erro ao carregar dados');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSearch = async (value) => {
    setAddressInput(value);
    
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }
    
    setSearching(true);
    try {
      const results = await searchPlaces(value, null, null);
      setSuggestions(results.slice(0, 5));
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const selectAddress = (suggestion) => {
    const formatted = formatAddressDisplay(suggestion, suggestion.userProvidedNumber);
    
    setAddressInput(formatted);
    setSelectedLocation({
      lat: suggestion.lat,
      lng: suggestion.lon,
      text: formatted
    });
    setSuggestions([]);
  };

  const handleSave = async () => {
    if (!selectedLocation) {
      toast.error('Selecione um endereço');
      return;
    }
    
    try {
      if (editingPlace) {
        await base44.entities.FavoritePlace.update(editingPlace.id, {
          label: selectedLabel,
          address_text: selectedLocation.text,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          instructions
        });
        toast.success('Local atualizado!');
      } else {
        await base44.entities.FavoritePlace.create({
          user_id: user.id,
          label: selectedLabel,
          address_text: selectedLocation.text,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          instructions
        });
        toast.success('Local adicionado!');
      }
      
      resetForm();
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar');
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingPlace(null);
    setSelectedLabel('Casa');
    setAddressInput('');
    setInstructions('');
    setSelectedLocation(null);
    setSuggestions([]);
  };

  const handleEdit = (place) => {
    setEditingPlace(place);
    setSelectedLabel(place.label);
    setAddressInput(place.address_text);
    setInstructions(place.instructions || '');
    setSelectedLocation({
      lat: place.lat,
      lng: place.lng,
      text: place.address_text
    });
    setShowAddForm(true);
  };

  const handleDelete = async (placeId) => {
    if (!confirm('Remover este local?')) return;
    
    try {
      await base44.entities.FavoritePlace.delete(placeId);
      toast.success('Local removido');
      loadData();
    } catch (error) {
      toast.error('Erro ao remover');
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('PassengerOptions')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#F2F2F2]">Locais Favoritos</h1>
        </div>

        {/* Add Button */}
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full btn-gradient py-6 rounded-2xl mb-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Local
          </Button>
        )}

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl">
                <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">
                  {editingPlace ? 'Editar Local' : 'Adicionar Local'}
                </h3>
                
                {/* Label Selector */}
                <div className="mb-4">
                  <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Tipo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.keys(labelIcons).map((label) => {
                      const Icon = labelIcons[label];
                      return (
                        <button
                          key={label}
                          onClick={() => setSelectedLabel(label)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            selectedLabel === label
                              ? 'border-[#F22998] bg-[#F22998]/10'
                              : 'border-[#F22998]/20 bg-[#0D0D0D]'
                          }`}
                        >
                          <Icon className="w-5 h-5 text-[#F22998] mx-auto mb-1" />
                          <p className="text-xs text-[#F2F2F2]">{label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Address Search */}
                <div className="mb-4 relative">
                  <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Endereço</label>
                  <Input
                    placeholder="Digite o endereço"
                    value={addressInput}
                    onChange={(e) => handleAddressSearch(e.target.value)}
                    className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                  />
                  
                  {suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-[#0D0D0D] border border-[#F22998]/30 rounded-xl shadow-2xl max-h-[200px] overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.id || index}
                          onClick={() => selectAddress(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-[#F22998]/10 transition-colors border-b border-[#F22998]/10 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <span>{suggestion.icon}</span>
                            <p className="text-sm text-[#F2F2F2]">{suggestion.name || suggestion.street}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Instructions */}
                <div className="mb-4">
                  <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Instruções (opcional)</label>
                  <Input
                    placeholder="Ex: Portão azul, apto 101..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="flex-1 border-[#F22998]/30"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex-1 btn-gradient"
                  >
                    {editingPlace ? 'Atualizar' : 'Adicionar'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {places.length === 0 && !showAddForm && (
          <Card className="p-8 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl text-center">
            <MapPin className="w-12 h-12 text-[#F22998]/50 mx-auto mb-3" />
            <p className="text-[#F2F2F2]/60 mb-2">Nenhum local favorito ainda</p>
            <p className="text-sm text-[#F2F2F2]/40">
              Adicione seus locais frequentes para facilitar suas corridas
            </p>
          </Card>
        )}

        {/* Places List */}
        <div className="space-y-3">
          {places.map((place) => {
            const Icon = labelIcons[place.label] || MapPin;
            return (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-4 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F22998]/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[#F22998]" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-[#F2F2F2]">{place.label}</h3>
                      <p className="text-sm text-[#F2F2F2]/60 mt-1">{place.address_text}</p>
                      {place.instructions && (
                        <p className="text-xs text-[#F2F2F2]/40 mt-1 italic">
                          {place.instructions}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(place)}
                        variant="ghost"
                        size="icon"
                        className="text-[#F2F2F2]/60 hover:text-[#F22998]"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(place.id)}
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}