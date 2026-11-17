import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const SENDER = 'growthlead05@gmail.com';
const MAX_BODY_BYTES = 16 * 1024;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const submissions = new Map();

const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
const EMAIL_FROM = (process.env.EMAIL_FROM || 'onboarding@resend.dev').trim();
const EMAIL_TO = (process.env.EMAIL_TO || SENDER).trim();
const emailConfigured = Boolean(RESEND_API_KEY && EMAIL_FROM && EMAIL_TO);

const types = {
  partnership: 'Partnership inquiry',
  volunteer: 'Volunteer inquiry',
};

function sendJson(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(data));
}

function applySecurityHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  );
}

function rateLimitKey(request) {
  return request.socket.remoteAddress || 'unknown';
}

function allowSubmission(request) {
  const now = Date.now();
  const key = rateLimitKey(request);
  const recent = (submissions.get(key) || []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    submissions.set(key, recent);
    return false;
  }
  recent.push(now);
  submissions.set(key, recent);
  return true;
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      request.resume();
      const error = new Error('too_large');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('invalid_json');
    error.status = 400;
    throw error;
  }
}

function clean(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

async function handleContact(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { error: 'method_not_allowed' });
  }

  let origin;
  try {
    origin = new URL(request.headers.origin || '');
  } catch {
    return sendJson(response, 403, { error: 'origin_not_allowed' });
  }
  if (origin.host !== request.headers.host || !['http:', 'https:'].includes(origin.protocol)) {
    return sendJson(response, 403, { error: 'origin_not_allowed' });
  }

  if (!String(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    return sendJson(response, 415, { error: 'unsupported_media_type' });
  }
  if (!allowSubmission(request)) {
    return sendJson(response, 429, { error: 'rate_limited' });
  }

  let payload;
  try {
    payload = await readJson(request);
  } catch (error) {
    return sendJson(response, error.status || 400, { error: error.message || 'invalid_request' });
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return sendJson(response, 400, { error: 'invalid_request' });
  }

  // Quietly accept honeypot submissions without delivering them.
  if (clean(payload.website, 200)) {
    return sendJson(response, 202, { ok: true });
  }

  const type = clean(payload.type, 30);
  const name = clean(payload.name, 120);
  const email = clean(payload.email, 254);
  const message = clean(payload.message, 5000);
  const organization = clean(payload.organization, 200);
  const phone = clean(payload.phone, 50);
  const interest = clean(payload.interest, 100);

  if (!types[type] || name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
    return sendJson(response, 400, { error: 'invalid_fields' });
  }
  if (!emailConfigured) {
    return sendJson(response, 503, { error: 'not_configured' });
  }

  const details = [
    `Inquiry type: ${types[type]}`,
    `Name: ${name}`,
    `Email: ${email}`,
    organization ? `Organization: ${organization}` : '',
    phone ? `Phone: ${phone}` : '',
    interest ? `Area of interest: ${interest}` : '',
    '',
    'Message:',
    message,
  ].filter((line) => line !== undefined);

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM.includes('<') ? EMAIL_FROM : `Growth Lead Africa <${EMAIL_FROM}>`,
        to: [EMAIL_TO],
        reply_to: email,
        subject: `Growth Lead Africa — ${types[type]}`,
        text: details.join('\n'),
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text();
      console.error('Resend email delivery failed:', resendResponse.status, errorBody.slice(0, 500));
      return sendJson(response, 502, { error: 'delivery_failed' });
    }
    return sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error('Contact email delivery failed:', error.code || 'smtp_error');
    return sendJson(response, 502, { error: 'delivery_failed' });
  }
}

const server = createServer(async (request, response) => {
  applySecurityHeaders(response);
  const url = new URL(request.url || '/', 'http://localhost');

  if (url.pathname === '/api/contact') {
    return handleContact(request, response);
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD, POST' });
    return response.end('Method not allowed');
  }

  const asset = url.pathname === '/' || url.pathname === '/index.html'
    ? 'index.html'
    : url.pathname === '/brand-logo.png'
      ? 'brand-logo.png'
      : null;
  if (!asset) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return response.end('Not found');
  }

  try {
    const data = await readFile(path.join(ROOT, asset));
    response.writeHead(200, {
      'Content-Type': asset.endsWith('.png') ? 'image/png' : 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Content-Length': data.length,
    });
    return response.end(request.method === 'HEAD' ? undefined : data);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    return response.end('Unable to load the page');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Growth Lead Africa site listening on http://${HOST}:${PORT}`);
  if (!emailConfigured) console.warn('Email sending is disabled until RESEND_API_KEY, EMAIL_FROM, and EMAIL_TO are configured.');
});
