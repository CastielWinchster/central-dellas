import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AudioRecorder({ onSend, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Setup audio analysis for waveform
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= 60) { // Max 60 seconds
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Start waveform visualization
      visualizeAudio();

    } catch (error) {
      toast.error('Erro ao acessar microfone');
      console.error('Recording error:', error);
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const draw = () => {
      if (!isRecording) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const normalized = Array.from(dataArray).map(v => v / 255);
      setWaveformData(normalized);
      
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, duration);
      reset();
    }
  };

  const reset = () => {
    setAudioBlob(null);
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    setDuration(0);
    setWaveformData([]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#8C0D60] p-4"
      >
        <div className="max-w-4xl mx-auto">
          {!audioBlob ? (
            <div className="flex items-center gap-4">
              <Button
                onClick={onCancel}
                variant="ghost"
                size="icon"
                className="text-[#F2F2F2]"
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="flex-1 bg-[#0D0D0D] rounded-2xl p-4 flex items-center gap-3">
                <div className="text-[#F22998] font-mono text-lg">
                  {formatTime(duration)}
                </div>
                
                {/* Waveform visualization */}
                <div className="flex-1 flex items-center gap-1 h-10">
                  {waveformData.slice(0, 32).map((value, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-[#F22998] rounded-full"
                      style={{
                        height: `${Math.max(4, value * 100)}%`,
                        opacity: 0.3 + value * 0.7
                      }}
                      animate={{
                        height: `${Math.max(4, value * 100)}%`
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  ))}
                </div>
              </div>

              {isRecording ? (
                <Button
                  onClick={stopRecording}
                  size="icon"
                  className="bg-red-600 hover:bg-red-700 animate-pulse"
                >
                  <Square className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  onClick={startRecording}
                  size="icon"
                  className="btn-gradient"
                >
                  <Mic className="w-5 h-5" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Button
                onClick={reset}
                variant="ghost"
                size="icon"
                className="text-[#F2F2F2]"
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="flex-1 bg-[#0D0D0D] rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="text-[#F22998] font-mono">
                    {formatTime(duration)}
                  </div>
                  <audio src={audioURL} controls className="flex-1" />
                </div>
              </div>

              <Button
                onClick={handleSend}
                size="icon"
                className="btn-gradient"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}