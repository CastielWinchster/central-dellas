import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock, AlertCircle, Upload, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function Step2Documents({ data, onUpdate, onNext, onBack }) {
  const [documents, setDocuments] = useState({
    cnh: data.cnh || { uploaded: false, verified: false, photo: null },
    rg: data.rg || { uploaded: false, verified: false, photo: null },
    comprovante: data.comprovante || { uploaded: false, verified: false, photo: null },
    crlv: data.crlv || { uploaded: false, verified: false, photo: null },
    seguro: data.seguro || { uploaded: false, verified: false, photo: null }
  });

  const [uploading, setUploading] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const documentTypes = [
    {
      key: 'cnh',
      label: 'CNH',
      title: 'Carteira Nacional de Habilitação',
      description: 'Tire uma foto clara da sua CNH',
      checklist: [
        'Documento inteiro visível',
        'Texto legível',
        'Luz adequada',
        'Sem borrões'
      ]
    },
    {
      key: 'rg',
      label: 'RG',
      title: 'Registro Geral',
      description: 'Foto do RG (frente)',
      checklist: [
        'Documento inteiro visível',
        'Nome legível',
        'Número do RG visível',
        'Sem reflexos'
      ]
    },
    {
      key: 'comprovante',
      label: 'Comprovante',
      title: 'Comprovante de Residência',
      description: 'Conta de água, luz, gás ou telefone (últimos 3 meses)',
      checklist: [
        'Data recente (máx 3 meses)',
        'Endereço completo visível',
        'Seu nome no documento',
        'Texto legível'
      ]
    },
    {
      key: 'crlv',
      label: 'CRLV-e',
      title: 'Documento do Veículo',
      description: 'CRLV-e do veículo',
      checklist: [
        'Documento válido',
        'Placa visível',
        'Seu nome ou autorização',
        'Texto legível'
      ]
    },
    {
      key: 'seguro',
      label: 'Seguro',
      title: 'Comprovante de Seguro',
      description: 'Comprovante de seguro do veículo',
      checklist: [
        'Apólice ativa',
        'Cobertura para passageiros',
        'Data de validade',
        'Número da apólice visível'
      ]
    }
  ];

  const handleFileUpload = async (key, file) => {
    if (!file) return;

    setUploading(key);
    try {
      // Validar tamanho do arquivo
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB.');
        setUploading(null);
        return;
      }

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Apenas imagens são aceitas');
        setUploading(null);
        return;
      }

      // Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Simular validação do documento (em produção, seria uma API de OCR/validação)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Atualizar estado
      const updatedDocs = {
        ...documents,
        [key]: {
          uploaded: true,
          verified: true,
          photo: file_url
        }
      };
      
      setDocuments(updatedDocs);
      onUpdate({ ...data, ...updatedDocs });
      toast.success(`${documentTypes.find(d => d.key === key).label} verificado!`);
    } catch (error) {
      toast.error('Erro ao fazer upload');
    }
    setUploading(null);
  };

  const getDocumentStatus = (key) => {
    const doc = documents[key];
    if (uploading === key) return 'uploading';
    if (doc.verified) return 'verified';
    if (doc.uploaded) return 'pending';
    return 'not_uploaded';
  };

  const getStatusIcon = (key) => {
    const status = getDocumentStatus(key);
    switch (status) {
      case 'uploading':
        return <Clock className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-[#F2F2F2]/30" />;
    }
  };

  const getStatusLabel = (key) => {
    const status = getDocumentStatus(key);
    switch (status) {
      case 'uploading':
        return 'Analisando...';
      case 'verified':
        return 'Verificado';
      case 'pending':
        return 'Aguardando';
      default:
        return 'Não enviado';
    }
  };

  const canProceed = () => {
    return Object.values(documents).every(doc => doc.verified);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Card className="glass-effect border-[#F22998]/30 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F2F2F2]">
            <FileText className="w-5 h-5 text-[#F22998]" />
            Etapa 2: Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de documentos */}
          {documentTypes.map((docType, index) => (
            <div
              key={docType.key}
              className={`p-4 rounded-xl border-2 transition-all ${
                getDocumentStatus(docType.key) === 'verified'
                  ? 'bg-green-500/10 border-green-500/30'
                  : selectedDoc === docType.key
                  ? 'bg-[#F22998]/10 border-[#F22998]'
                  : 'bg-[#0D0D0D] border-[#F22998]/10'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(docType.key)}
                  <div>
                    <h3 className="font-semibold text-[#F2F2F2]">{docType.title}</h3>
                    <p className="text-sm text-[#F2F2F2]/60">{getStatusLabel(docType.key)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDoc(selectedDoc === docType.key ? null : docType.key)}
                  className="text-[#F22998]"
                >
                  {selectedDoc === docType.key ? 'Fechar' : 'Enviar'}
                </Button>
              </div>

              <AnimatePresence>
                {selectedDoc === docType.key && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="pt-3 border-t border-[#F22998]/10 space-y-3">
                      <p className="text-sm text-[#F2F2F2]/70">{docType.description}</p>

                      {/* Checklist */}
                      <div className="space-y-2">
                        {docType.checklist.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-[#F2F2F2]/60">
                            <CheckCircle className="w-4 h-4 text-[#F22998]" />
                            {item}
                          </div>
                        ))}
                      </div>

                      {/* Upload buttons */}
                      {!documents[docType.key].verified && (
                        <div className="flex gap-2">
                          <label className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => handleFileUpload(docType.key, e.target.files[0])}
                              disabled={uploading === docType.key}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full border-[#F22998]/30 text-[#F22998]"
                              disabled={uploading === docType.key}
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Tirar Foto
                            </Button>
                          </label>

                          <label className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(docType.key, e.target.files[0])}
                              disabled={uploading === docType.key}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full border-[#F22998]/30 text-[#F22998]"
                              disabled={uploading === docType.key}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Galeria
                            </Button>
                          </label>
                        </div>
                      )}

                      {/* Preview da foto */}
                      {documents[docType.key].photo && (
                        <div className="mt-3">
                          <img
                            src={documents[docType.key].photo}
                            alt={docType.title}
                            className="w-full h-40 object-cover rounded-lg border-2 border-[#F22998]/30"
                          />
                        </div>
                      )}

                      {/* Status de validação */}
                      {uploading === docType.key && (
                        <div className="flex items-center gap-2 text-sm text-blue-400">
                          <Clock className="w-4 h-4 animate-spin" />
                          Analisando documento...
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Aviso */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-400 font-medium mb-1">Verificação Automática</p>
                <p className="text-sm text-[#F2F2F2]/60">
                  Seus documentos são verificados automaticamente. Certifique-se de que as fotos estejam claras e legíveis.
                </p>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 border-[#F22998]/30 text-[#F22998] py-6"
            >
              Voltar
            </Button>
            <Button
              onClick={() => onNext(documents)}
              disabled={!canProceed()}
              className={`flex-1 py-6 ${
                canProceed() ? 'btn-gradient' : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              Próximo
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}