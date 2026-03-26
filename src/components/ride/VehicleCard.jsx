import React, { lazy, Suspense } from 'react';
import { Car } from 'lucide-react';
import { Card } from '@/components/ui/card';

const Car3DViewer = lazy(() => import('./Car3DViewer'));

const CATEGORY_LABELS = { standard: 'Padrão', premium: 'Premium', suv: 'SUV' };

export default function VehicleCard({ vehicle }) {
  if (!vehicle) {
    return (
      <Card className="p-4 rounded-2xl bg-[#F2F2F2]/5 border-[#F22998]/10 flex items-center gap-3">
        <Car className="w-8 h-8 text-[#F22998]/30 flex-shrink-0" />
        <p className="text-sm text-[#F2F2F2]/40 italic">Veículo não cadastrado</p>
      </Card>
    );
  }

  const subtitle = [vehicle.year, vehicle.color].filter(Boolean).join(' · ');
  const categoryLabel = CATEGORY_LABELS[vehicle.category] || vehicle.category || '';

  return (
    <Card className="p-4 rounded-2xl bg-[#F2F2F2]/5 border-[#F22998]/10">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <p className="text-base font-bold text-[#F2F2F2] leading-tight">
            {[vehicle.brand, vehicle.model].filter(Boolean).join(' ') || 'Veículo'}
          </p>
          {subtitle && (
            <p className="text-xs text-[#F2F2F2]/55">{subtitle}</p>
          )}
          {vehicle.plate && (
            <div className="mt-1 inline-flex">
              <span className="px-3 py-0.5 rounded-lg border-2 border-[#F22998]/50 bg-[#F22998]/10 font-mono font-bold text-sm text-[#F22998] tracking-widest">
                {vehicle.plate}
              </span>
            </div>
          )}
          {categoryLabel && (
            <span className="mt-1 text-[11px] text-[#F2F2F2]/40 uppercase tracking-wider">
              {categoryLabel}
            </span>
          )}
        </div>

        {/* 3D Viewer */}
        <div className="w-full sm:w-[200px] h-[150px] flex-shrink-0">
          <Suspense fallback={
            <div className="w-full h-full bg-[#1a1a1a] rounded-xl animate-pulse" />
          }>
            <Car3DViewer color={vehicle.color} />
          </Suspense>
        </div>
      </div>
    </Card>
  );
}