import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bike, Car, Truck, Save, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const DEFAULTS = {
  moto_base_day: 9.99,
  moto_base_night: 14.99,
  moto_fixed: 10.0,
  car_base_day: 9.99,
  car_base_night: 14.99,
  car_price_per_km: 1.8,
  delivery_base: 8.79,
  delivery_min: 4.0,
  is_active: true,
};

function PriceField({ label, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-[#F2F2F2]/70 font-medium">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F2F2F2]/40 text-sm">R$</span>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="bg-[#0D0D0D] border-[#A855F7]/20 text-white pl-9"
        />
      </div>
    </div>
  );
}

export default function PriceManager() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.PricingSettings.list('-created_date', 1);
        if (list.length > 0) {
          setRecordId(list[0].id);
          setSettings({ ...DEFAULTS, ...list[0] });
        }
      } catch (e) {
        console.error('Error loading pricing settings:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (key) => (val) => setSettings((p) => ({ ...p, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        moto_base_day: settings.moto_base_day,
        moto_base_night: settings.moto_base_night,
        moto_fixed: settings.moto_fixed,
        car_base_day: settings.car_base_day,
        car_base_night: settings.car_base_night,
        car_price_per_km: settings.car_price_per_km,
        delivery_base: settings.delivery_base,
        delivery_min: settings.delivery_min,
        is_active: true,
      };
      if (recordId) {
        await base44.entities.PricingSettings.update(recordId, payload);
      } else {
        const created = await base44.entities.PricingSettings.create(payload);
        setRecordId(created.id);
      }
      toast.success('Preços atualizados com sucesso!');
    } catch (e) {
      console.error('Error saving pricing:', e);
      toast.error('Erro ao salvar preços');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-[#F2F2F2]/60 p-6">Carregando preços...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        {/* Moto */}
        <Card className="bg-[#F2F2F2]/5 border-[#A855F7]/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-[#F2F2F2]">Moto Táxi</h3>
          </div>
          <div className="space-y-3">
            <PriceField label="Tarifa base (dia)" value={settings.moto_base_day} onChange={set('moto_base_day')} />
            <PriceField label="Tarifa base (noite)" value={settings.moto_base_night} onChange={set('moto_base_night')} />
            <PriceField label="Preço fixo Rotta Roza" value={settings.moto_fixed} onChange={set('moto_fixed')} />
          </div>
        </Card>

        {/* Carro */}
        <Card className="bg-[#F2F2F2]/5 border-[#A855F7]/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-[#F2F2F2]">Carro</h3>
          </div>
          <div className="space-y-3">
            <PriceField label="Tarifa base (dia)" value={settings.car_base_day} onChange={set('car_base_day')} />
            <PriceField label="Tarifa base (noite)" value={settings.car_base_night} onChange={set('car_base_night')} />
            <PriceField label="Preço por km" value={settings.car_price_per_km} onChange={set('car_price_per_km')} />
          </div>
        </Card>

        {/* Entrega */}
        <Card className="bg-[#F2F2F2]/5 border-[#A855F7]/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-[#F2F2F2]">Entrega</h3>
          </div>
          <div className="space-y-3">
            <PriceField label="Tarifa base" value={settings.delivery_base} onChange={set('delivery_base')} />
            <PriceField label="Valor mínimo" value={settings.delivery_min} onChange={set('delivery_min')} />
          </div>
        </Card>
      </div>

      <Button
        onClick={save}
        disabled={saving}
        className="w-full py-6 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:opacity-90 text-white font-bold"
      >
        <Save className="w-5 h-5 mr-2" />
        {saving ? 'Salvando...' : 'Salvar Preços'}
      </Button>

      <Card className="bg-[#A855F7]/5 border-[#A855F7]/10 p-4 flex items-start gap-3">
        <DollarSign className="w-5 h-5 text-[#A855F7] mt-0.5 shrink-0" />
        <p className="text-[#F2F2F2]/60 text-sm">
          Os valores definidos aqui passam a valer como tarifas padrão para novas corridas e entregas.
        </p>
      </Card>
    </div>
  );
}