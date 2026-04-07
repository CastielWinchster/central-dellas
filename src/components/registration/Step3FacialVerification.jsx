import React, { useState, useRef, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle, AlertCircle, X, Loader2, User, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import * as faceapi from '@vladmandic/face-api';

export default function Step3FacialVerification({ data, onUpdate, onComplete, onBack }) {
  const [stage, setStage] = useState('loading'); // loading, instructions, capturing, analyzing, verified, rejected, manual
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Carregar modelos do face-api.js
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoadingProgress(0);
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
      
      setLoadingProgress(25);
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      
      setLoadingProgress(50);
      await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
      
      setLoadingProgress(75);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      
      setLoadingProgress(100);
      setModelsLoaded(true);
      setStage('instructions');
      toast.success('Sistema de verificação pronto!');
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
      toast.error('Erro ao inicializar sistema de verificação');
      setStage('instructions');
    }
  };

  const handleStartCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStage('capturing');
    } catch (error) {
      toast.error('Erro ao acessar câmera');
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      setPhotoFile(blob);
      setPhotoPreview(URL.createObjectURL(blob));
      stopCamera();
      setStage('analyzing');
      analyzePhoto(blob);
    }, 'image/jpeg', 0.95);
  };

  const handleFileUpload = (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são aceitas');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setStage('analyzing');
    analyzePhoto(file);
  };

  const analyzePhoto = async (file) => {
    setAnalyzing(true);
    setAttemptCount(prev => prev + 1);

    try {
      // Criar imagem para análise
      const img = await faceapi.bufferToImage(file);
      
      // Detectar rosto com gênero e idade
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withAgeAndGender();

      if (!detection) {
        toast.error('❌ Nenhum rosto detectado. Tente outra foto.');
        setStage('instructions');
        setAnalyzing(false);
        return;
      }

      // Validar qualidade da detecção
      const { box } = detection.detection;
      const faceSize = (box.width * box.height) / (img.width * img.height);
      const confidence = detection.detection.score;

      // Validar tamanho do rosto
      if (faceSize < 0.10) {
        toast.error('⚠️ Seu rosto está muito pequeno. Chegue mais perto.');
        setStage('instructions');
        setAnalyzing(false);
        return;
      }

      if (faceSize > 0.90) {
        toast.error('⚠️ Seu rosto está muito grande. Afaste um pouco.');
        setStage('instructions');
        setAnalyzing(false);
        return;
      }

      // Validar confiança
      if (confidence < 0.85) {
        toast.error('⚠️ Foto não está clara. Tente com melhor iluminação.');
        setStage('instructions');
        setAnalyzing(false);
        return;
      }

      // Analisar gênero
      const gender = detection.gender;
      const genderProbability = detection.genderProbability;
      const age = Math.round(detection.age);

      console.log(`Gênero: ${gender}, Confiança: ${Math.round(genderProbability * 100)}%, Idade: ${age}`);

      // Upload da foto
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Verificar gênero
      if (gender === 'female' && genderProbability >= 0.75) {
        // ✅ Sucesso - é mulher
        onUpdate({
          ...data,
          facial_verification: {
            verified: true,
            photo: file_url,
            gender: 'female',
            confidence: genderProbability,
            age: age,
            timestamp: new Date().toISOString()
          }
        });
        setStage('verified');
        toast.success('✅ Identidade verificada com sucesso!');
      } else if (gender === 'female' && genderProbability >= 0.60) {
        // ⚠️ Inconclusivo - pedir nova foto
        if (attemptCount >= 3) {
          setStage('manual');
        } else {
          toast.error(`⚠️ Foto pouco clara (confiança: ${Math.round(genderProbability * 100)}%). Tente com melhor iluminação.`);
          setStage('instructions');
        }
      } else {
        // ❌ Não é mulher
        setStage('rejected');
      }
    } catch (error) {
      console.error('Erro ao analisar foto:', error);
      toast.error('Erro ao processar foto. Tente novamente.');
      setStage('instructions');
    }
    setAnalyzing(false);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleRetry = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    setStage('instructions');
  };

  const handleManualVerification = () => {
    toast.success('Solicitação de verificação manual enviada. Nossa equipe entrará em contato em até 24 horas.');
    onUpdate({
      ...data,
      facial_verification: {
        verified: false,
        manual_review_requested: true,
        timestamp: new Date().toISOString()
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Card className="bg-[#0D0D0D] border-[#F22998]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F2F2F2]">
            <Camera className="w-5 h-5 text-[#F22998]" />
            Etapa 3: Verificação Facial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence mode="wait">
            {/* Carregando modelos */}
            {stage === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <Loader2 className="w-16 h-16 text-[#F22998] mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-bold text-[#F2F2F2] mb-2">
                  Carregando Sistema de Verificação
                </h3>
                <p className="text-[#F2F2F2]/60 mb-4">
                  Inicializando modelos de IA...
                </p>
                <div className="max-w-xs mx-auto">
                  <div className="h-2 bg-[#0D0D0D] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#BF3B79] to-[#F22998]"
                      initial={{ width: 0 }}
                      animate={{ width: `${loadingProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-sm text-[#F2F2F2]/50 mt-2">{loadingProgress}%</p>
                </div>
              </motion.div>
            )}

            {/* Instruções */}
            {stage === 'instructions' && (
              <motion.div
                key="instructions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="text-center py-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#BF3B79] to-[#F22998] flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#F2F2F2] mb-2">
                    VERIFICAÇÃO DE IDENTIDADE
                  </h3>
                  <p className="text-[#F2F2F2]/60">
                    Para garantir segurança, precisamos confirmar sua identidade
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0D0D0D]">
                    <CheckCircle className="w-5 h-5 text-[#F22998] mt-0.5" />
                    <div>
                      <p className="font-medium text-[#F2F2F2]">Tire uma selfie clara</p>
                      <p className="text-sm text-[#F2F2F2]/60">Rosto bem visível</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0D0D0D]">
                    <CheckCircle className="w-5 h-5 text-[#F22998] mt-0.5" />
                    <div>
                      <p className="font-medium text-[#F2F2F2]">Sem óculos escuros ou bonés</p>
                      <p className="text-sm text-[#F2F2F2]/60">Remova acessórios que cubram o rosto</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0D0D0D]">
                    <CheckCircle className="w-5 h-5 text-[#F22998] mt-0.5" />
                    <div>
                      <p className="font-medium text-[#F2F2F2]">Boa iluminação natural</p>
                      <p className="text-sm text-[#F2F2F2]/60">Evite lugares muito escuros</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0D0D0D]">
                    <CheckCircle className="w-5 h-5 text-[#F22998] mt-0.5" />
                    <div>
                      <p className="font-medium text-[#F2F2F2]">Rosto centralizado</p>
                      <p className="text-sm text-[#F2F2F2]/60">Ocupe a maior parte da foto</p>
                    </div>
                  </div>
                </div>

                {attemptCount > 0 && (
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-sm text-yellow-400">
                      Tentativa {attemptCount} de 3. {3 - attemptCount} tentativa(s) restante(s).
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files[0])}
                    />
                    <Button
                      type="button"
                      className="w-full btn-gradient py-6"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Tirar Selfie
                    </Button>
                  </label>
                </div>
              </motion.div>
            )}

            {/* Analisando */}
            {stage === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <Loader2 className="w-16 h-16 text-[#F22998] mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-bold text-[#F2F2F2] mb-2">
                  Analisando sua foto...
                </h3>
                <p className="text-[#F2F2F2]/60">
                  Verificando identidade e detectando rosto
                </p>

                {photoPreview && (
                  <div className="mt-6">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-48 h-48 rounded-full mx-auto object-cover border-4 border-[#F22998]"
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* Verificado com sucesso */}
            {stage === 'verified' && (
              <motion.div
                key="verified"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-green-400 mb-2">
                  Identidade Verificada!
                </h3>
                <p className="text-[#F2F2F2]/60 mb-6">
                  Você está pronta para prosseguir
                </p>

                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Verified"
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-green-500 mb-6"
                  />
                )}

                <Button
                  onClick={() => onComplete(data)}
                  className="btn-gradient py-6 px-8"
                >
                  Finalizar Cadastro
                </Button>
              </motion.div>
            )}

            {/* Rejeitado */}
            {stage === 'rejected' && (
              <motion.div
                key="rejected"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <X className="w-12 h-12 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-red-400 mb-2">
                  Desculpe
                </h3>
                <p className="text-[#F2F2F2]/80 mb-4">
                  A Central Dellas é exclusiva para motoristas mulheres.
                </p>
                <p className="text-[#F2F2F2]/60 mb-6">
                  Agradecemos o interesse!
                </p>

                <Button
                  onClick={() => window.location.href = createPageUrl('DriverLogin')}
                  variant="outline"
                  className="border-[#F22998]/30 text-[#F22998]"
                >
                  Entendido
                </Button>
              </motion.div>
            )}

            {/* Verificação manual */}
            {stage === 'manual' && (
              <motion.div
                key="manual"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-[#F2F2F2] mb-2">
                  Não foi possível verificar automaticamente
                </h3>
                <p className="text-[#F2F2F2]/60 mb-6">
                  Você atingiu o limite de 3 tentativas. Deseja solicitar verificação manual?
                </p>

                <div className="flex gap-3">
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="flex-1 border-[#F22998]/30 text-[#F22998]"
                  >
                    Tentar Novamente
                  </Button>
                  <Button
                    onClick={handleManualVerification}
                    className="flex-1 btn-gradient"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Verificação Manual
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botão voltar (sempre visível exceto em verified e rejected) */}
          {stage !== 'verified' && stage !== 'rejected' && stage !== 'analyzing' && (
            <Button
              onClick={onBack}
              variant="outline"
              className="w-full border-[#F22998]/30 text-[#F22998] py-6"
            >
              Voltar
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}