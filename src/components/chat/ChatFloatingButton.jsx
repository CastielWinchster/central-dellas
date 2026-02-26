import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ChatFloatingButton() {
  const [activeRide, setActiveRide] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchActiveRide = async () => {
      try {
        const rides = await base44.entities.Ride.filter({
          $or: [
            { passenger_id: user.id },
            { assigned_driver_id: user.id }
          ],
          status: { $in: ['accepted', 'arrived', 'in_progress'] }
        });

        if (rides.length > 0) {
          setActiveRide(rides[0]);
        } else {
          setActiveRide(null);
        }
      } catch (error) {
        console.error('Erro ao buscar corrida ativa:', error);
      }
    };

    fetchActiveRide();

    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchActiveRide, 10000);

    return () => clearInterval(interval);
  }, [user]);

  const isDark = user?.theme !== 'light';

  return (
    <AnimatePresence>
      {activeRide && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-24 right-6 z-[90]"
        >
          <Link to={createPageUrl(`RideChat/${activeRide.id}`)}>
            <button
              className={cn(
                'w-14 h-14 rounded-full shadow-lg flex items-center justify-center',
                'bg-gradient-to-br from-[#BF3B79] to-[#F22998]',
                'hover:shadow-xl transition-all duration-300',
                'hover:scale-110 active:scale-95'
              )}
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </button>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}