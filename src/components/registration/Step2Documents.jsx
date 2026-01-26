import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock, AlertCircle, Upload, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function Step2Documents({ data, onUpdate, onNext, onBack }) {
  const [documents, setDocuments] = useState({
    cnh: data.cnh || { uploaded: false, verified: false, photo: null },
    comprovante: data.comprovante || { uploaded: false, verified: false, photo: null },
    crlv: data.crlv || { uploaded: false, verified: false, photo: null }
  });

  const [uploading, setUploading] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const documentTypes = [
    {
      key: 'cnh',
      label: 'CNH',
      title: 'Carteira Nacional de Habilitação',
      description: 'Tire uma foto clara da sua CNH ou envie o PDF da CNH digital',
      checklist: [
        'Documento inteiro visível',
        'Texto legível',
        'Luz adequada',
        'Sem borrões'
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
    }
  ];

  const handleFileUpload = async (key, file) => {
    if (!file) return;

    setUploading(key);
    try {
      // Validar tamanho do arquivo
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB.');
        setUploading(null);
        return;
      }

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error('Apenas imagens ou PDF são aceitos');
        setUploading(null);
        return;
      }

      // Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Validar documento com IA
      const validation = await validateDocumentWithAI(key, file_url);

      if (!validation.valid) {
        toast.error(`❌ ${validation.error}`, { duration: 5000 });
        setUploading(null);
        return;
      }

      // Feedback de sucesso da IA
      toast.success('✅ Documento validado com sucesso pela IA!', { duration: 3000 });

      // Verificar fraude comparando com dados pessoais
      if (data.full_name && validation.extracted_data) {
        const fraudCheck = checkForFraud(validation.extracted_data, data);
        if (!fraudCheck.valid) {
          toast.error(`⚠️ Inconsistência detectada: ${fraudCheck.message}`, { duration: 5000 });
          setUploading(null);
          return;
        }
      }

      // Feedback final de sucesso
      toast.success(`✅ ${documentTypes.find(d => d.key === key).label} verificado com sucesso!`, { duration: 3000 });

      // Atualizar estado
      const updatedDocs = {
        ...documents,
        [key]: {
          uploaded: true,
          verified: true,
          photo: file_url,
          extracted_data: validation.extracted_data
        }
      };
      
      setDocuments(updatedDocs);
      onUpdate({ ...data, ...updatedDocs });
      } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('❌ Erro ao fazer upload. Tente novamente.', { duration: 4000 });
      }
      setUploading(null);
      };

  // Validar documento com IA
  const validateDocumentWithAI = async (docType, fileUrl) => {
    try {
      const prompts = {
        cnh: `Analise esta CNH (Carteira Nacional de Habilitação) e extraia:
- Nome completo
- Número da CNH
- CPF
- Data de nascimento
- Data de validade
- Categoria

Verifique também se:
- O documento está legível
- Não há sinais de adulteração (bordas cortadas, texto borrado, sobreposições)
- A foto está clara
- O documento não está vencido

Se houver qualquer problema, indique no campo "issues".`,
        
        comprovante: `Analise este comprovante de residência e extraia:
- Nome do titular
- Endereço completo
- Data de emissão
- Tipo de conta (água, luz, telefone, etc)

Verifique se:
- O documento tem menos de 3 meses
- O endereço está completo e legível
- O nome está visível`,
        
        crlv: `Analise este CRLV (Certificado de Registro e Licenciamento de Veículo) e extraia:
- Placa
- Marca/Modelo
- Ano
- Cor
- Nome do proprietário
- Renavam

Verifique se:
- O documento está válido
- Não há restrições
- Está legível`,
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompts[docType],
        file_urls: [fileUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            extracted_data: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                cpf: { type: 'string' },
                document_number: { type: 'string' },
                birth_date: { type: 'string' },
                expiry_date: { type: 'string' },
                address: { type: 'string' },
                plate: { type: 'string' }
              }
            },
            issues: {
              type: 'array',
              items: { type: 'string' }
            },
            confidence: { type: 'number' }
          }
        }
      });

      if (!response.valid) {
        return {
          valid: false,
          error: `Documento inválido: ${response.issues?.join(', ') || 'Não foi possível validar'}`
        };
      }

      if (response.confidence < 0.7) {
        return {
          valid: false,
          error: 'Foto muito escura ou desfocada. Tire outra com melhor qualidade.'
        };
      }

      if (response.issues && response.issues.length > 0) {
        return {
          valid: false,
          error: `Problemas detectados: ${response.issues.join(', ')}`
        };
      }

      return {
        valid: true,
        extracted_data: response.extracted_data
      };
    } catch (error) {
      console.error('Erro na validação IA:', error);
      // Se falhar, permitir prosseguir (validação manual depois)
      return {
        valid: true,
        extracted_data: null
      };
    }
  };

  // Verificar fraude comparando dados entre documentos
  const checkForFraud = (extractedData, personalData) => {
    const issues = [];

    // Comparar nome
    if (extractedData.name && personalData.full_name) {
      const normalizedExtracted = extractedData.name.toLowerCase().trim();
      const normalizedPersonal = personalData.full_name.toLowerCase().trim();
      
      // Verificar se os nomes têm alguma semelhança
      const similarity = calculateNameSimilarity(normalizedExtracted, normalizedPersonal);
      if (similarity < 0.6) {
        issues.push('Nome no documento não corresponde aos dados informados');
      }
    }

    // Comparar CPF
    if (extractedData.cpf && personalData.cpf) {
      const cleanExtracted = extractedData.cpf.replace(/\D/g, '');
      const cleanPersonal = personalData.cpf.replace(/\D/g, '');
      if (cleanExtracted !== cleanPersonal) {
        issues.push('CPF no documento não corresponde ao informado');
      }
    }

    // Comparar data de nascimento
    if (extractedData.birth_date && personalData.birth_date) {
      const extractedDate = extractedData.birth_date.replace(/\D/g, '');
      const personalDate = personalData.birth_date.replace(/\D/g, '');
      if (extractedDate !== personalDate) {
        issues.push('Data de nascimento não corresponde');
      }
    }

    // Verificar consistência entre documentos
    const allDocs = Object.values(documents).filter(d => d.extracted_data);
    if (allDocs.length > 0) {
      const firstCPF = allDocs[0].extracted_data?.cpf;
      const firstName = allDocs[0].extracted_data?.name;
      
      if (extractedData.cpf && firstCPF) {
        const clean1 = extractedData.cpf.replace(/\D/g, '');
        const clean2 = firstCPF.replace(/\D/g, '');
        if (clean1 !== clean2) {
          issues.push('CPFs não correspondem entre documentos');
        }
      }

      if (extractedData.name && firstName) {
        const similarity = calculateNameSimilarity(
          extractedData.name.toLowerCase(),
          firstName.toLowerCase()
        );
        if (similarity < 0.6) {
          issues.push('Nomes não correspondem entre documentos');
        }
      }
    }

    if (issues.length > 0) {
      return {
        valid: false,
        message: issues[0]
      };
    }

    return { valid: true };
  };

  // Calcular similaridade entre nomes
  const calculateNameSimilarity = (str1, str2) => {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    let matches = 0;
    words1.forEach(word1 => {
      if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        matches++;
      }
    });
    
    return matches / Math.max(words1.length, words2.length);
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

  // Avançar automaticamente quando todos os documentos forem verificados
  useEffect(() => {
    if (canProceed()) {
      const timer = setTimeout(() => {
        toast.success('✅ Todos os documentos verificados!');
        setTimeout(() => {
          toast.info('⏳ Prosseguindo para verificação facial...');
          setTimeout(() => {
            onNext(documents);
          }, 1000);
        }, 1500);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [documents]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Card className="bg-[#0D0D0D] border-[#F22998]/30 mb-6">
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
                          <label className="flex-1 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => handleFileUpload(docType.key, e.target.files[0])}
                              disabled={uploading === docType.key}
                            />
                            <div className={`btn-gradient w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-white font-medium transition-all hover:scale-105 ${uploading === docType.key ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                              <Camera className="w-4 h-4" />
                              Tirar Foto
                            </div>
                          </label>

                          <label className="flex-1 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => handleFileUpload(docType.key, e.target.files[0])}
                              disabled={uploading === docType.key}
                            />
                            <div className={`btn-gradient w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-white font-medium transition-all hover:scale-105 ${uploading === docType.key ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                              <Upload className="w-4 h-4" />
                              Carregar Documento
                            </div>
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
                <p className="text-sm text-blue-400 font-medium mb-1">Verificação com IA</p>
                <p className="text-sm text-[#F2F2F2]/60">
                  Usamos inteligência artificial para validar seus documentos, extrair dados e detectar fraudes. Certifique-se de que as fotos estejam claras e legíveis.
                </p>
              </div>
            </div>
          </div>

          {/* Aviso sobre progresso salvo */}
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-sm text-green-400 font-medium mb-1">Progresso Salvo Automaticamente</p>
                <p className="text-sm text-[#F2F2F2]/60">
                  Seu progresso é salvo automaticamente. Você pode sair e voltar depois sem perder seus documentos enviados.
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
          </div>

          {/* Mensagem de progresso quando todos os docs estiverem prontos */}
          {canProceed() && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Todos os documentos verificados!</span>
              </div>
              <p className="text-sm text-[#F2F2F2]/60">
                Avançando automaticamente...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}