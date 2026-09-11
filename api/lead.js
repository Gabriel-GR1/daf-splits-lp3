import crypto from 'node:crypto';

const labels = {
  intent: {
    perfume_especifico: 'Já tenho um perfume em mente',
    indicacao: 'Quero uma indicação',
    descobrir: 'Quero descobrir algo novo'
  },
  purchaseGoal: {
    experimentar_decante: 'Experimentar através de um decante',
    comprar_frasco: 'Comprar futuramente um frasco',
    pesquisando: 'Ainda estou pesquisando'
  },
  purchaseTiming: {
    agora: 'O quanto antes',
    '30_dias': 'Nos próximos 30 dias',
    pesquisando: 'Ainda não sei'
  },
  styles: {
    fresco: 'Fresco',
    doce: 'Doce',
    amadeirado: 'Amadeirado',
    elegante: 'Elegante',
    marcante: 'Marcante',
    versatil: 'Versátil',
    nao_sei: 'Não sei ainda'
  },
  occasion: {
    dia_a_dia: 'Dia a dia',
    trabalho_faculdade: 'Faculdade / trabalho',
    encontros: 'Encontros',
    noite_festas: 'Noite / festas',
    ocasioes_especiais: 'Ocasiões especiais',
    versatil: 'Quero algo versátil'
  }
};

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function html(value) {
  return clean(value, 2000)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function mapLabel(group, value) {
  const key = clean(value, 80);
  return labels[group]?.[key] || key || 'Não informado';
}

function normalizeLead(body) {
  const styles = Array.isArray(body.styles)
    ? body.styles.slice(0, 10).map(item => mapLabel('styles', item))
    : [];

  return {
    id: clean(body.submission_id, 120) || crypto.randomUUID(),
    receivedAt: new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(new Date()),
    name: clean(body.name, 120),
    phone: clean(body.phone, 40),
    email: clean(body.email, 180),
    intent: mapLabel('intent', body.intent),
    perfume: clean(body.perfume_name, 180),
    purchaseGoal: mapLabel('purchaseGoal', body.purchase_goal),
    purchaseTiming: mapLabel('purchaseTiming', body.purchase_timing),
    styles: styles.join(', '),
    occasion: mapLabel('occasion', body.occasion),
    futurePerfume: clean(body.future_perfume, 500),
    consent: body.consent === true ? 'Sim' : 'Não',
    utmSource: clean(body.utm_source, 180),
    utmMedium: clean(body.utm_medium, 180),
    utmCampaign: clean(body.utm_campaign, 180),
    utmContent: clean(body.utm_content, 180),
    utmTerm: clean(body.utm_term, 180),
    fbclid: clean(body.fbclid, 500),
    pageUrl: clean(body.page_url, 700),
    userAgent: clean(body.user_agent, 700)
  };
}

function validateLead(body, lead) {
  if (body.website) return 'spam';
  if (!lead.name || lead.name.length < 2) return 'Nome inválido.';
  if (!lead.phone || lead.phone.replace(/\D/g, '').length < 10) return 'WhatsApp inválido.';
  if (body.consent !== true) return 'Consentimento obrigatório.';

  const intent = clean(body.intent, 60);
  if (!['perfume_especifico', 'indicacao', 'descobrir'].includes(intent)) return 'Interesse inválido.';
  if (intent === 'perfume_especifico' && !lead.perfume) return 'Informe o perfume procurado.';
  if (!clean(body.purchase_timing, 40)) return 'Informe quando pretende comprar.';

  if (intent === 'perfume_especifico') {
    if (!clean(body.purchase_goal, 60)) return 'Informe o que pretende fazer.';
  } else {
    if (!Array.isArray(body.styles) || body.styles.length === 0) return 'Informe ao menos uma preferência.';
    if (!clean(body.occasion, 80)) return 'Informe a ocasião.';
  }
  return '';
}

function whatsappUrl(phone) {
  const digits = clean(phone, 40).replace(/\D/g, '');
  if (!digits) return '#';
  return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`;
}

function pdfEscape(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()\\]/g, match => `\\${match}`)
    .replace(/[^\x20-\x7E]/g, '?');
}

function wrap(value, max = 78) {
  const words = pdfEscape(value || '-').split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= max) line = next;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function buildPdf(lead) {
  const rows = [
    ['Nome', lead.name],
    ['WhatsApp', lead.phone],
    ['E-mail', lead.email || 'Não informado'],
    ['Interesse', lead.intent],
    ['Perfume procurado', lead.perfume || 'Não informado'],
    ['Objetivo', lead.purchaseGoal || 'Não informado'],
    ['Quando pretende comprar', lead.purchaseTiming],
    ['Preferências', lead.styles || 'Não informado'],
    ['Ocasião', lead.occasion || 'Não informado'],
    ['Gostaria de ver na DAF', lead.futurePerfume || 'Não informado'],
    ['Recebido em', lead.receivedAt],
    ['UTM Source', lead.utmSource || 'Não informado'],
    ['UTM Campaign', lead.utmCampaign || 'Não informado'],
    ['UTM Content', lead.utmContent || 'Não informado']
  ];

  let y = 790;
  let stream = '0.05 0.05 0.05 rg 0 0 595 842 re f\n';
  stream += '0.90 0.72 0.35 rg BT /F2 24 Tf 1 0 0 1 48 790 Tm (DAF SPLITS) Tj ET\n';
  stream += '1 1 1 rg BT /F2 17 Tf 1 0 0 1 48 758 Tm (Ficha de interesse - LP3) Tj ET\n';
  y = 724;

  for (const [label, value] of rows) {
    stream += `0.90 0.72 0.35 rg BT /F2 8 Tf 1 0 0 1 48 ${y} Tm (${pdfEscape(label.toUpperCase())}) Tj ET\n`;
    y -= 15;
    for (const line of wrap(value, 72)) {
      stream += `0.93 0.93 0.93 rg BT /F1 10 Tf 1 0 0 1 48 ${y} Tm (${line}) Tj ET\n`;
      y -= 13;
    }
    y -= 10;
    if (y < 70) break;
  }

  stream += `0.45 0.45 0.45 rg BT /F1 7 Tf 1 0 0 1 48 34 Tm (ID: ${pdfEscape(lead.id)}) Tj ET\n`;

  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = '<< /Type /Pages /Kids [5 0 R] /Count 1 >>';
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
  objects[5] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents 6 0 R >>';
  objects[6] = `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 1; i <= 6; i++) {
    offsets[i] = Buffer.byteLength(pdf);
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += 'xref\n0 7\n0000000000 65535 f \n';
  for (let i = 1; i <= 6; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

function filenameSafe(value) {
  return clean(value || 'Lead', 80)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'Lead';
}

function row(label, value) {
  return `<tr><td style="padding:7px 12px;color:#a07d37;font-size:11px;text-transform:uppercase;letter-spacing:.08em;vertical-align:top">${html(label)}</td><td style="padding:7px 12px;color:#ece7df;font-size:14px">${html(value || 'Não informado')}</td></tr>`;
}

function emailHtml(lead) {
  return `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#f2eee7"><div style="max-width:680px;margin:0 auto;padding:32px"><div style="border:1px solid #745b2b;background:#111;padding:28px;border-radius:14px"><div style="color:#d9ad54;font-size:13px;letter-spacing:.18em">DAF SPLITS · NOVO LEAD</div><h1 style="font-size:28px;margin:10px 0 4px;color:white">${html(lead.name)}</h1><p style="color:#aaa;margin:0 0 22px">Recebido em ${html(lead.receivedAt)}</p><table style="width:100%;border-collapse:collapse">${row('WhatsApp', lead.phone)}${row('E-mail', lead.email)}${row('Interesse', lead.intent)}${row('Perfume', lead.perfume)}${row('Objetivo', lead.purchaseGoal)}${row('Compra', lead.purchaseTiming)}${row('Preferências', lead.styles)}${row('Ocasião', lead.occasion)}${row('Sugestão para estoque', lead.futurePerfume)}</table><a href="${whatsappUrl(lead.phone)}" style="display:inline-block;margin-top:24px;background:#d9ad54;color:#111;text-decoration:none;font-weight:bold;padding:13px 18px;border-radius:9px">ABRIR WHATSAPP DO LEAD →</a><div style="border-top:1px solid #292929;margin-top:28px;padding-top:18px;color:#777;font-size:11px">UTM Campaign: ${html(lead.utmCampaign || 'Não informado')} · UTM Content: ${html(lead.utmContent || 'Não informado')}<br>ID: ${html(lead.id)}</div></div></div></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const lead = normalizeLead(body);
    const validation = validateLead(body, lead);

    if (validation === 'spam') return res.status(200).json({ ok: true });
    if (validation) return res.status(400).json({ error: validation });

    const apiKey = process.env.RESEND_API_KEY;
    const recipients = clean(process.env.LEADS_EMAIL, 800)
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
    const from = process.env.RESEND_FROM || 'DAF Splits <onboarding@resend.dev>';

    if (!apiKey || recipients.length === 0) {
      console.error('Missing RESEND_API_KEY or LEADS_EMAIL');
      return res.status(500).json({ error: 'Envio de e-mail ainda não configurado.' });
    }

    const pdf = buildPdf(lead);
    const subjectDetail = lead.perfume || lead.intent;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `daf-lp3-${lead.id}`
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: `Novo lead - ${lead.name} | ${subjectDetail}`,
        html: emailHtml(lead),
        attachments: [{
          filename: `Lead_DAF_${filenameSafe(lead.name)}.pdf`,
          content: pdf.toString('base64')
        }]
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Resend error:', result);
      return res.status(502).json({ error: 'Não foi possível enviar o lead por e-mail.' });
    }

    return res.status(200).json({ ok: true, id: lead.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno ao processar a solicitação.' });
  }
}
