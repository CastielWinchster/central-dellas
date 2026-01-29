import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, Plus, Trash2, Check, X, AlertCircle,
  Star, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function CardsAndPix() {
  const [user, setUser] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [methodType, setMethodType] = useState('pix');
  
  // Pix form
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [pixKeyValue, setPixKeyValue] = useState('');
  
  // Card form
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpMonth, setCardExpMonth] = useState('');
  const [cardExpYear, setCardExpYear] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const methods = await base44.entities.PaymentMethod.filter({ user_id: userData.id });
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Erro ao carregar:', error);
      base44.auth.redirectToLogin();
    } finally {
      setLoading(false);
    }
  };

  const maskPixKey = (type, value) => {
    if (type === 'cpf') {
      return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (type === 'phone') {
      return value.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const maskCardNumber = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19);
  };

  const getCardBrand = (number) => {
    const cleaned = number.replace(/\D/g, '');
    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'Amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
    return 'Outro';
  };

  const validatePixKey = () => {
    if (!pixKeyValue) {
      toast.error('Digite sua chave Pix');
      return false;
    }
    
    const cleaned = pixKeyValue.replace(/\D/g, '');
    
    if (pixKeyType === 'cpf' && cleaned.length !== 11) {
      toast.error('CPF inválido');
      return false;
    }
    
    if (pixKeyType === 'phone' && cleaned.length < 10) {
      toast.error('Telefone inválido');
      return false;
    }
    
    if (pixKeyType === 'email' && !pixKeyValue.includes('@')) {
      toast.error('Email inválido');
      return false;
    }
    
    return true;
  };

  const validateCard = () => {
    if (!cardHolderName || cardHolderName.length < 3) {
      toast.error('Digite o nome completo do titular');
      return false;
    }
    
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) {
      toast.error('Número do cartão inválido');
      return false;
    }
    
    if (!cardExpMonth || !cardExpYear) {
      toast.error('Digite a validade do cartão');
      return false;
    }
    
    const month = parseInt(cardExpMonth);
    if (month < 1 || month > 12) {
      toast.error('Mês inválido');
      return false;
    }
    
    const year = parseInt(cardExpYear);
    const currentYear = new Date().getFullYear();
    if (year < currentYear || year > currentYear + 20) {
      toast.error('Ano inválido');
      return false;
    }
    
    if (!cardCvv || cardCvv.length < 3) {
      toast.error('CVV inválido');
      return false;
    }
    
    return true;
  };

  const handleAddPix = async () => {
    if (!validatePixKey()) return;
    
    try {
      await base44.entities.PaymentMethod.create({
        user_id: user.id,
        type: 'pix',
        pix_key_type: pixKeyType,
        pix_key_value: pixKeyValue,
        is_default: paymentMethods.length === 0
      });
      
      toast.success('Chave Pix adicionada!');
      setShowAddForm(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao adicionar Pix');
    }
  };

  const handleAddCard = async () => {
    if (!validateCard()) return;
    
    try {
      const cleaned = cardNumber.replace(/\D/g, '');
      const last4 = cleaned.substring(cleaned.length - 4);
      const brand = getCardBrand(cardNumber);
      
      await base44.entities.PaymentMethod.create({
        user_id: user.id,
        type: 'card',
        card_brand: brand,
        card_last4: last4,
        card_holder_name: cardHolderName,
        card_exp_month: cardExpMonth.padStart(2, '0'),
        card_exp_year: cardExpYear,
        is_default: paymentMethods.length === 0
      });
      
      toast.success('Cartão adicionado!');
      setShowAddForm(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao adicionar cartão');
    }
  };

  const resetForm = () => {
    setPixKeyValue('');
    setCardHolderName('');
    setCardNumber('');
    setCardExpMonth('');
    setCardExpYear('');
    setCardCvv('');
  };

  const handleSetDefault = async (methodId) => {
    try {
      // Remover padrão dos outros
      await Promise.all(
        paymentMethods
          .filter(m => m.is_default && m.id !== methodId)
          .map(m => base44.entities.PaymentMethod.update(m.id, { is_default: false }))
      );
      
      // Definir novo padrão
      await base44.entities.PaymentMethod.update(methodId, { is_default: true });
      
      toast.success('Método padrão atualizado');
      loadData();
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  const handleDelete = async (methodId) => {
    if (!confirm('Tem certeza que deseja remover este método?')) return;
    
    try {
      await base44.entities.PaymentMethod.delete(methodId);
      toast.success('Método removido');
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
          <h1 className="text-2xl font-bold text-[#F2F2F2]">Cartões e Pix</h1>
        </div>

        {/* Test Mode Alert */}
        <Card className="p-4 mb-6 bg-yellow-500/10 border-yellow-500/30 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-200 font-medium">Modo Teste</p>
              <p className="text-xs text-yellow-200/70 mt-1">
                Suas informações são seguras. Nenhuma cobrança real será feita neste ambiente.
              </p>
            </div>
          </div>
        </Card>

        {/* Add Button */}
        {!showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full btn-gradient py-6 rounded-2xl mb-6"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Método de Pagamento
            </Button>
          </motion.div>
        )}

        {/* Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Card className="p-6 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl">
                <h3 className="text-lg font-semibold text-[#F2F2F2] mb-4">Adicionar Novo Método</h3>
                
                {/* Type Selector */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => setMethodType('pix')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      methodType === 'pix'
                        ? 'border-[#F22998] bg-[#F22998]/10'
                        : 'border-[#F22998]/20 bg-[#0D0D0D]'
                    }`}
                  >
                    <p className="text-[#F2F2F2] font-medium">💜 Pix</p>
                  </button>
                  <button
                    onClick={() => setMethodType('card')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      methodType === 'card'
                        ? 'border-[#F22998] bg-[#F22998]/10'
                        : 'border-[#F22998]/20 bg-[#0D0D0D]'
                    }`}
                  >
                    <p className="text-[#F2F2F2] font-medium">💳 Cartão</p>
                  </button>
                </div>

                {/* Pix Form */}
                {methodType === 'pix' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Tipo de Chave</label>
                      <select
                        value={pixKeyType}
                        onChange={(e) => setPixKeyType(e.target.value)}
                        className="w-full p-3 bg-[#0D0D0D] border border-[#F22998]/20 rounded-xl text-[#F2F2F2]"
                      >
                        <option value="cpf">CPF</option>
                        <option value="phone">Telefone</option>
                        <option value="email">E-mail</option>
                        <option value="random">Chave Aleatória</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Chave Pix</label>
                      <Input
                        placeholder={
                          pixKeyType === 'cpf' ? '000.000.000-00' :
                          pixKeyType === 'phone' ? '(00) 00000-0000' :
                          pixKeyType === 'email' ? 'seu@email.com' :
                          'sua-chave-aleatoria'
                        }
                        value={pixKeyValue}
                        onChange={(e) => setPixKeyValue(e.target.value)}
                        className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setShowAddForm(false);
                          resetForm();
                        }}
                        variant="outline"
                        className="flex-1 border-[#F22998]/30"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleAddPix}
                        className="flex-1 btn-gradient"
                      >
                        Adicionar Pix
                      </Button>
                    </div>
                  </div>
                )}

                {/* Card Form */}
                {methodType === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Nome no Cartão</label>
                      <Input
                        placeholder="NOME COMPLETO"
                        value={cardHolderName}
                        onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
                        className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Número do Cartão</label>
                      <Input
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
                        className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                        maxLength={19}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Mês</label>
                        <Input
                          placeholder="MM"
                          value={cardExpMonth}
                          onChange={(e) => setCardExpMonth(e.target.value.replace(/\D/g, '').substring(0, 2))}
                          className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Ano</label>
                        <Input
                          placeholder="AAAA"
                          value={cardExpYear}
                          onChange={(e) => setCardExpYear(e.target.value.replace(/\D/g, '').substring(0, 4))}
                          className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                          maxLength={4}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#F2F2F2]/70 mb-2 block">CVV</label>
                        <Input
                          placeholder="123"
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                          className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                          maxLength={4}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setShowAddForm(false);
                          resetForm();
                        }}
                        variant="outline"
                        className="flex-1 border-[#F22998]/30"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleAddCard}
                        className="flex-1 btn-gradient"
                      >
                        Adicionar Cartão
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Methods List */}
        <div className="space-y-3">
          {paymentMethods.length === 0 && !showAddForm && (
            <Card className="p-8 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl text-center">
              <CreditCard className="w-12 h-12 text-[#F22998]/50 mx-auto mb-3" />
              <p className="text-[#F2F2F2]/60">Nenhum método de pagamento cadastrado</p>
            </Card>
          )}
          
          {paymentMethods.map((method) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F22998]/20 flex items-center justify-center">
                      {method.type === 'pix' ? '💜' : '💳'}
                    </div>
                    <div>
                      {method.type === 'pix' ? (
                        <>
                          <p className="font-medium text-[#F2F2F2]">Pix - {method.pix_key_type.toUpperCase()}</p>
                          <p className="text-sm text-[#F2F2F2]/60">
                            {maskPixKey(method.pix_key_type, method.pix_key_value)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-[#F2F2F2]">
                            {method.card_brand} •••• {method.card_last4}
                          </p>
                          <p className="text-sm text-[#F2F2F2]/60">
                            {method.card_holder_name}
                          </p>
                        </>
                      )}
                      {method.is_default && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-yellow-400">Padrão</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <Button
                        onClick={() => handleSetDefault(method.id)}
                        variant="ghost"
                        size="icon"
                        className="text-[#F2F2F2]/60 hover:text-[#F22998]"
                      >
                        <Star className="w-5 h-5" />
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDelete(method.id)}
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
          ))}
        </div>
      </div>
    </div>
  );
}