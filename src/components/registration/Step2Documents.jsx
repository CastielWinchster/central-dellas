import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock, AlertCircle, Upload, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import DocumentCamera from './DocumentCamera';

export default function Step2Documents({ data, onUpdate, onNext, onBack }) {
  const [documents, setDocuments] = useState({
    cnh: data.cnh || { uploaded: false, verified: false, photo: null, error: null },
    comprovante: data.comprovante || { uploaded: false, verified: false, photo: null, error: null },
    crlv: data.crlv || { uploaded: false, verified: false, photo: null, error: null }
  });

  const [uploading, setUploading] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showCamera, setShowCamera] = useState(null);
  const [pendingFile, setPendingFile] = useState({});
  const [verificationAttempts, setVerificationAttempts] = useState({
    cnh: 0,
    comprovante: 0,
    crlv: 0
  });

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

  // Selecionar arquivo (apenas preview)
  const handleFileSelect = async (key, file) => {
    if (!file) return;

    try {
      // Validar tamanho do arquivo
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB.');
        return;
      }

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error('Apenas imagens ou PDF são aceitos');
        return;
      }

      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const updatedDocs = {
          ...documents,
          [key]: {
            uploaded: true,
            verified: false,
            photo: e.target.result,
            file: file,
            error: null
          }
        };
        setDocuments(updatedDocs);
        setPendingFile({ ...pendingFile, [key]: file });
        onUpdate({ [key]: updatedDocs[key] });
      };
      reader.readAsDataURL(file);
      
      toast.success('Documento carregado! Revise e envie para análise.');
    } catch (error) {
      console.error('Erro ao selecionar arquivo:', error);
      toast.error('Erro ao carregar arquivo');
    }
  };

  // Solicitar análise manual
  const handleRequestManualReview = async (key) => {
    try {
      const file = pendingFile[key];
      if (!file) return;

      setUploading(key);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const updatedDocs = {
        ...documents,
        [key]: {
          uploaded: true,
          verified: true, // Permitir prosseguir
          photo: file_url,
          manual_review: true,
          error: null
        }
      };

      setDocuments(updatedDocs);
      onUpdate({ [key]: updatedDocs[key] });

      toast.success('✅ Documento enviado para análise manual! Você pode prosseguir.', { duration: 4000 });
      
      const newPending = { ...pendingFile };
      delete newPending[key];
      setPendingFile(newPending);
    } catch (error) {
      console.error('Erro ao enviar para análise manual:', error);
      toast.error('Erro ao enviar documento. Tente novamente.');
    } finally {
      setUploading(null);
    }
  };

  // Enviar documento para análise
  const handleSubmitDocument = async (key) => {
    const file = pendingFile[key];
    if (!file) return;

    setUploading(key);
    
    // Incrementar tentativas
    const newAttempts = { ...verificationAttempts, [key]: verificationAttempts[key] + 1 };
    setVerificationAttempts(newAttempts);

    try {
      // Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Validar documento com IA
      const validation = await validateDocumentWithAI(key, file_url);

      if (!validation.valid) {
        // Mostrar erro específico
        toast.error(`❌ ${validation.specific_issue || validation.error}`, { duration: 6000 });
        
        const updatedDocsWithError = {
          ...documents,
          [key]: {
            ...documents[key],
            verified: false,
            error: validation.specific_issue || validation.error,
            detailed_feedback: validation.feedback
          }
        };
        setDocuments(updatedDocsWithError);
        onUpdate({ [key]: updatedDocsWithError[key] });
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
          const updatedDocsWithError = {
            ...documents,
            [key]: {
              ...documents[key],
              verified: false,
              error: `Inconsistência: ${fraudCheck.message}`
            }
          };
          setDocuments(updatedDocsWithError);
          onUpdate({ [key]: updatedDocsWithError[key] });
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
          extracted_data: validation.extracted_data,
          error: null
        }
      };
      
      setDocuments(updatedDocs);
      onUpdate({ [key]: updatedDocs[key] });
      
      // Limpar arquivo pendente
      const newPending = { ...pendingFile };
      delete newPending[key];
      setPendingFile(newPending);
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('❌ Erro ao fazer upload. Tente novamente.', { duration: 4000 });
      const updatedDocsWithError = {
        ...documents,
        [key]: {
          ...documents[key],
          verified: false,
          error: 'Falha no envio ou processamento do documento.'
        }
      };
      setDocuments(updatedDocsWithError);
      onUpdate({ [key]: updatedDocsWithError[key] });
    } finally {
      setUploading(null);
    }
  };

  // Cancelar upload
  const handleCancelUpload = (key) => {
    const updatedDocs = {
      ...documents,
      [key]: { uploaded: false, verified: false, photo: null, error: null }
    };
    setDocuments(updatedDocs);
    onUpdate({ [key]: updatedDocs[key] });
    
    const newPending = { ...pendingFile };
    delete newPending[key];
    setPendingFile(newPending);
    
    toast.info('Upload cancelado');
  };

  // Abrir câmera inteligente
  const handleCameraCapture = (key) => {
    setShowCamera(key);
  };

  // Callback da câmera
  const handleCameraResult = (key, imageData) => {
    const updatedDocs = {
      ...documents,
      [key]: {
        uploaded: true,
        verified: false,
        photo: imageData,
        isCamera: true,
        error: null
      }
    };
    setDocuments(updatedDocs);
    setShowCamera(null);
    
    // Converter base64 para File
    fetch(imageData)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `${key}.jpg`, { type: 'image/jpeg' });
        setPendingFile({ ...pendingFile, [key]: file });
      });
    
    toast.success('Foto capturada! Revise e envie para análise.');
    onUpdate({ [key]: updatedDocs[key] });
  };

  // Validar documento com IA - Sistema aprimorado com tratamento de imagem
  const validateDocumentWithAI = async (docType, fileUrl) => {
    try {
      const prompts = {
        cnh: `Você é um especialista em análise de documentos brasileiros com processamento avançado de imagem. Analise esta CNH (Carteira Nacional de Habilitação).

PROCESSAMENTO DE IMAGEM (CRÍTICO):
1. ROTAÇÃO: Se o texto estiver vertical ou diagonal, IDENTIFIQUE a orientação correta e EXTRAIA os dados considerando a rotação necessária
2. REFLEXOS: Identifique áreas com reflexo de luz e tente ler ao redor delas
3. FOCO: Se partes estão desfocadas mas o ESSENCIAL está legível, considere válido

DADOS A EXTRAIR (ordem de prioridade):
- Nome completo (ESSENCIAL)
- CPF (ESSENCIAL)  
- Número da CNH / Registro (ESSENCIAL)
- Data de nascimento (IMPORTANTE)
- Data de validade (IMPORTANTE)
- Categoria (SECUNDÁRIO - Ex: AB, B, C, D, E)

VALIDAÇÃO FLEXÍVEL - CONSIDERE VÁLIDO SE:
- Nome, CPF e Número da CNH estão legíveis (mesmo que outros campos estejam parcialmente ilegíveis)
- Documento está rotacionado mas o texto pode ser lido
- Há reflexos LEVES mas não impedem leitura dos campos essenciais
- Foto da pessoa está parcialmente cortada mas dados textuais estão completos

REJEITE APENAS SE:
- Documento vencido (data de validade anterior a hoje: ${new Date().toLocaleDateString('pt-BR')})
- Sinais CLAROS de adulteração (edição digital, rasuras, montagem)
- IMPOSSÍVEL ler nome OU CPF OU número da CNH
- Documento completamente desfocado ou muito escuro
- Não é uma CNH brasileira

FEEDBACK ESPECÍFICO - Se invalid, indique EXATAMENTE o problema:
- "Documento rotacionado 90° para a direita - não foi possível ler"
- "Reflexo intenso cobrindo o campo do nome"
- "Parte inferior do documento cortada - faltam data de nascimento e validade"  
- "CNH vencida em DD/MM/AAAA"
- "Documento muito escuro - campos ilegíveis"
- "Possível edição digital detectada no campo CPF"`,
        
        comprovante: `Você é um especialista em análise de documentos com processamento avançado. Analise este comprovante de residência.

PROCESSAMENTO DE IMAGEM:
- Se rotacionado, identifique orientação e leia adequadamente
- Ignore reflexos leves e manchas que não impedem leitura

DADOS A EXTRAIR (prioridade):
- Nome do titular (ESSENCIAL)
- Endereço (rua, número, cidade, CEP - ESSENCIAL)
- Data de emissão (IMPORTANTE)
- Tipo de conta (água, luz, telefone, internet, gás - SECUNDÁRIO)

VALIDAÇÃO FLEXÍVEL - VÁLIDO SE:
- Nome e endereço principal (rua/número/cidade) estão legíveis
- Data está visível (mesmo com pequeno reflexo)
- É comprovante de serviço essencial reconhecível

REJEITE SE:
- Documento com mais de 3 meses (hoje: ${new Date().toLocaleDateString('pt-BR')})
- Endereço completamente ilegível
- Não é comprovante aceito (extrato bancário, declarações)

FEEDBACK ESPECÍFICO se inválido:
- "Comprovante com data de MM/AAAA - mais de 3 meses"
- "Endereço parcialmente cortado - falta CEP e cidade"
- "Reflexo intenso sobre o nome do titular"
- "Tipo de documento não aceito (extrato bancário)"`,
        
        crlv: `Você é um especialista em análise de documentos veiculares com processamento avançado. Analise este CRLV-e.

PROCESSAMENTO DE IMAGEM:
- Corrija rotação se necessário
- Leia através de reflexos leves

DADOS A EXTRAIR (prioridade):
- Placa (ESSENCIAL - ABC-1234 ou ABC1D23)
- Nome do proprietário (ESSENCIAL)
- Marca/Modelo (IMPORTANTE)
- Ano de fabricação (IMPORTANTE)
- Renavam (SECUNDÁRIO)
- Cor (SECUNDÁRIO)

VALIDAÇÃO FLEXÍVEL - VÁLIDO SE:
- Placa e nome do proprietário estão legíveis
- É documento de veículo brasileiro reconhecível
- Marca/modelo podem ser identificados

REJEITE SE:
- Restrições ATIVAS (roubo, furto, alienação fiduciária)
- Placa completamente ilegível
- Nome do proprietário impossível de ler
- Documento claramente adulterado

FEEDBACK ESPECÍFICO se inválido:
- "Restrição de alienação fiduciária detectada"
- "Placa ilegível devido a reflexo"
- "Parte do documento cortada - falta nome do proprietário"
- "CRLV vencido - necessário renovação"`,
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompts[docType],
        file_urls: [fileUrl],
        add_context_from_internet: false,
        response_json_schema: {
          type: 'object',
          properties: {
            valid: { 
              type: 'boolean',
              description: 'true se o documento passou em TODAS as verificações, false caso contrário'
            },
            extracted_data: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                cpf: { type: 'string' },
                document_number: { type: 'string' },
                birth_date: { type: 'string' },
                expiry_date: { type: 'string' },
                category: { type: 'string' },
                address: { type: 'string' },
                emission_date: { type: 'string' },
                plate: { type: 'string' },
                model: { type: 'string' },
                year: { type: 'string' },
                color: { type: 'string' },
                renavam: { type: 'string' }
              }
            },
            issues: {
              type: 'array',
              items: { type: 'string' },
              description: 'Lista de problemas encontrados (se houver)'
            },
            confidence: { 
              type: 'number',
              description: 'Nível de confiança na análise de 0.0 a 1.0'
            },
            readable: {
              type: 'boolean',
              description: 'true se o documento está minimamente legível'
            },
            specific_issue: {
              type: 'string',
              description: 'Descrição ESPECÍFICA do problema se valid=false (ex: "Reflexo sobre campo CPF", "Documento rotacionado 90°")'
            },
            rotation_detected: {
              type: 'boolean',
              description: 'true se o documento está rotacionado mas pode ser lido'
            },
            has_reflections: {
              type: 'boolean',
              description: 'true se há reflexos mas não impedem leitura essencial'
            }
          },
          required: ['valid', 'extracted_data', 'confidence', 'readable', 'specific_issue']
        }
      });

      // Validações flexíveis
      if (!response.readable && response.confidence < 0.4) {
        return {
          valid: false,
          error: 'Documento completamente ilegível.',
          specific_issue: response.specific_issue || 'Foto muito escura ou desfocada. Tente novamente com melhor iluminação.',
          feedback: response.has_reflections ? 'Reflexos detectados' : response.rotation_detected ? 'Documento rotacionado' : 'Qualidade insuficiente'
        };
      }

      // Se rotacionado mas legível, aceitar
      if (response.rotation_detected && response.confidence >= 0.5) {
        toast.info('ℹ️ Documento rotacionado detectado, mas dados foram extraídos com sucesso', { duration: 3000 });
      }

      // Se tem reflexos mas essencial está legível, aceitar
      if (response.has_reflections && response.confidence >= 0.5) {
        toast.info('ℹ️ Reflexos detectados, mas campos essenciais estão legíveis', { duration: 3000 });
      }

      if (!response.valid) {
        return {
          valid: false,
          error: response.specific_issue || 'Documento não passou nas verificações.',
          specific_issue: response.specific_issue,
          feedback: response.issues?.join(', ')
        };
      }

      // Confiança mínima reduzida de 0.75 para 0.5
      if (response.confidence < 0.5) {
        return {
          valid: false,
          error: 'Qualidade insuficiente para extração automática.',
          specific_issue: response.specific_issue || 'Tente tirar foto com melhor foco e iluminação',
          feedback: 'Confiança baixa na leitura'
        };
      }

      return {
        valid: true,
        extracted_data: response.extracted_data,
        confidence: response.confidence
      };
    } catch (error) {
      console.error('Erro na validação IA:', error);
      return {
        valid: false,
        error: 'Erro ao processar documento. Tente novamente ou entre em contato com o suporte.'
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
    if (doc.error) return 'error';
    if (doc.uploaded && !doc.verified) return 'ready_to_send';
    return 'not_uploaded';
  };

  const getStatusIcon = (key) => {
    const status = getDocumentStatus(key);
    switch (status) {
      case 'uploading':
        return <Clock className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'ready_to_send':
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
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
      case 'ready_to_send':
        return 'Pronto para enviar';
      case 'error':
        return 'Erro na verificação';
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
    <>
      {/* Câmera Inteligente */}
      {showCamera && (
        <DocumentCamera
          docType={showCamera}
          onCapture={(imageData) => handleCameraResult(showCamera, imageData)}
          onClose={() => setShowCamera(null)}
        />
      )}

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
                    {documents[docType.key].error && getDocumentStatus(docType.key) === 'error' && (
                      <p className="text-xs text-red-400 mt-1">{documents[docType.key].error}</p>
                    )}
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
                      {!documents[docType.key].verified && !documents[docType.key].uploaded && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCameraCapture(docType.key)}
                            disabled={uploading === docType.key}
                            className={`flex-1 btn-gradient py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-white font-medium transition-all hover:scale-105 ${uploading === docType.key ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Camera className="w-4 h-4" />
                            Tirar Foto
                          </button>

                          <label className="flex-1 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*,application/pdf,.doc,.docx"
                              capture={false}
                              className="hidden"
                              onChange={(e) => handleFileSelect(docType.key, e.target.files[0])}
                              disabled={uploading === docType.key}
                            />
                            <div className={`btn-gradient w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-white font-medium transition-all hover:scale-105 ${uploading === docType.key ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                              <Upload className="w-4 h-4" />
                              Carregar Documento
                            </div>
                          </label>
                        </div>
                      )}

                      {/* Botão de envio após seleção */}
                      {documents[docType.key].uploaded && !documents[docType.key].verified && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <Button
                            onClick={() => handleSubmitDocument(docType.key)}
                            disabled={uploading === docType.key}
                            className="w-full btn-gradient py-6 text-lg font-semibold"
                          >
                            {uploading === docType.key ? (
                              <>
                                <Clock className="w-5 h-5 mr-2 animate-spin" />
                                Analisando com IA...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Enviar para Análise {verificationAttempts[docType.key] > 0 ? `(Tentativa ${verificationAttempts[docType.key] + 1})` : ''}
                              </>
                            )}
                          </Button>

                          {/* Botão de análise manual após 2 tentativas */}
                          {verificationAttempts[docType.key] >= 2 && (
                            <Button
                              onClick={() => handleRequestManualReview(docType.key)}
                              disabled={uploading === docType.key}
                              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-6 text-lg font-semibold"
                            >
                              {uploading === docType.key ? (
                                <>
                                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-5 h-5 mr-2" />
                                  Solicitar Análise Manual
                                </>
                              )}
                            </Button>
                          )}

                          <Button
                            onClick={() => handleCancelUpload(docType.key)}
                            disabled={uploading === docType.key}
                            variant="outline"
                            className="w-full border-[#F22998]/30 text-[#F22998]"
                          >
                            Escolher Outro Arquivo
                          </Button>

                          {/* Aviso de análise manual */}
                          {verificationAttempts[docType.key] >= 2 && (
                            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                              <p className="text-xs text-yellow-400">
                                💡 A verificação automática falhou {verificationAttempts[docType.key]} vezes. Você pode solicitar análise manual para prosseguir.
                              </p>
                            </div>
                          )}
                        </motion.div>
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
      </>
      );
      }