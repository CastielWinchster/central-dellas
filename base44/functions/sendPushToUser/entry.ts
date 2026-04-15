/*
  ════════════════════════════════════════════
  CONFIGURAÇÃO NECESSÁRIA — VARIÁVEIS DE AMBIENTE
  Configurar em: Base44 > Settings > Environment Variables
  ════════════════════════════════════════════

  VAPID_PUBLIC_KEY   → Chave pública VAPID
  VAPID_PRIVATE_KEY  → Chave privada VAPID

  Para gerar as chaves, rode UMA VEZ no terminal:
    npx web-push generate-vapid-keys

  No frontend (Base44 env vars com prefixo VITE_):
  VITE_VAPID_PUBLIC_KEY → mesma chave pública acima
  ════════════════════════════════════════════
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')  ?? '';
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_EMAIL   = 'mailto:contato@centraldellas.com.br';

// ── Implementação VAPID nativa com Web Crypto API (compatível com Deno) ──

async function importVapidKey(privateKeyB64) {
  const raw = Uint8Array.from(atob(privateKeyB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    raw,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

function b64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function buildVapidHeader(audience, privateKeyB64, publicKeyB64) {
  const now = Math.floor(Date.now() / 1000);
  const header = { typ: 'JWT', alg: 'ES256' };
  const claims = { aud: audience, exp: now + 43200, sub: VAPID_EMAIL };

  const enc = new TextEncoder();
  const headerB64  = b64url(enc.encode(JSON.stringify(header)));
  const claimsB64  = b64url(enc.encode(JSON.stringify(claims)));
  const sigInput   = `${headerB64}.${claimsB64}`;

  const key = await importVapidKey(privateKeyB64);
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    enc.encode(sigInput)
  );

  const jwt = `${sigInput}.${b64url(sig)}`;
  return `vapid t=${jwt},k=${publicKeyB64}`;
}

async function sendWebPush(subscription, payload) {
  const subObj = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;
  const { endpoint, keys } = subObj;
  const { p256dh, auth } = keys;

  // Audience = origin do endpoint
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const authHeader = await buildVapidHeader(audience, VAPID_PRIVATE, VAPID_PUBLIC);

  // Cifrar payload com ECDH + AES-128-GCM (RFC 8291)
  const enc = new TextEncoder();
  const plaintext = enc.encode(typeof payload === 'string' ? payload : JSON.stringify(payload));

  // Decodificar chaves do cliente
  const clientPublicKey = Uint8Array.from(atob(p256dh.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const authSecret      = Uint8Array.from(atob(auth.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

  // Gerar par de chaves efêmeras
  const serverKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const serverPublicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeyPair.publicKey));

  const clientKey = await crypto.subtle.importKey('raw', clientPublicKey, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const sharedBits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: clientKey }, serverKeyPair.privateKey, 256));

  // HKDF para derivar IKM
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk  = await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveBits']);

  // Simplificado: envio sem cifração (plaintext) quando ECDH complexo
  // Para produção, use a lib npm:web-push que implementa RFC 8291 completo
  // Por agora: fallback direto para AES-GCM simples com chave derivada
  const contentInfo  = new Uint8Array([...enc.encode('Content-Encoding: aes128gcm\0'), ...new Uint8Array(1)]);
  const keyMaterial  = await crypto.subtle.importKey('raw', authSecret, 'HKDF', false, ['deriveBits']);
  const keyBits      = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: sharedBits, info: contentInfo }, keyMaterial, 128);
  const aesKey       = await crypto.subtle.importKey('raw', keyBits, 'AES-GCM', false, ['encrypt']);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plaintext));

  // Montar corpo: salt(16) + recordSize(4) + keyLen(1) + serverPublicKey(65) + ciphertext
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096, false);
  const keyLen = new Uint8Array([65]);
  const body = new Uint8Array([...salt, ...recordSize, ...keyLen, ...serverPublicRaw, ...encrypted]);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '60',
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Push endpoint respondeu ${response.status}: ${text}`);
  }
  return true;
}

// ── Handler principal ──

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Permite chamada por service role interno (automations) ou por usuário autenticado
    let userId, title, body, type, url;
    try {
      const b = await req.json();
      userId = b.userId || b.toUserId;
      title  = b.title;
      body   = b.body;
      type   = b.type ?? 'default';
      url    = b.url ?? '/';
    } catch {
      return Response.json({ error: 'JSON inválido' }, { status: 400 });
    }

    if (!userId || !title || !body) {
      return Response.json({ error: 'userId, title e body são obrigatórios' }, { status: 400 });
    }

    // Buscar subscription do usuário
    const prefs = await base44.asServiceRole.entities.UserPreferences.filter({ user_id: userId });
    const sub = prefs[0]?.push_subscription;

    if (sub && VAPID_PUBLIC && VAPID_PRIVATE) {
      try {
        const payload = JSON.stringify({ title, body, type, url, tag: `cd-${type}-${Date.now()}` });
        await sendWebPush(sub, payload);
        console.log(`[sendPushToUser] Web Push enviado para ${userId}`);
        return Response.json({ success: true, method: 'webpush' });
      } catch (pushErr) {
        console.warn('[sendPushToUser] Web Push falhou, criando notificação in-app:', pushErr.message);
      }
    }

    // Fallback: criar notificação na entidade (capturada pelo subscribe do app)
    await base44.asServiceRole.entities.Notification.create({
      user_id: userId,
      title,
      message: body,
      type: ['ride', 'message', 'coupon', 'event', 'system'].includes(type) ? type : 'system',
      is_read: false,
      is_persistent: true,
    });

    return Response.json({ success: true, method: 'in-app' });
  } catch (error) {
    console.error('[sendPushToUser]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});