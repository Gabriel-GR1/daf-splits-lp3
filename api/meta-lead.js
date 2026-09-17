import crypto from 'node:crypto';

const PIXEL_ID = '1470839471393001';
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v22.0';

function clean(value, max = 800) {
  return String(value ?? '').trim().slice(0, max);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeExternalId(value) {
  return clean(value, 160).toLowerCase();
}

function getClientIp(req) {
  const forwarded = clean(req.headers['x-forwarded-for'], 300);
  if (forwarded) return forwarded.split(',')[0].trim();
  return clean(req.socket?.remoteAddress, 100);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    console.warn('META_ACCESS_TOKEN não configurado. Evento CAPI ignorado.');
    return res.status(200).json({ ok: true, configured: false });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const eventId = clean(body.submission_id, 160);
    const pageUrl = clean(body.page_url, 1000);
    const userAgent = clean(body.user_agent, 1000);
    const fbp = clean(body.fbp, 500);
    const fbc = clean(body.fbc, 500);

    if (!eventId) {
      return res.status(400).json({ error: 'event_id ausente.' });
    }

    const userData = {
      client_ip_address: getClientIp(req),
      client_user_agent: userAgent,
      external_id: [sha256(normalizeExternalId(eventId))]
    };

    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;

    const event = {
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: pageUrl,
      user_data: userData,
      custom_data: {
        content_name: 'LP3 - Formulário de fragrância',
        content_category: 'Lead'
      }
    };

    const payload = { data: [event] };
    if (process.env.META_TEST_EVENT_CODE) {
      payload.test_event_code = process.env.META_TEST_EVENT_CODE;
    }

    const endpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Meta CAPI error:', result);
      return res.status(502).json({ error: 'Falha ao enviar evento para Meta.', details: result });
    }

    return res.status(200).json({ ok: true, configured: true, result });
  } catch (error) {
    console.error('Meta CAPI exception:', error);
    return res.status(500).json({ error: 'Erro interno ao enviar evento para Meta.' });
  }
}
