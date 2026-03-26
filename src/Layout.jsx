import React, { useState, useEffect, lazy, Suspense } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  Home, Car, MapPin, MessageCircle, User, Menu, X, 
  LogOut, History, Shield, Wallet, Star, Settings, Download as DownloadIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthUser } from '../components/AuthGuard';
import { requestPermissionAndSaveToken, onMessageListener } from './components/firebase/pushService';
import NotificationBell from './components/NotificationBell';

const ChatbotFloat = lazy(() => import('./components/ChatbotFloat'));
const KeyboardShortcutsHelp = lazy(() => import('./components/KeyboardShortcutsHelp'));
const ChatFloatingButton = lazy(() => import('./components/chat/ChatFloatingButton'));

// Rotas públicas que não exigem autenticação
const PUBLIC_ROUTES = ['PassengerHome', 'CustomLogin', 'CustomSignup', 'Download'];

function LayoutContent({ children, currentPageName }) {
  const navigate = useNavigate();
  const { user, isLoading: loading } = useAuthUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Apply theme to document
    if (user?.theme) {
      document.documentElement.classList.toggle('light-theme', user.theme === 'light');
      document.documentElement.classList.toggle('dark-theme', user.theme === 'dark');
    }
  }, [user]);

  // Solicitar permissão de push notification após login
  useEffect(() => {
    if (!user) return;
    const alreadyAsked = localStorage.getItem('push_permission_asked');
    if (alreadyAsked) return;

    // Aguarda 3s para não incomodar imediatamente
    const timer = setTimeout(async () => {
      try {
        await requestPermissionAndSaveToken(user.id);
        localStorage.setItem('push_permission_asked', 'true');
      } catch (e) {
        console.error('Erro ao registrar push:', e);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user?.id]);

  // Listener para mensagens em foreground
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onMessageListener(async (payload) => {
      const title = payload.notification?.title || 'Central Dellas';
      const body = payload.notification?.body || '';
      const data = payload.data || {};

      // Salvar no inbox (NotificationBell irá atualizar via subscribe)
      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: user.id,
          title,
          message: body,
          type: data.type || 'system',
          is_read: false,
          is_persistent: true,
          related_link: data.link || null
        });
      } catch (e) {
        // Fallback: mostrar notificação nativa se não conseguir salvar
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/icon-192.png' });
        }
      }
    });
    return () => typeof unsubscribe === 'function' && unsubscribe();
  }, [user?.id]);

  // Simplified navigation - only Home and Solicitar Corrida
  const passengerLinks = [
    { name: 'Home', icon: Home, page: 'PassengerHome' },
    { 
      name: 'Opções', 
      icon: Settings, 
      page: user ? 'PassengerOptions' : 'PassengerLogin'
    },
    { name: 'Baixar App', icon: DownloadIcon, page: 'Download' }
  ];

  const driverLinks = [
    { name: 'Home', icon: Home, page: 'DriverDashboard' },
    { name: 'Ganhos', icon: Wallet, page: 'Earnings' },
    { name: 'Opções', icon: Settings, page: 'DriverOptions' }
  ];

  const isDriverPage = ['DriverDashboard', 'AvailableRides', 'Earnings', 'MyReviews', 'DriverOptions', 'DriverProfile'].includes(currentPageName);

  // Redirect para login se não estiver autenticado e não estiver em rota pública
  useEffect(() => {
    if (!loading && !user && !PUBLIC_ROUTES.includes(currentPageName)) {
      navigate(createPageUrl('CustomLogin'));
    }
  }, [loading, user, currentPageName, navigate]);

  // Loading screen animada com corrida
  if (loading) {
    return <LoadingScreen isLoading={true} />;
  }

  const isDark = user?.theme !== 'light';

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-[#0D0D0D] text-[#F2F2F2]' : 'bg-gray-50 text-gray-900'}`}>
      <style>{`
        :root {
          --rosa-principal: #BF3B79;
          --rosa-vibrante: #F22998;
          --roxo-escuro: #8C0D60;
          --branco-gelo: #F2F2F2;
          --preto-profundo: #0D0D0D;
        }
        
        .light-theme {
          --bg-primary: #f9fafb;
          --bg-secondary: #ffffff;
          --text-primary: #111827;
          --text-secondary: #6b7280;
        }
        
        .dark-theme {
          --bg-primary: #0D0D0D;
          --bg-secondary: #1a1a1a;
          --text-primary: #F2F2F2;
          --text-secondary: rgba(242, 242, 242, 0.6);
        }
        
        .gradient-pink {
          background: linear-gradient(135deg, #BF3B79 0%, #F22998 50%, #8C0D60 100%);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #BF3B79 0%, #F22998 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .light-theme .glass-effect {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(191, 59, 121, 0.2);
        }
        
        .dark-theme .glass-effect {
          background: rgba(13, 13, 13, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(191, 59, 121, 0.2);
        }
        
        .glow-pink {
          box-shadow: 0 0 20px rgba(242, 41, 152, 0.3), 0 0 40px rgba(191, 59, 121, 0.2);
        }
        
        .btn-gradient {
          background: linear-gradient(135deg, #BF3B79 0%, #F22998 100%);
          transition: all 0.3s ease;
        }
        
        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(242, 41, 152, 0.4);
        }
        
        @keyframes pulse-pink {
          0%, 100% { box-shadow: 0 0 0 0 rgba(242, 41, 152, 0.4); }
          50% { box-shadow: 0 0 0 15px rgba(242, 41, 152, 0); }
        }
        
        .pulse-animation {
          animation: pulse-pink 2s infinite;
        }
      `}</style>

      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-[10000] backdrop-blur-xl ${isDark ? 'bg-[#0D0D0D]/95 border-b border-[#F22998]/20' : 'bg-white/95 border-b border-gray-200'} shadow-lg`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl('PassengerHome')} className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ea008a15739746d55f4e/50cfce50f_central2.png"
              alt="Central Dellas"
              className="h-14 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center gap-6">
              {(isDriverPage ? driverLinks : passengerLinks).map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                    currentPageName === link.page
                      ? "btn-gradient text-white"
                      : isDark ? "text-[#F2F2F2]/70 hover:text-[#F22998]" : "text-gray-600 hover:text-[#F22998]"
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{link.name}</span>
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-4">
            {user && (user.user_type === 'driver' || user.user_type === 'both' || user.role === 'admin') && (
                <Link
                  to={createPageUrl(isDriverPage ? 'PassengerHome' : 'DriverDashboard')}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10 transition-all"
                >
                  {isDriverPage ? <MapPin className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                  <span className="text-sm">{isDriverPage ? 'Modo Passageira' : 'Modo Motorista'}</span>
                </Link>
              )}

            {user ? (
                <div className="hidden md:flex items-center gap-3">
                  <NotificationBell userId={user.id} />
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#F22998]">
                    {user.photo_url ? (
                      <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#BF3B79] to-[#8C0D60] flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex gap-2">
                  <Link to={createPageUrl('CustomLogin')}>
                    <Button className="btn-gradient px-6 py-2 rounded-full text-white font-medium">
                      Entrar
                    </Button>
                  </Link>
                  <Link to={createPageUrl('CustomSignup')}>
                    <Button variant="outline" className="border-[#F22998]/30 text-[#F22998] px-6 py-2 rounded-full font-medium">
                      Cadastrar
                    </Button>
                  </Link>
                </div>
              )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[#F22998]/10 transition-colors relative z-[10001]"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && user && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className={`fixed inset-0 z-[9999] pt-20 md:hidden ${isDark ? 'bg-[#0D0D0D]/95' : 'bg-white/95'} backdrop-blur-xl`}
          >
            <nav className="p-6 space-y-2">
              {user && (user.user_type === 'driver' || user.user_type === 'both' || user.role === 'admin') && (
                <Link
                  to={createPageUrl(isDriverPage ? 'PassengerHome' : 'DriverDashboard')}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-4 px-4 py-4 rounded-xl bg-[#F22998]/10 border border-[#F22998]/30 hover:bg-[#F22998]/20 transition-all mb-3"
                >
                  {isDriverPage ? <MapPin className="w-6 h-6 text-[#F22998]" /> : <Car className="w-6 h-6 text-[#F22998]" />}
                  <span className="font-medium text-[#F22998]">
                    {isDriverPage ? 'Modo Passageira' : 'Modo Motorista'}
                  </span>
                </Link>
              )}

              {(isDriverPage ? driverLinks : passengerLinks).map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-4 rounded-xl transition-all",
                    currentPageName === link.page
                      ? "bg-gradient-to-r from-[#BF3B79]/20 to-[#F22998]/20 border border-[#F22998]/30"
                      : isDark ? "hover:bg-[#F22998]/10" : "hover:bg-gray-100"
                  )}
                >
                  <link.icon className={cn(
                    "w-6 h-6",
                    currentPageName === link.page ? "text-[#F22998]" : isDark ? "text-[#F2F2F2]/70" : "text-gray-600"
                  )} />
                  <span className={cn(
                    "font-medium",
                    currentPageName === link.page ? "text-[#F22998]" : isDark ? "text-[#F2F2F2]/70" : "text-gray-600"
                  )}>{link.name}</span>
                </Link>
              ))}

              {user && (
                <button
                  onClick={async () => {
                    await base44.auth.signOut();
                    window.location.href = createPageUrl('CustomLogin');
                  }}
                  className="flex items-center gap-4 px-4 py-4 rounded-xl w-full text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-6 h-6" />
                  <span className="font-medium">Sair</span>
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-20 min-h-screen">
        {children}
      </main>

      {/* Chat Float Button */}
      <Suspense fallback={null}>
        <ChatFloatingButton />
      </Suspense>

      {/* Chatbot Float */}
      <Suspense fallback={null}>
        <ChatbotFloat />
      </Suspense>

      {/* Bottom Navigation - Mobile */}
      {user && (
        <motion.nav 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className={`fixed bottom-0 left-0 right-0 md:hidden z-[80] ${isDark ? 'bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-[#F22998]/20' : 'bg-white/95 backdrop-blur-xl border-t border-gray-200'} shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]`}
            >
              <div className="flex items-center justify-around py-3 px-2">
                {(isDriverPage ? driverLinks : passengerLinks).map((link, index) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className="flex flex-col items-center gap-1"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "p-2 rounded-xl transition-all",
                      currentPageName === link.page
                        ? "bg-gradient-to-br from-[#BF3B79] to-[#F22998] glow-pink"
                        : isDark ? "text-[#F2F2F2]/50" : "text-gray-400"
                    )}
                  >
                    <link.icon className={cn(
                      "w-5 h-5",
                      currentPageName === link.page ? "text-white" : isDark ? "text-[#F2F2F2]/50" : "text-gray-400"
                    )} />
                  </motion.div>
                  <span className={cn(
                    "text-[10px] font-medium",
                    currentPageName === link.page ? "text-[#F22998]" : isDark ? "text-[#F2F2F2]/50" : "text-gray-500"
                  )}>{link.name}</span>
                </Link>
              ))}
                </div>
                </motion.nav>
                )}
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return <LayoutContent children={children} currentPageName={currentPageName} />;
}