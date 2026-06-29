import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Ticket, Plus, Trash2, Percent, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { toBrasiliaDateOnly } from '@/utils/dateUtils';

const EMPTY = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  valid_until: '',
  max_uses: '',
  first_ride_only: false,
  promo_type: 'general',
};

export default function CouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const list = await base44.entities.PromoCode.list('-created_date', 100);
      setCoupons(list);
    } catch (e) {
      console.error('Error loading coupons:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createCoupon = async () => {
    if (!form.code.trim()) return toast.error('Informe o código do cupom');
    if (!form.discount_value || parseFloat(form.discount_value) <= 0) return toast.error('Informe um valor de desconto válido');

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        is_active: true,
        first_ride_only: form.first_ride_only,
        promo_type: form.promo_type,
        current_uses: 0,
      };
      if (form.discount_type === 'percentage') {
        payload.discount_percentage = parseFloat(form.discount_value);
      } else {
        payload.discount_amount = parseFloat(form.discount_value);
      }
      if (form.valid_until) payload.valid_until = form.valid_until;
      if (form.max_uses) payload.max_uses = parseInt(form.max_uses);

      await base44.entities.PromoCode.create(payload);
      toast.success('Cupom criado!');
      setForm(EMPTY);
      load();
    } catch (e) {
      console.error('Error creating coupon:', e);
      toast.error('Erro ao criar cupom');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon) => {
    await base44.entities.PromoCode.update(coupon.id, { is_active: !coupon.is_active });
    load();
  };

  const remove = async (id) => {
    await base44.entities.PromoCode.delete(id);
    toast.success('Cupom removido');
    load();
  };

  return (
    <div className="space-y-4">
      {/* Form */}
      <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-5">
        <h3 className="font-bold text-[#F2F2F2] mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#F22998]" /> Novo Cupom
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#F2F2F2]/70 font-medium">Código *</label>
            <Input
              placeholder="EX: BEMVINDA10"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="bg-[#0D0D0D] border-[#F22998]/20 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#F2F2F2]/70 font-medium">Tipo de Desconto</label>
            <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
              <SelectTrigger className="bg-[#0D0D0D] border-[#F22998]/20 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0D0D0D] border-[#F22998]/20">
                <SelectItem value="percentage" className="text-white">Porcentagem (%)</SelectItem>
                <SelectItem value="amount" className="text-white">Valor fixo (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#F2F2F2]/70 font-medium">
              {form.discount_type === 'percentage' ? 'Desconto (%)' : 'Desconto (R$)'} *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
              className="bg-[#0D0D0D] border-[#F22998]/20 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#F2F2F2]/70 font-medium">Válido até</label>
            <Input
              type="date"
              value={form.valid_until}
              onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
              className="bg-[#0D0D0D] border-[#F22998]/20 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#F2F2F2]/70 font-medium">Máximo de usos</label>
            <Input
              type="number"
              min="1"
              placeholder="Ilimitado"
              value={form.max_uses}
              onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
              className="bg-[#0D0D0D] border-[#F22998]/20 text-white"
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={form.first_ride_only} onCheckedChange={(v) => setForm({ ...form, first_ride_only: v })} />
            <span className="text-sm text-[#F2F2F2]/70">Apenas primeira corrida</span>
          </div>
        </div>
        <Button
          onClick={createCoupon}
          disabled={saving}
          className="w-full mt-4 bg-gradient-to-r from-[#BF3B79] to-[#F22998] hover:opacity-90 text-white font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          {saving ? 'Criando...' : 'Criar Cupom'}
        </Button>
      </Card>

      {/* List */}
      <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10 p-5">
        <h3 className="font-bold text-[#F2F2F2] mb-4 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-[#F22998]" /> Cupons ({coupons.length})
        </h3>
        {loading ? (
          <p className="text-[#F2F2F2]/60">Carregando...</p>
        ) : coupons.length === 0 ? (
          <p className="text-[#F2F2F2]/60 text-center py-6">Nenhum cupom cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {coupons.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-[#0D0D0D] rounded-xl p-4 border border-[#F22998]/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F22998]/15 flex items-center justify-center">
                    {c.discount_percentage ? <Percent className="w-5 h-5 text-[#F22998]" /> : <DollarSign className="w-5 h-5 text-[#F22998]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#F2F2F2] tracking-wide">{c.code}</p>
                      <Badge className={c.is_active ? 'bg-green-500' : 'bg-gray-500'}>
                        {c.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {c.first_ride_only && <Badge className="bg-blue-500">1ª corrida</Badge>}
                    </div>
                    <p className="text-xs text-[#F2F2F2]/50 mt-0.5">
                      {c.discount_percentage ? `${c.discount_percentage}% off` : `R$ ${(c.discount_amount || 0).toFixed(2)} off`}
                      {c.max_uses ? ` · ${c.current_uses || 0}/${c.max_uses} usos` : ` · ${c.current_uses || 0} usos`}
                      {c.valid_until ? ` · até ${toBrasiliaDateOnly(c.valid_until)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)} className="text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}