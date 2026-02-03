import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Phone, Plus, Trash2, Edit2, ChevronLeft, MessageCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function PassengerSafety() {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isWhatsApp, setIsWhatsApp] = useState(true);
  const [relationship, setRelationship] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const emergencyContacts = await base44.entities.EmergencyContact.filter({ user_id: userData.id });
      setContacts(emergencyContacts);
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

  const maskPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const handleSave = async () => {
    if (!name || name.length < 3) {
      toast.error('Digite o nome do contato');
      return;
    }
    
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      toast.error('Telefone inválido');
      return;
    }
    
    try {
      const contactData = {
        user_id: user.id,
        name,
        phone,
        is_whatsapp: isWhatsApp,
        relationship,
        notes
      };
      
      if (editingContact) {
        await base44.entities.EmergencyContact.update(editingContact.id, contactData);
        toast.success('Contato atualizado!');
      } else {
        await base44.entities.EmergencyContact.create(contactData);
        toast.success('Contato adicionado!');
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
    setEditingContact(null);
    setName('');
    setPhone('');
    setIsWhatsApp(true);
    setRelationship('');
    setNotes('');
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhone(contact.phone);
    setIsWhatsApp(contact.is_whatsapp);
    setRelationship(contact.relationship || '');
    setNotes(contact.notes || '');
    setShowAddForm(true);
  };

  const handleDelete = async (contactId) => {
    if (!confirm('Remover este contato?')) return;
    
    try {
      await base44.entities.EmergencyContact.delete(contactId);
      toast.success('Contato removido');
      loadData();
    } catch (error) {
      toast.error('Erro ao remover');
    }
  };

  const handleCallCentral = () => {
    window.location.href = 'tel:+5516994465137';
  };

  const handleWhatsAppCentral = () => {
    const message = encodeURIComponent('Olá! Estou usando o app Central Dellas e preciso de ajuda.');
    window.open(`https://wa.me/5516994465137?text=${message}`, '_blank');
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
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('PassengerOptions')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2]">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#F2F2F2]">Emergência</h1>
        </div>

        {/* Emergency Buttons */}
        <Card className="p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30 rounded-2xl mb-6">
          <div className="space-y-3">
            <Button
              onClick={handleCallCentral}
              className="w-full bg-red-600 hover:bg-red-700 py-6 rounded-2xl text-lg font-semibold"
            >
              <Phone className="w-5 h-5 mr-2" />
              Ligar para Central Dellas
            </Button>
            
            <Button
              onClick={handleWhatsAppCentral}
              variant="outline"
              className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10 py-6 rounded-2xl text-lg font-semibold"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp Central
            </Button>
          </div>
          <p className="text-xs text-[#F2F2F2]/60 text-center mt-3">
            Central 24h: (16) 99446-5137
          </p>
        </Card>

        {/* Add Contact Button */}
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full btn-gradient py-6 rounded-2xl mb-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Contato de Confiança
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
                  {editingContact ? 'Editar Contato' : 'Novo Contato'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Nome</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                      placeholder="Nome do contato"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Telefone</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(maskPhone(e.target.value))}
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Relacionamento</label>
                    <Input
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                      placeholder="Ex: Mãe, Amiga, Irmã..."
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#0D0D0D]">
                    <span className="text-[#F2F2F2]">Possui WhatsApp</span>
                    <Switch checked={isWhatsApp} onCheckedChange={setIsWhatsApp} />
                  </div>
                  
                  <div>
                    <label className="text-sm text-[#F2F2F2]/70 mb-2 block">Observações (opcional)</label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]"
                      placeholder="Notas adicionais..."
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="flex-1 border-[#F22998]/30"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} className="flex-1 btn-gradient">
                    {editingContact ? 'Atualizar' : 'Adicionar'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contacts List */}
        <div className="space-y-3">
          {contacts.length === 0 && !showAddForm && (
            <Card className="p-8 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl text-center">
              <Shield className="w-12 h-12 text-[#F22998]/50 mx-auto mb-3" />
              <p className="text-[#F2F2F2]/60 mb-2">Nenhum contato de emergência</p>
              <p className="text-sm text-[#F2F2F2]/40">
                Adicione contatos de confiança para mais segurança
              </p>
            </Card>
          )}
          
          {contacts.map((contact) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 bg-[#1A1A1A] border-[#F22998]/20 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F22998]/20 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-[#F22998]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#F2F2F2]">{contact.name}</h3>
                      <p className="text-sm text-[#F2F2F2]/60">{contact.phone}</p>
                      {contact.relationship && (
                        <p className="text-xs text-[#F2F2F2]/40">{contact.relationship}</p>
                      )}
                      {contact.is_whatsapp && (
                        <div className="flex items-center gap-1 mt-1">
                          <MessageCircle className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-green-400">WhatsApp</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(contact)}
                      variant="ghost"
                      size="icon"
                      className="text-[#F2F2F2]/60 hover:text-[#F22998]"
                    >
                      <Edit2 className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(contact.id)}
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