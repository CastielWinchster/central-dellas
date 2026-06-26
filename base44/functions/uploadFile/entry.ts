import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_PREFIXES = ['image/', 'audio/', 'application/pdf'];

function sanitizeFileName(name: string): string {
  const base = (name || 'upload').split(/[/\\]/).pop() || 'upload';
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  return cleaned || 'upload';
}

function buildPublicUrl(supabaseUrl: string, bucket: string, path: string): string {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const bucket = Deno.env.get('SUPABASE_STORAGE_BUCKET');

    if (!supabaseUrl || !serviceKey || !bucket) {
      console.error('[uploadFile] Supabase não configurado');
      return Response.json({ error: 'Storage não configurado no servidor' }, { status: 500 });
    }

    const { fileBase64, fileName, mimeType, folder = 'misc' } = await req.json();

    if (!fileBase64 || typeof fileBase64 !== 'string') {
      return Response.json({ error: 'fileBase64 é obrigatório' }, { status: 400 });
    }

    const normalizedBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const binary = Uint8Array.from(atob(normalizedBase64), (c) => c.charCodeAt(0));

    if (binary.byteLength === 0) {
      return Response.json({ error: 'Arquivo vazio' }, { status: 400 });
    }

    if (binary.byteLength > MAX_BYTES) {
      return Response.json({ error: 'Arquivo muito grande (máx. 10MB)' }, { status: 400 });
    }

    const type = mimeType || 'application/octet-stream';
    if (!ALLOWED_PREFIXES.some((prefix) => type.startsWith(prefix))) {
      return Response.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 });
    }

    const safeFolder = String(folder).replace(/[^a-zA-Z0-9/_-]/g, '').slice(0, 40) || 'misc';
    const safeName = sanitizeFileName(fileName);
    const storagePath = `${safeFolder}/${user.id}/${Date.now()}-${safeName}`;

    const uploadRes = await fetch(
      `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${bucket}/${storagePath}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': type,
          'x-upsert': 'true',
        },
        body: binary,
      }
    );

    if (!uploadRes.ok) {
      const detail = await uploadRes.text();
      console.error('[uploadFile] Supabase erro:', uploadRes.status, detail);
      return Response.json({ error: 'Falha ao enviar arquivo para o storage' }, { status: 502 });
    }

    const file_url = buildPublicUrl(supabaseUrl, bucket, storagePath);
    return Response.json({ file_url });
  } catch (error) {
    console.error('[uploadFile] Erro:', error?.message || error);
    return Response.json({ error: error?.message || 'Erro interno' }, { status: 500 });
  }
});
