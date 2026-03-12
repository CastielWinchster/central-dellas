import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, Car, Bike, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function NotificationSettingsPanel({ userId }) {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, [userId]);

    const loadSettings = async () => {
        try {
            const existing = await base44.entities.NotificationSettings.filter({ user_id: userId });
            if (existing.length > 0) {
                setSettings(existing[0]);
            } else {
                // Não criar automaticamente — usar valores padrão locais
                setSettings({
                    user_id: userId,
                    notify_car_availability: true,
                    notify_motorcycle_availability: true,
                    availability_notification_frequency: 4
                });
            }
        } catch (error) {
            console.error('Erro ao carregar configurações de notificação:', error);
            // Não exibir toast de erro — não é bloqueante
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (field, value) => {
        const updated = { ...settings, [field]: value };
        setSettings(updated);
        try {
            if (settings.id) {
                await base44.entities.NotificationSettings.update(settings.id, { [field]: value });
            } else {
                const created = await base44.entities.NotificationSettings.create(updated);
                setSettings(created);
            }
            toast.success('Configuração atualizada!');
        } catch (error) {
            console.error('Erro ao atualizar configuração de notificação:', error);
            toast.error('Erro ao salvar configuração');
        }
    };

    if (loading) {
        return (
            <Card className="bg-gradient-to-br from-[#1a0a1a]/80 to-[#0D0D0D]/80 border-[#F22998]/30">
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F22998]"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!settings) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className="bg-gradient-to-br from-[#1a0a1a]/80 to-[#0D0D0D]/80 border-[#F22998]/30 shadow-xl">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-[#F2F2F2]">Notificações de Disponibilidade</CardTitle>
                            <p className="text-[#F2F2F2]/60 text-sm">Configure quando receber avisos</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Notificação de Carro */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[#0D0D0D]/50 border border-[#F22998]/20">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#BF3B79]/20 to-[#F22998]/20 flex items-center justify-center">
                                <Car className="w-5 h-5 text-[#F22998]" />
                            </div>
                            <div>
                                <h3 className="font-medium text-[#F2F2F2]">Carros Disponíveis</h3>
                                <p className="text-xs text-[#F2F2F2]/60">
                                    "Peça seu carro agora! 🚗💖✨"
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={settings.notify_car_availability}
                            onCheckedChange={(checked) => updateSetting('notify_car_availability', checked)}
                        />
                    </div>

                    {/* Notificação de Moto (Rotta Roza) */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[#0D0D0D]/50 border border-[#F22998]/20">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#BF3B79]/20 to-[#F22998]/20 flex items-center justify-center">
                                <Bike className="w-5 h-5 text-[#F22998]" />
                            </div>
                            <div>
                                <h3 className="font-medium text-[#F2F2F2]">Rotta Roza (Motos)</h3>
                                <p className="text-xs text-[#F2F2F2]/60">
                                    De mulher para mulher sua segurança é nossa!
                                </p>
                                <p className="text-xs text-[#F22998] font-semibold mt-0.5">
                                    Peça sua mototáxi agora!
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={settings.notify_motorcycle_availability}
                            onCheckedChange={(checked) => updateSetting('notify_motorcycle_availability', checked)}
                        />
                    </div>

                    {/* Frequência */}
                    <div className="p-4 rounded-lg bg-[#0D0D0D]/50 border border-[#F22998]/20">
                        <div className="flex items-center gap-3 mb-3">
                            <Clock className="w-5 h-5 text-[#F22998]" />
                            <h3 className="font-medium text-[#F2F2F2]">Frequência das Notificações</h3>
                        </div>
                        <Select
                            value={settings.availability_notification_frequency.toString()}
                            onValueChange={(value) => updateSetting('availability_notification_frequency', parseInt(value))}
                        >
                            <SelectTrigger className="bg-[#0D0D0D] border-[#F22998]/30 text-[#F2F2F2]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">A cada 1 hora</SelectItem>
                                <SelectItem value="2">A cada 2 horas</SelectItem>
                                <SelectItem value="4">A cada 4 horas (recomendado)</SelectItem>
                                <SelectItem value="6">A cada 6 horas</SelectItem>
                                <SelectItem value="12">A cada 12 horas</SelectItem>
                                <SelectItem value="24">Uma vez por dia</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-[#F2F2F2]/50 mt-2">
                            Você receberá notificações apenas quando houver motoristas disponíveis
                        </p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}