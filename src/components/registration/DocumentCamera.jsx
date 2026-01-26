import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DocumentCamera({ docType, onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [corners, setCorners] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true);
          startDetection();
        };
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      toast.error('Não foi possível acessar a câmera');
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // Detecção básica de documento (simulação)
  const startDetection = () => {
    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        detectDocument();
      }
    }, 500);

    return () => clearInterval(interval);
  };

  const detectDocument = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Simular detecção de bordas (área central)
    const margin = 0.15;
    const detectedCorners = {
      topLeft: { x: videoWidth * margin, y: videoHeight * margin },
      topRight: { x: videoWidth * (1 - margin), y: videoHeight * margin },
      bottomRight: { x: videoWidth * (1 - margin), y: videoHeight * (1 - margin) },
      bottomLeft: { x: videoWidth * margin, y: videoHeight * (1 - margin) }
    };

    setCorners(detectedCorners);
    setDetecting(true);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Melhorar contraste e brilho
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Aumentar contraste
      data[i] = ((data[i] - 128) * 1.3) + 128;     // R
      data[i + 1] = ((data[i + 1] - 128) * 1.3) + 128; // G
      data[i + 2] = ((data[i + 2] - 128) * 1.3) + 128; // B
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const imageUrl = canvas.toDataURL('image/jpeg', 0.95);
    onCapture(imageUrl);
    stopCamera();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10001] bg-black flex flex-col"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">
                {docType === 'cnh' ? 'Capturar CNH' : 
                 docType === 'comprovante' ? 'Capturar Comprovante' : 
                 'Capturar CRLV'}
              </h3>
              <p className="text-white/70 text-sm">Posicione o documento na área</p>
            </div>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Overlay com guia */}
          {isReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-full h-full max-w-md max-h-md">
                {/* Área de detecção */}
                <rect
                  x="10%"
                  y="20%"
                  width="80%"
                  height="60%"
                  fill="none"
                  stroke={detecting ? "#22c55e" : "#F22998"}
                  strokeWidth="3"
                  strokeDasharray={detecting ? "0" : "10,5"}
                  rx="10"
                />
                
                {/* Cantos */}
                {detecting && (
                  <>
                    <circle cx="10%" cy="20%" r="8" fill="#22c55e" />
                    <circle cx="90%" cy="20%" r="8" fill="#22c55e" />
                    <circle cx="90%" cy="80%" r="8" fill="#22c55e" />
                    <circle cx="10%" cy="80%" r="8" fill="#22c55e" />
                  </>
                )}
              </svg>

              {/* Instruções */}
              <div className="absolute bottom-32 left-0 right-0 text-center">
                <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full">
                  {detecting ? (
                    <>
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">Documento detectado!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-[#F22998]" />
                      <span className="text-white font-medium">Posicione o documento</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Capture Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <Button
            onClick={capturePhoto}
            disabled={!isReady}
            className="w-full btn-gradient py-6 text-lg font-semibold"
          >
            <Camera className="w-6 h-6 mr-2" />
            Capturar Documento
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}