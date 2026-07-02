/** Normaliza retorno de base44.functions.invoke (com ou sem wrapper .data). */
export function unwrapInvoke(res) {
  if (res == null) return null;
  if (typeof res === 'object' && 'data' in res && res.data != null) return res.data;
  return res;
}
