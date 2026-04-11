/**
 * Utilitários de data/hora no fuso de Brasília (America/Sao_Paulo)
 */

const BRASILIA_TZ = 'America/Sao_Paulo';

/** "11 de abril, 13:41" */
export function toBrasiliaDate(isoString) {
  if (!isoString) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRASILIA_TZ,
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(isoString));
}

/** "11 de abr" */
export function toBrasiliaDateShort(isoString) {
  if (!isoString) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRASILIA_TZ,
    day: '2-digit',
    month: 'short'
  }).format(new Date(isoString));
}

/** "13:41" */
export function toBrasiliaTime(isoString) {
  if (!isoString) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRASILIA_TZ,
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(isoString));
}

/** "11/04/2026 13:41" — para CSV exports etc */
export function toBrasiliaDateFull(isoString) {
  if (!isoString) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRASILIA_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(isoString));
}

/** "11 de abril de 2026" */
export function toBrasiliaDateLong(isoString) {
  if (!isoString) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRASILIA_TZ,
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(isoString));
}