import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Star, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function Reviews() {
  const [user, setUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        const completedRides = await base44.entities.Ride.filter({ 
          status: 'completed',
          passenger_id: userData.id 
        });
        setRides(completedRides);

        const userReviews = await base44.entities.Review.filter({ reviewer_id: userData.id });
        setReviews(userReviews);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadData();
  }, []);

  const handleSubmitReview = async () => {
    if (!selectedRide || rating === 0) return;

    setLoading(true);
    try {
      await base44.entities.Review.create({
        ride_id: selectedRide.id,
        reviewer_id: user.id,
        reviewed_id: selectedRide.driver_id,
        rating,
        comment,
        review_type: 'passenger_to_driver'
      });

      toast.success('Avaliação enviada com sucesso!');
      setSelectedRide(null);
      setRating(0);
      setComment('');
      
      const userReviews = await base44.entities.Review.filter({ reviewer_id: user.id });
      setReviews(userReviews);
    } catch (error) {
      toast.error('Erro ao enviar avaliação');
    }
    setLoading(false);
  };

  const ridesWithoutReview = rides.filter(ride => 
    !reviews.some(review => review.ride_id === ride.id)
  );

  const isDark = user?.theme !== 'light';

  return (
    <div className={`min-h-screen pb-24 md:pb-10 ${isDark ? 'bg-[#0D0D0D]' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
            Avaliações
          </h1>
          <p className={isDark ? 'text-[#F2F2F2]/60' : 'text-gray-600'}>
            Avalie suas corridas recentes
          </p>
        </motion.div>

        {/* Review Form */}
        {selectedRide && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className={`p-6 rounded-3xl ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                Avaliar Corrida
              </h3>
              
              <div className="mb-4">
                <p className={`text-sm mb-2 ${isDark ? 'text-[#F2F2F2]/60' : 'text-gray-600'}`}>
                  Como foi sua experiência?
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : isDark ? 'text-[#F2F2F2]/20' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Deixe um comentário (opcional)"
                className={`mb-4 ${isDark ? 'bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2]' : 'bg-white border-gray-300'}`}
                rows={4}
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRide(null)}
                  className={isDark ? 'border-[#F22998]/30 text-[#F2F2F2]' : 'border-gray-300'}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={rating === 0 || loading}
                  className="btn-gradient"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Avaliação
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Rides Pending Review */}
        <div className="space-y-4">
          <h2 className={`text-xl font-semibold ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
            Corridas para Avaliar
          </h2>
          
          {ridesWithoutReview.length === 0 ? (
            <Card className={`p-8 rounded-3xl text-center ${isDark ? 'bg-[#F2F2F2]/5 border-[#F22998]/10' : 'bg-white border-gray-200'}`}>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className={isDark ? 'text-[#F2F2F2]/60' : 'text-gray-600'}>
                Todas as corridas foram avaliadas!
              </p>
            </Card>
          ) : (
            ridesWithoutReview.map((ride, index) => (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`p-5 rounded-2xl cursor-pointer transition-all ${
                    isDark 
                      ? 'bg-[#F2F2F2]/5 border-[#F22998]/10 hover:border-[#F22998]/30' 
                      : 'bg-white border-gray-200 hover:border-[#F22998]/30'
                  }`}
                  onClick={() => setSelectedRide(ride)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDark ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                        {ride.destination_address}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-[#F2F2F2]/60' : 'text-gray-600'}`}>
                        {new Date(ride.completed_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button variant="outline" className="border-[#F22998]/30 text-[#F22998]">
                      Avaliar
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}