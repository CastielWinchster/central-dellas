import React from 'react';
import { motion } from 'framer-motion';
import { 
  X, Download, Share2, MapPin, Calendar, 
  Clock, CreditCard, Star, Car, Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReceiptDialog({ ride, isOpen, onClose }) {
  if (!ride) return null;

  const handleDownloadPDF = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Recibo - Central Dellas</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              padding: 40px;
              background: #fff;
              color: #0D0D0D;
            }
            .receipt {
              max-width: 600px;
              margin: 0 auto;
              border: 2px solid #F22998;
              border-radius: 20px;
              padding: 40px;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #F2F2F2;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              background: linear-gradient(135deg, #BF3B79 0%, #F22998 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              margin-bottom: 10px;
            }
            .subtitle {
              color: #666;
              font-size: 14px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 10px;
              font-weight: 600;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #F2F2F2;
            }
            .info-label {
              color: #666;
            }
            .info-value {
              font-weight: 600;
              color: #0D0D0D;
            }
            .location {
              padding: 15px;
              background: #F2F2F2;
              border-radius: 10px;
              margin-bottom: 10px;
            }
            .location-type {
              font-size: 12px;
              color: #666;
              margin-bottom: 5px;
            }
            .location-address {
              font-weight: 500;
              color: #0D0D0D;
            }
            .driver-info {
              display: flex;
              align-items: center;
              gap: 15px;
              padding: 15px;
              background: #F2F2F2;
              border-radius: 10px;
            }
            .driver-name {
              font-weight: 600;
              margin-bottom: 5px;
            }
            .driver-rating {
              color: #666;
              font-size: 14px;
            }
            .total {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 3px solid #F22998;
              text-align: right;
            }
            .total-label {
              font-size: 18px;
              color: #666;
              margin-bottom: 5px;
            }
            .total-value {
              font-size: 36px;
              font-weight: bold;
              color: #F22998;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #F2F2F2;
              color: #666;
              font-size: 12px;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 16px;
              background: #dcfce7;
              color: #16a34a;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-top: 10px;
            }
            @media print {
              body {
                padding: 0;
              }
              .receipt {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="logo">Central Dellas</div>
              <div class="subtitle">Central de Transportes</div>
              <div class="status-badge">✓ Corrida Concluída</div>
            </div>

            <div class="section">
              <div class="section-title">Detalhes da Viagem</div>
              <div class="info-row">
                <span class="info-label">ID da Corrida</span>
                <span class="info-value">#${ride.id.slice(0, 8)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Data</span>
                <span class="info-value">${format(new Date(ride.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Horário</span>
                <span class="info-value">${format(new Date(ride.created_date), 'HH:mm', { locale: ptBR })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Duração</span>
                <span class="info-value">${ride.estimated_duration || 15} minutos</span>
              </div>
              <div class="info-row">
                <span class="info-label">Distância</span>
                <span class="info-value">${ride.estimated_distance || 5} km</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Trajeto</div>
              <div class="location">
                <div class="location-type">🟢 Origem</div>
                <div class="location-address">${ride.pickup_address}</div>
              </div>
              <div class="location">
                <div class="location-type">🔴 Destino</div>
                <div class="location-address">${ride.destination_address}</div>
              </div>
            </div>

            ${ride.driver ? `
              <div class="section">
                <div class="section-title">Motorista</div>
                <div class="driver-info">
                  <div>
                    <div class="driver-name">${ride.driver.name}</div>
                    <div class="driver-rating">⭐ ${ride.driver.rating}</div>
                  </div>
                </div>
              </div>
            ` : ''}

            <div class="section">
              <div class="section-title">Pagamento</div>
              <div class="info-row">
                <span class="info-label">Método</span>
                <span class="info-value">${ride.payment_method === 'pix' ? 'Pix' : ride.payment_method === 'credit_card' ? 'Cartão de Crédito' : ride.payment_method === 'debit_card' ? 'Cartão de Débito' : 'Carteira Digital'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tarifa Base</span>
                <span class="info-value">R$ ${(ride.final_price * 0.85).toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Taxa de Serviço</span>
                <span class="info-value">R$ ${(ride.final_price * 0.15).toFixed(2)}</span>
              </div>
            </div>

            <div class="total">
              <div class="total-label">Valor Total</div>
              <div class="total-value">R$ ${ride.final_price.toFixed(2)}</div>
            </div>

            <div class="footer">
              <p>Central Dellas - Mobilidade Urbana Segura</p>
              <p>Feito por mulheres, para mulheres 💕</p>
              <p style="margin-top: 10px;">contato@centraldellas.com.br | (16) 99446-5137</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleShare = async () => {
    const shareText = `Recibo Central Dellas\n\nDe: ${ride.pickup_address}\nPara: ${ride.destination_address}\nValor: R$ ${ride.final_price.toFixed(2)}\nData: ${format(new Date(ride.created_date), "dd/MM/yyyy 'às' HH:mm")}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Recibo - Central Dellas',
          text: shareText
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Informações copiadas para a área de transferência!');
    }
  };

  const paymentMethodLabels = {
    pix: 'Pix',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    wallet: 'Carteira Digital'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0D0D0D] border-[#F22998]/20 text-[#F2F2F2] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#BF3B79] to-[#F22998] bg-clip-text text-transparent">
            Recibo da Corrida
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 py-4"
        >
          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Corrida Concluída</span>
            </div>
          </div>

          {/* Receipt ID */}
          <div className="text-center">
            <p className="text-[#F2F2F2]/50 text-sm mb-1">ID da Corrida</p>
            <p className="text-[#F22998] font-mono font-semibold">#{ride.id.slice(0, 8).toUpperCase()}</p>
          </div>

          {/* Route */}
          <div className="p-4 rounded-2xl bg-[#F2F2F2]/5 border border-[#F22998]/10">
            <h3 className="text-sm font-semibold text-[#F22998] mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Trajeto
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#F2F2F2]/50 mb-1">Origem</p>
                  <p className="text-[#F2F2F2]">{ride.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-[#F22998] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#F2F2F2]/50 mb-1">Destino</p>
                  <p className="text-[#F2F2F2]">{ride.destination_address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F2F2F2]/5">
              <div className="flex items-center gap-2 text-[#F22998] mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Data</span>
              </div>
              <p className="text-[#F2F2F2] font-semibold">
                {format(new Date(ride.created_date), "dd 'de' MMM", { locale: ptBR })}
              </p>
              <p className="text-[#F2F2F2]/50 text-sm">
                {format(new Date(ride.created_date), 'HH:mm', { locale: ptBR })}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F2F2F2]/5">
              <div className="flex items-center gap-2 text-[#F22998] mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Duração</span>
              </div>
              <p className="text-[#F2F2F2] font-semibold">{ride.estimated_duration || 15} min</p>
              <p className="text-[#F2F2F2]/50 text-sm">{ride.estimated_distance || 5} km</p>
            </div>
          </div>

          {/* Driver Info */}
          {ride.driver && (
            <div className="p-4 rounded-2xl bg-[#F2F2F2]/5 border border-[#F22998]/10">
              <h3 className="text-sm font-semibold text-[#F22998] mb-3 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Motorista
              </h3>
              <div className="flex items-center gap-3">
                <img 
                  src={ride.driver.photo}
                  alt={ride.driver.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#F22998]"
                />
                <div>
                  <p className="font-semibold text-[#F2F2F2]">{ride.driver.name}</p>
                  <div className="flex items-center gap-1 text-[#F2F2F2]/60 text-sm">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    {ride.driver.rating}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="p-4 rounded-2xl bg-[#F2F2F2]/5 border border-[#F22998]/10">
            <h3 className="text-sm font-semibold text-[#F22998] mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pagamento
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#F2F2F2]/60">Método</span>
                <span className="text-[#F2F2F2] font-medium">
                  {paymentMethodLabels[ride.payment_method] || 'Pix'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#F2F2F2]/60">Tarifa Base</span>
                <span className="text-[#F2F2F2]">R$ {(ride.final_price * 0.85).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#F2F2F2]/60">Taxa de Serviço</span>
                <span className="text-[#F2F2F2]">R$ {(ride.final_price * 0.15).toFixed(2)}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-[#F22998]/20 flex justify-between">
                <span className="font-semibold text-[#F2F2F2]">Total</span>
                <span className="text-2xl font-bold text-[#F22998]">R$ {ride.final_price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-[#F22998]/30 text-[#F22998] hover:bg-[#F22998]/10"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
            <Button
              onClick={handleDownloadPDF}
              className="btn-gradient"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-[#F22998]/10">
            <p className="text-xs text-[#F2F2F2]/50">
              Central Dellas - Mobilidade Urbana Segura 💕
            </p>
            <p className="text-xs text-[#F2F2F2]/40 mt-1">
              Feito por mulheres, para mulheres
            </p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}