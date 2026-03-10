import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, AlertCircle, Send, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import CNHCard from '../components/driver/docs/CNHCard';
import RGCard from '../components/driver/docs/RGCard';
import CRLVCard from '../components/driver/docs/CRLVCard';
import SeguroCard from '../components/driver/docs/SeguroCard';
import { uploadDocFile, saveDriverDocuments, getDriverDocuments } from '../components/firebase/driverDocService';

export default function DriverDocuments() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [declared, setDeclared] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingFields, setUploadingFields] = useState({});
  const [docStatus, setDocStatus] = useState('pending'); // overall Firestore status

  // Form state per section
  const [cnh, setCnh] = useState({});
  const [rg, setRg] = useState({});
  const [vehicle, setVehicle] = useState({});
  const [insurance, setInsurance] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const u = await base44.auth.me();
        setUser(u);
        const existing = await getDriverDocuments(u.id);
        if (existing) {
          if (existing.cnh) setCnh(existing.cnh);
          if (existing.rg) setRg(existing.rg);
          if (existing.vehicle) setVehicle(existing.vehicle);
          if (existing.insurance) setInsurance(existing.insurance);
          if (existing.status) setDocStatus(existing.status);
          if (['under_review', 'approved', 'rejected'].includes(existing.status)) setSubmitted(true);
        }
      } catch (e) {
        setLoadError('Não foi possível carregar seus documentos. Verifique sua conexão e tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Upload a single file and return its URL
  const handleUpload = async (path, file, section, field, urlField) => {
    if (!file || typeof file === 'string') return null;
    setUploadingFields(prev => ({ ...prev, [path]: true }));
    try {
      const url = await uploadDocFile(user.id, path, file);
      // Update the section state with the URL (replace *File with *Photo)
      if (section === 'cnh') setCnh(prev => ({ ...prev, [field]: undefined, [urlField]: url }));
      if (section === 'rg') setRg(prev => ({ ...prev, [field]: undefined, [urlField]: url }));
      if (section === 'vehicle') setVehicle(prev => ({ ...prev, [field]: undefined, [urlField]: url }));
      if (section === 'insurance') setInsurance(prev => ({ ...prev, [field]: undefined, [urlField]: url }));
      return url;
    } finally {
      setUploadingFields(prev => ({ ...prev, [path]: false }));
    }
  };

  const handleSubmit = async () => {
    if (!declared || !user) return;
    setSubmitting(true);
    try {
      // Upload all pending files
      const [cnhFront, cnhBack, rgFront, rgBack, crlvPhoto, insurancePhoto] = await Promise.all([
        cnh.frontFile ? handleUpload('cnh/front', cnh.frontFile, 'cnh', 'frontFile', 'frontPhoto') : Promise.resolve(cnh.frontPhoto),
        cnh.backFile ? handleUpload('cnh/back', cnh.backFile, 'cnh', 'backFile', 'backPhoto') : Promise.resolve(cnh.backPhoto),
        rg.frontFile ? handleUpload('rg/front', rg.frontFile, 'rg', 'frontFile', 'frontPhoto') : Promise.resolve(rg.frontPhoto),
        rg.backFile ? handleUpload('rg/back', rg.backFile, 'rg', 'backFile', 'backPhoto') : Promise.resolve(rg.backPhoto),
        vehicle.photoFile ? handleUpload('vehicle/crlv', vehicle.photoFile, 'vehicle', 'photoFile', 'photo') : Promise.resolve(vehicle.photo),
        insurance.photoFile ? handleUpload('vehicle/insurance', insurance.photoFile, 'insurance', 'photoFile', 'photo') : Promise.resolve(insurance.photo),
      ]);

      const record = {
        status: 'under_review',
        submittedAt: new Date().toISOString(),
        responsibilityTerm: true,
        cnh: { ...cnh, frontFile: undefined, backFile: undefined, frontPhoto: cnhFront, backPhoto: cnhBack },
        rg: { ...rg, frontFile: undefined, backFile: undefined, frontPhoto: rgFront, backPhoto: rgBack },
        vehicle: { ...vehicle, photoFile: undefined, photo: crlvPhoto },
        insurance: { ...insurance, photoFile: undefined, photo: insurancePhoto },
      };

      await saveDriverDocuments(user.id, record);
      setSubmitted(true);
      toast.success('Documentos enviados para análise!');
    } catch (e) {
      toast.error('Erro ao enviar documentos. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Map Firestore status → badge status
  const cardStatus = (s) => {
    if (s === 'under_review') return 'reviewing';
    if (s === 'approved') return 'approved';
    if (s === 'rejected') return 'rejected';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#F22998] animate-spin mx-auto" />
          <p className="text-[#F2F2F2]/60 text-sm">Carregando seus documentos...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-[#F2F2F2] font-semibold">Erro ao carregar</p>
          <p className="text-[#F2F2F2]/50 text-sm">{loadError}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-2"
            style={{ background: 'linear-gradient(135deg, #BF3B79 0%, #F22998 100%)' }}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('DriverOptions')}>
            <Button variant="ghost" size="icon" className="text-[#F2F2F2] hover:bg-[#F22998]/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#F2F2F2]">Documentos do Motorista</h1>
            <p className="text-[#F2F2F2]/50 text-sm">CNH, RG, CRLV e Seguro</p>
          </div>
        </div>

        {/* Status Banner */}
        {docStatus === 'approved' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-5 rounded-2xl bg-green-500/10 border border-green-500/30 flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-400 mb-1">Documentos aprovados! 🎉</p>
              <p className="text-sm text-[#F2F2F2]/70">Seu cadastro foi aprovado. Você já pode receber corridas.</p>
            </div>
          </motion.div>
        )}
        {docStatus === 'rejected' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex gap-3 items-start">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-400 mb-1">Documentos rejeitados</p>
              <p className="text-sm text-[#F2F2F2]/70">Alguns documentos foram recusados. Revise e reenvie.</p>
            </div>
          </motion.div>
        )}
        {docStatus === 'under_review' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex gap-3 items-start">
            <Loader2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-400 mb-1">Em análise</p>
              <p className="text-sm text-[#F2F2F2]/70">Seus documentos estão sendo analisados. Nossa equipe entrará em contato em breve.</p>
            </div>
          </motion.div>
        )}
        {docStatus === 'pending' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-[#F22998]/10 border border-[#F22998]/30 flex gap-3">
            <AlertCircle className="w-5 h-5 text-[#F22998] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#F2F2F2]/80 leading-relaxed">
              Seus documentos serão analisados pela nossa equipe para validar o seu cadastro como motorista.
              Após a aprovação, você poderá começar a receber corridas pela Central Dellas.
            </p>
          </motion.div>
        )}

        {/* Document Cards */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <CNHCard
              status={cardStatus(docStatus)}
              data={cnh}
              onChange={setCnh}
              uploadingFields={uploadingFields}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <RGCard
              status={cardStatus(docStatus)}
              data={rg}
              onChange={setRg}
              uploadingFields={uploadingFields}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <CRLVCard
              status={cardStatus(docStatus)}
              data={vehicle}
              onChange={setVehicle}
              uploadingFields={uploadingFields}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <SeguroCard
              status={cardStatus(docStatus)}
              data={insurance}
              onChange={setInsurance}
              uploadingFields={uploadingFields}
            />
          </motion.div>
        </div>

        {/* Declaração */}
        {!submitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-6 p-5 rounded-2xl bg-[#1A1A1A] border border-[#BF3B79]/30 space-y-4"
          >
            <h3 className="font-semibold text-[#F2F2F2]">Declaração</h3>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                onClick={() => setDeclared(d => !d)}
                className={`mt-0.5 w-5 h-5 min-w-[20px] rounded border-2 flex items-center justify-center transition-colors ${
                  declared
                    ? 'bg-[#F22998] border-[#F22998]'
                    : 'border-[#F22998]/40 group-hover:border-[#F22998]/70'
                }`}
              >
                {declared && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-[#F2F2F2]/70 leading-relaxed" onClick={() => setDeclared(d => !d)}>
                Declaro que os documentos enviados são verdadeiros, estão atualizados e correspondem ao veículo
                e à condutora cadastrada, me responsabilizando pelas informações prestadas.
              </span>
            </label>

            <Button
              disabled={!declared || submitting}
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all"
              style={{
                background: declared && !submitting
                  ? 'linear-gradient(135deg, #BF3B79 0%, #F22998 100%)'
                  : undefined
              }}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Enviar para análise</>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}