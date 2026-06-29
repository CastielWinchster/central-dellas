/**
 * Utilitários de data/hora no fuso de Brasília (America/Sao_Paulo).
 * base44 envia ISO em UTC sem sufixo "Z" — parseAppDate trata como UTC.
 */

const BRASILIA_TZ = 'America/Sao_Paulo';

/** Converte valor da API para Date (UTC quando ISO sem timezone) */
export function parseAppDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return value;
  const s = String(value).trim();
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(s)) return new Date(s);
  if (/^\d{4}-\d{2}-\d{2}T\d/.test(s)) return new Date(`${s}Z`);
  return new Date(s);
}

function formatBrasilia(date, options) {
  const d = date instanceof Date ? date : parseAppDate(date);
  if (!d || Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: BRASILIA_TZ, ...options }).format(d);
}

/** Horário atual em Brasília — mesmo padrão do mapa ao vivo admin */
export function nowBrasiliaTime({ seconds = false } = {}) {
  return formatBrasilia(new Date(), {
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
  });
}

/** "YYYY-MM-DD" no fuso de Brasília (filtros de data) */
export function toBrasiliaDateInput(value) {
  const d = value instanceof Date ? value : parseAppDate(value);
  if (!d || Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BRASILIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** Hoje em Brasília como YYYY-MM-DD */
export function todayBrasiliaDateInput() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BRASILIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts;
}

/** "11 de abril, 13:41" */
export function toBrasiliaDate(isoString) {
  return formatBrasilia(isoString, {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "11 de abr" */
export function toBrasiliaDateShort(isoString) {
  return formatBrasilia(isoString, {
    day: '2-digit',
    month: 'short',
  });
}

/** "13:41" */
export function toBrasiliaTime(isoString) {
  return formatBrasilia(isoString, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "29/06/2026, 13:27" */
export function toBrasiliaDateFull(isoString) {
  return formatBrasilia(isoString, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "29 de jun., 13:27" */
export function toBrasiliaDateMedium(isoString) {
  return formatBrasilia(isoString, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "29/06/2026" */
export function toBrasiliaDateOnly(isoString) {
  return formatBrasilia(isoString, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** "11 de abril de 2026" */
export function toBrasiliaDateLong(isoString) {
  return formatBrasilia(isoString, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/** "29 de jun" (date-fns style) */
export function toBrasiliaDayMonth(isoString) {
  const raw = formatBrasilia(isoString, { day: '2-digit', month: 'short' });
  return raw.replace('.', '');
}
