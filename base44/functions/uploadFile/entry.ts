import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { createClient } from 'npm:@supabase/supabase-js@2.49.8';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_PREFIXES = ['image/', 'audio/', 'application/pdf'];

function sanitizeFileName(name: string): string {
  const base = (name || 'upload').split(/[/\\]/).pop() || 'upload';
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  return cleaned || 'upload';
}

function decodeBase64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function getSupabaseConfig() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim();
  const serviceKey = (
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    ?? Deno.env.get('SUPABASE_SECRET_KEY')
  )?.trim();
  const bucket = Deno.env.get('SUPABASE_STORAGE_BUCKET')?.trim();
  return { supabaseUrl, serviceKey, bucket };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { supabaseUrl, serviceKey, bucket } = getSupabaseConfig();

    if (!supabaseUrl || !serviceKey || !bucket) {
      console.error('[uploadFile] Supabase não configurado', {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceKey,
        hasBucket: !!bucket,
      });
      return Response.json({ error: 'Storage não configurado no servidor' }, { status: 500 });
    }

    const { fileBase64, fileName, mimeType, folder = 'misc' } = await req.json();

    if (!fileBase64 || typeof fileBase64 !== 'string') {
      return Response.json({ error: 'fileBase64 é obrigatório' }, { status: 400 });
    }

    const normalizedBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
    let binary: Uint8Array;

    try {
      binary = decodeBase64ToBytes(normalizedBase64);
    } catch {
      return Response.json({ error: 'Arquivo inválido (base64 corrompido)' }, { status: 400 });
    }

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

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, binary, { contentType: type, upsert: true });

    if (uploadError) {
      console.error('[uploadFile] Supabase upload erro:', uploadError.message);
      return Response.json(
        { error: uploadError.message || 'Falha ao enviar arquivo para o storage' },
        { status: 502 }
      );
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    const file_url = publicData.publicUrl;

    return Response.json({ file_url });
  } catch (error) {
    console.error('[uploadFile] Erro:', error?.message || error);
    return Response.json({ error: error?.message || 'Erro interno' }, { status: 500 });
  }
});
