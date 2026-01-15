import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function FileUpload({ 
  label, 
  onFileUploaded, 
  accept = '.jpg,.jpeg,.png,.pdf',
  maxSize = 10 * 1024 * 1024 // 10MB
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    setError(null);

    // Validar tamanho
    if (file.size > maxSize) {
      setError('Arquivo muito grande. Máximo 10MB');
      return false;
    }

    // Validar tipo
    const allowedTypes = accept.split(',').map(t => t.trim());
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setError('Formato não aceito. Use JPG, PNG ou PDF');
      return false;
    }

    return true;
  };

  const handleFile = async (selectedFile) => {
    if (!validateFile(selectedFile)) return;

    setFile(selectedFile);
    setUploaded(false);
    setProgress(0);

    // Criar preview se for imagem
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }

    // Upload automático
    await uploadFile(selectedFile);
  };

  const uploadFile = async (fileToUpload) => {
    setUploading(true);
    setProgress(0);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      // Upload real
      const { file_url } = await base44.integrations.Core.UploadFile({
        file: fileToUpload
      });

      clearInterval(progressInterval);
      setProgress(100);
      setUploaded(true);
      
      if (onFileUploaded) {
        onFileUploaded(file_url);
      }

      toast.success('Arquivo enviado com sucesso!');
    } catch (error) {
      console.error('Upload error:', error);
      setError('Erro ao enviar arquivo');
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setUploaded(false);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-[#F2F2F2]/80 text-sm font-medium">{label}</label>
      )}

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl transition-all ${
          dragActive 
            ? 'border-[#BF3B79] bg-[#BF3B79]/20' 
            : error
            ? 'border-red-500/50 bg-red-500/5'
            : uploaded
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-[#F22998]/30 bg-[#F22998]/5'
        } ${file ? 'p-4' : 'p-8'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <Upload className={`w-12 h-12 mx-auto mb-3 ${
                dragActive ? 'text-[#BF3B79]' : 'text-[#F22998]'
              }`} />
              
              {dragActive ? (
                <p className="text-[#BF3B79] font-semibold mb-2">
                  Solte o arquivo aqui
                </p>
              ) : (
                <>
                  <p className="text-[#F2F2F2] font-semibold mb-2">
                    Arraste e solte o arquivo aqui
                  </p>
                  <p className="text-[#F2F2F2]/60 text-sm mb-4">
                    ou
                  </p>
                </>
              )}

              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#F22998] hover:bg-[#BF3B79] text-white"
              >
                Escolher Arquivo
              </Button>

              <p className="text-[#F2F2F2]/40 text-xs mt-3">
                Formatos aceitos: JPG, PNG, PDF (máx. 10MB)
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-3"
            >
              {/* Preview ou Ícone */}
              <div className="flex items-start gap-4">
                {preview ? (
                  <img 
                    src={preview} 
                    alt="Preview"
                    className="w-20 h-20 rounded-lg object-cover border-2 border-[#F22998]/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-[#F22998]/10 flex items-center justify-center border-2 border-[#F22998]/30">
                    <FileText className="w-10 h-10 text-[#F22998]" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F2F2F2] font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-[#F2F2F2]/60 text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <button
                      onClick={removeFile}
                      className="p-1 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <X className="w-5 h-5 text-red-400" />
                    </button>
                  </div>

                  {/* Status */}
                  <div className="mt-2">
                    {uploaded ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Enviado com sucesso!</span>
                      </div>
                    ) : uploading ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#F2F2F2]/60">Enviando...</span>
                          <span className="text-[#F22998] font-semibold">{progress}%</span>
                        </div>
                        <div className="h-2 bg-[#0D0D0D] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-gradient-to-r from-[#BF3B79] to-[#F22998]"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Botão para trocar */}
              {!uploading && (
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
                  size="sm"
                >
                  Trocar Arquivo
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Erro */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-6 left-0 right-0 flex items-center gap-2 text-red-400 text-xs"
          >
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}