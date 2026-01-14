import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  Home, Car, MapPin, MessageCircle, User, Menu, X, 
  LogOut, History, Shield, Wallet, Star, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import NotificationBell from './components/NotificationBell';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Apply theme to document
        if (userData?.theme) {
          document.documentElement.classList.toggle('light-theme', userData.theme === 'light');
          document.documentElement.classList.toggle('dark-theme', userData.theme === 'dark');
        }
      } catch (e) {
        console.log('User not logged in');
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  // Only show navigation when user is logged in
  const passengerLinks = user ? [
    { name: 'Home', icon: Home, page: 'PassengerHome' },
    { name: 'Solicitar Corrida', icon: MapPin, page: 'RequestRide' },
    { name: 'Histórico', icon: History, page: 'RideHistory' },
    { name: 'Mensagens', icon: MessageCircle, page: 'Messages' },
    { name: 'Perfil', icon: User, page: 'Profile' },
  ] : [];

  const driverLinks = user ? [
    { name: 'Painel Motorista', icon: Car, page: 'DriverDashboard' },
    { name: 'Corridas Disponíveis', icon: MapPin, page: 'AvailableRides' },
    { name: 'Ganhos', icon: Wallet, page: 'Earnings' },
    { name: 'Avaliações', icon: Star, page: 'MyReviews' },
  ] : [];

  const isDriverPage = ['DriverDashboard', 'AvailableRides', 'Earnings', 'MyReviews'].includes(currentPageName);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ x: [0, 50, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mb-4"
          >
            <Car className="w-16 h-16 text-[#F22998]" />
          </motion.div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#BF3B79] to-[#F22998] bg-clip-text text-transparent">
            Central Dellas
          </h1>
        </motion.div>
      </div>
    );
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
        className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'glass-effect' : 'bg-white/80 backdrop-blur-20 border-b border-gray-200'}`}
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
            {user?.user_type === 'driver' || user?.user_type === 'both' ? (
              <Link
                to={createPageUrl(isDriverPage ? 'PassengerHome' : 'DriverDashboard')}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10 transition-all"
              >
                {isDriverPage ? <MapPin className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                <span className="text-sm">{isDriverPage ? 'Modo Passageira' : 'Modo Motorista'}</span>
              </Link>
            ) : null}

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
                <div className="flex gap-2">
                  <Link to={createPageUrl('PassengerLogin')}>
                    <Button className="btn-gradient px-6 py-2 rounded-full text-white font-medium">
                      Login Passageira
                    </Button>
                  </Link>
                  <Link to={createPageUrl('DriverLogin')}>
                    <Button variant="outline" className="border-[#F22998]/30 text-[#F22998] px-6 py-2 rounded-full font-medium">
                      Login Motorista
                    </Button>
                  </Link>
                </div>
              )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[#F22998]/10 transition-colors"
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
            className={`fixed inset-0 z-40 pt-20 md:hidden ${isDark ? 'bg-[#0D0D0D]/95' : 'bg-white/95'} backdrop-blur-xl`}
          >
            <nav className="p-6 space-y-2">
              {[...passengerLinks, ...driverLinks].map((link) => (
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
                  onClick={() => base44.auth.logout()}
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

      {/* Bottom Navigation - Mobile */}
      {user && (
        <motion.nav 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className={`fixed bottom-0 left-0 right-0 md:hidden z-30 ${isDark ? 'glass-effect' : 'bg-white/80 backdrop-blur-20 border-t border-gray-200'}`}
        >
          <div className="flex items-center justify-around py-3 px-2">
            {(isDriverPage ? driverLinks.slice(0, 4) : passengerLinks.slice(0, 4)).map((link, index) => (
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
          <Link
            to={createPageUrl('Profile')}
            className="flex flex-col items-center gap-1"
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={cn(
                "p-2 rounded-xl transition-all",
                currentPageName === 'Profile'
                  ? "bg-gradient-to-br from-[#BF3B79] to-[#F22998] glow-pink"
                  : isDark ? "text-[#F2F2F2]/50" : "text-gray-400"
              )}
            >
              <User className={cn(
                "w-5 h-5",
                currentPageName === 'Profile' ? "text-white" : isDark ? "text-[#F2F2F2]/50" : "text-gray-400"
              )} />
            </motion.div>
            <span className={cn(
              "text-[10px] font-medium",
              currentPageName === 'Profile' ? "text-[#F22998]" : isDark ? "text-[#F2F2F2]/50" : "text-gray-500"
            )}>Perfil</span>
            </Link>
            </div>
            </motion.nav>
            )}
    </div>
  );
}