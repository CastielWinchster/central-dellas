/** Extrai mensagem legível de erros do base44.functions.invoke (axios ou Base44Error). */
export function formatInvokeError(err, functionName = 'função') {
  const status = err?.status ?? err?.response?.status;
  const data = err?.data ?? err?.response?.data;
  const apiMsg =
    (typeof data === 'string' ? data : null) ||
    data?.message ||
    data?.detail ||
    data?.error;

  if (status === 404) {
    if (apiMsg?.includes('App not found')) {
      return 'App não encontrado. Feche e abra o app de novo (ou limpe dados do site).';
    }
    if (apiMsg?.includes('not found or not deployed')) {
      return `Função ${functionName} não encontrada no servidor. Admin: npx base44 functions deploy ${functionName}`;
    }
    return apiMsg || `Erro 404 ao chamar ${functionName}`;
  }

  if (status === 401) {
    return 'Sessão expirada. Faça login novamente.';
  }

  if (status === 429) {
    return 'Muitas requisições. Aguarde alguns segundos e tente novamente.';
  }

  return apiMsg || err?.message || 'Erro de conexão';
}
