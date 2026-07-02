import { unwrapInvoke } from '@/utils/invokeResponse';

/** Valor da corrida para exibição de ganhos (prioriza preço confirmado pela motorista). */
export function getRideEarningsAmount(ride) {
  if (!ride) return 0;
  return Number(ride.driver_confirmed_price ?? ride.agreed_price ?? ride.estimated_price ?? 0);
}

export async function fetchDriverCompletedRides(base44) {
  try {
    const res = await base44.functions.invoke('getDriverInfo', { mode: 'completed_rides' });
    const data = unwrapInvoke(res);
    if (data?.success) {
      return {
        rides: data.rides || [],
        today: data.today || { rides: 0, earnings: 0 },
      };
    }
  } catch (e) {
    console.warn('[fetchDriverCompletedRides]', e);
  }
  return { rides: [], today: { rides: 0, earnings: 0 } };
}
