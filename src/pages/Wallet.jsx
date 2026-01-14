import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, QrCode, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Wallet() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      let userWallet = await base44.entities.Wallet.filter({ user_id: userData.id });
      if (userWallet.length === 0) {
        userWallet = await base44.entities.Wallet.create({ user_id: userData.id, balance: 0 });
        setWallet(userWallet);
      } else {
        setWallet(userWallet[0]);
      }

      const userTransactions = await base44.entities.WalletTransaction.filter(
        { user_id: userData.id },
        '-created_date',
        20
      );
      setTransactions(userTransactions);
    } catch (e) {
      base44.auth.redirectToLogin();
    }
    setLoading(false);
  };

  const generatePixQRCode = () => {
    // Simular geração de QR Code PIX
    const mockQRCode = `00020126360014BR.GOV.BCB.PIX0114+55119${Math.random().toString().slice(2, 11)}520400005303986540${parseFloat(amount).toFixed(2)}5802BR5925CENTRAL DELLAS6009SAO PAULO`;
    return mockQRCode;
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    try {
      if (paymentMethod === 'pix') {
        const qr = generatePixQRCode();
        setQrCode(qr);
        
        await base44.entities.WalletTransaction.create({
          wallet_id: wallet.id,
          user_id: user.id,
          type: 'deposit',
          amount: parseFloat(amount),
          description: 'Depósito via PIX',
          payment_method: 'pix',
          pix_qr_code: qr,
          status: 'pending'
        });

        toast.success('QR Code gerado! Escaneie para pagar');
      } else {
        // Simulação de pagamento com cartão
        await base44.entities.WalletTransaction.create({
          wallet_id: wallet.id,
          user_id: user.id,
          type: 'deposit',
          amount: parseFloat(amount),
          description: `Depósito via ${paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito'}`,
          payment_method: paymentMethod,
          status: 'completed'
        });

        await base44.entities.Wallet.update(wallet.id, {
          balance: wallet.balance + parseFloat(amount)
        });

        toast.success('Depósito realizado com sucesso!');
        setDepositOpen(false);
        setAmount('');
        loadData();
      }
    } catch (error) {
      toast.error('Erro ao processar depósito');
    }
  };

  const confirmPixPayment = async () => {
    try {
      const pendingTransaction = transactions.find(t => t.pix_qr_code === qrCode && t.status === 'pending');
      
      if (pendingTransaction) {
        await base44.entities.WalletTransaction.update(pendingTransaction.id, {
          status: 'completed'
        });

        await base44.entities.Wallet.update(wallet.id, {
          balance: wallet.balance + pendingTransaction.amount
        });

        toast.success('Pagamento confirmado!');
        setQrCode('');
        setDepositOpen(false);
        setAmount('');
        loadData();
      }
    } catch (error) {
      toast.error('Erro ao confirmar pagamento');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="w-8 h-8 rounded-full border-2 border-[#F22998] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24 md:pb-10">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-[#F2F2F2] mb-8"
        >
          Carteira Digital
        </motion.h1>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-6 bg-gradient-to-br from-[#BF3B79]/20 to-[#F22998]/20 border-[#F22998]/30">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F22998]/20 flex items-center justify-center">
                    <WalletIcon className="w-6 h-6 text-[#F22998]" />
                  </div>
                  <div>
                    <p className="text-[#F2F2F2]/60 text-sm">Saldo Disponível</p>
                    <p className="text-3xl font-bold text-[#F2F2F2]">
                      R$ {wallet?.balance?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setDepositOpen(true)}
                  className="btn-gradient"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Saldo
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions */}
        <Card className="bg-[#F2F2F2]/5 border-[#F22998]/10">
          <CardHeader>
            <CardTitle className="text-[#F2F2F2]">Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#F22998]/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        transaction.type === 'deposit' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {transaction.type === 'deposit' ? (
                          <ArrowDownLeft className="w-5 h-5 text-green-400" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[#F2F2F2]">{transaction.description}</p>
                        <p className="text-sm text-[#F2F2F2]/60">
                          {new Date(transaction.created_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-[#F2F2F2]/60">
                        {transaction.status === 'pending' ? 'Pendente' : 'Concluído'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-[#F2F2F2]/50">
                Nenhuma transação ainda
              </p>
            )}
          </CardContent>
        </Card>

        {/* Deposit Dialog */}
        <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
          <DialogContent className="bg-[#0D0D0D] border-[#F22998]/30">
            <DialogHeader>
              <DialogTitle className="text-[#F2F2F2]">Adicionar Saldo</DialogTitle>
            </DialogHeader>
            
            {qrCode ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl">
                  <p className="text-center text-black text-xs mb-2">Escaneie o QR Code</p>
                  <div className="bg-gray-200 p-4 rounded text-center">
                    <QrCode className="w-32 h-32 mx-auto text-black" />
                  </div>
                  <p className="text-center text-black text-xs mt-2 font-mono break-all">
                    {qrCode}
                  </p>
                </div>
                <Button
                  onClick={confirmPixPayment}
                  className="w-full btn-gradient"
                >
                  Confirmar Pagamento
                </Button>
                <Button
                  onClick={() => setQrCode('')}
                  variant="outline"
                  className="w-full border-[#F22998]/30 text-[#F22998]"
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  type="number"
                  placeholder="Valor (R$)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                />

                <div className="space-y-2">
                  <p className="text-sm text-[#F2F2F2]/60">Método de Pagamento</p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setPaymentMethod('pix')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'pix'
                          ? 'border-[#F22998] bg-[#F22998]/10'
                          : 'border-[#F22998]/20 bg-[#F2F2F2]/5'
                      }`}
                    >
                      <QrCode className="w-6 h-6 text-[#F22998] mx-auto mb-1" />
                      <p className="text-xs text-[#F2F2F2]">PIX</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('credit_card')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'credit_card'
                          ? 'border-[#F22998] bg-[#F22998]/10'
                          : 'border-[#F22998]/20 bg-[#F2F2F2]/5'
                      }`}
                    >
                      <CreditCard className="w-6 h-6 text-[#F22998] mx-auto mb-1" />
                      <p className="text-xs text-[#F2F2F2]">Crédito</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('debit_card')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'debit_card'
                          ? 'border-[#F22998] bg-[#F22998]/10'
                          : 'border-[#F22998]/20 bg-[#F2F2F2]/5'
                      }`}
                    >
                      <CreditCard className="w-6 h-6 text-[#F22998] mx-auto mb-1" />
                      <p className="text-xs text-[#F2F2F2]">Débito</p>
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleDeposit}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="w-full btn-gradient"
                >
                  Continuar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}