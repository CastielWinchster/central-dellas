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
  const [detectionInterval, setDetectionInterval] = useState(null);
  const [hasDetectedDocument, setHasDetectedDocument] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      // Solicitar a melhor resolução possível do dispositivo
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 3840, min: 1920 },
          height: { ideal: 2160, min: 1080 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsReady(true);
          const interval = startDetection();
          setDetectionInterval(interval);
        };
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      toast.error('Não foi possível acessar a câmera');
      onClose();
    }
  };

  const stopCamera = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // Detecção real de documento usando análise de bordas
  const startDetection = () => {
    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        detectDocument();
      }
    }, 200); // Detecção a cada 200ms para fluidez

    return interval;
  };

  const detectDocument = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar frame atual
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Obter dados da imagem
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Detectar bordas usando algoritmo simples de detecção de contraste
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    let edgeCount = 0;
    const threshold = 80;

    // Varrer a imagem em busca de bordas fortes
    for (let y = 0; y < canvas.height; y += 10) {
      for (let x = 0; x < canvas.width; x += 10) {
        const i = (y * canvas.width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        // Verificar contraste com pixel adjacente
        const i2 = ((y + 5) * canvas.width + (x + 5)) * 4;
        if (i2 < data.length) {
          const brightness2 = (data[i2] + data[i2 + 1] + data[i2 + 2]) / 3;
          const contrast = Math.abs(brightness - brightness2);
          
          if (contrast > threshold) {
            edgeCount++;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
    }

    // Se detectou bordas suficientes (documento presente)
    if (edgeCount > 50) {
      // Adicionar margem
      const margin = 20;
      const detectedCorners = {
        topLeft: { x: Math.max(0, minX - margin), y: Math.max(0, minY - margin) },
        topRight: { x: Math.min(canvas.width, maxX + margin), y: Math.max(0, minY - margin) },
        bottomRight: { x: Math.min(canvas.width, maxX + margin), y: Math.min(canvas.height, maxY + margin) },
        bottomLeft: { x: Math.max(0, minX - margin), y: Math.min(canvas.height, maxY + margin) }
      };

      // Verificar se é um retângulo válido (proporções de documento)
      const width = maxX - minX;
      const height = maxY - minY;
      const aspectRatio = width / height;
      
      // CNH tem proporção aproximada de 1.58:1 (85.6mm x 54mm)
      const isValidDocument = aspectRatio > 1.3 && aspectRatio < 1.7 && 
                              width > canvas.width * 0.3 && 
                              height > canvas.height * 0.2;

      setCorners(detectedCorners);
      setDetecting(isValidDocument);

      if (isValidDocument && !hasDetectedDocument) {
        setHasDetectedDocument(true);
      }
    } else {
      setCorners(null);
      setDetecting(false);
      setHasDetectedDocument(false);
    }
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

          {/* Overlay com guia dinâmica */}
          {isReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg className="w-full h-full" viewBox={`0 0 ${videoRef.current?.videoWidth || 640} ${videoRef.current?.videoHeight || 480}`}>
                {corners ? (
                  <>
                    {/* Polígono detectado */}
                    <polygon
                      points={`${corners.topLeft.x},${corners.topLeft.y} ${corners.topRight.x},${corners.topRight.y} ${corners.bottomRight.x},${corners.bottomRight.y} ${corners.bottomLeft.x},${corners.bottomLeft.y}`}
                      fill="none"
                      stroke={detecting ? "#22c55e" : "#ef4444"}
                      strokeWidth="4"
                      strokeDasharray={detecting ? "0" : "15,10"}
                    />
                    
                    {/* Cantos detectados */}
                    <circle cx={corners.topLeft.x} cy={corners.topLeft.y} r="12" fill={detecting ? "#22c55e" : "#ef4444"} />
                    <circle cx={corners.topRight.x} cy={corners.topRight.y} r="12" fill={detecting ? "#22c55e" : "#ef4444"} />
                    <circle cx={corners.bottomRight.x} cy={corners.bottomRight.y} r="12" fill={detecting ? "#22c55e" : "#ef4444"} />
                    <circle cx={corners.bottomLeft.x} cy={corners.bottomLeft.y} r="12" fill={detecting ? "#22c55e" : "#ef4444"} />
                  </>
                ) : (
                  /* Guia padrão quando não detecta nada */
                  <rect
                    x="10%"
                    y="25%"
                    width="80%"
                    height="50%"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeDasharray="20,10"
                    rx="15"
                  />
                )}
              </svg>

              {/* Instruções */}
              <div className="absolute bottom-32 left-0 right-0 text-center">
                <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full">
                  {hasDetectedDocument ? (
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
            disabled={!isReady || !detecting}
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