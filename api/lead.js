import crypto from 'node:crypto';

const intentLabels = {
  perfume_especifico: 'Perfume especÃ­fico',
  indicacao: 'Quero uma indicaÃ§Ã£o',
  descobrir: 'Quero descobrir algo novo'
};

const purchaseLabels = {
  agora: 'O quanto antes',
  '30_dias': 'Nos prÃ³ximos 30 dias',
  pesquisando: 'Ainda estou pesquisando'
};

const styleLabels = {
  fresco: 'Fresco',
  doce: 'Doce',
  amadeirado: 'Amadeirado',
  elegante: 'Elegante',
  marcante: 'Marcante',
  versatil: 'VersÃ¡til'
};

const occasionLabels = {
  dia_a_dia: 'Dia a dia',
  trabalho_faculdade: 'Trabalho / faculdade',
  encontros: 'Encontros',
  noite_festas: 'Noite / festas',
  ocasioes_especiais: 'OcasiÃµes especiais',
  versatil: 'Quero algo versÃ¡til'
};

function text(value, max = 300) {
  return String(value ?? '').trim().slice(0, max);
}

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function brazilTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

function filenameSafe(value) {
  return String(value || 'Lead')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'Lead';
}

function normalizeLead(body) {
  const styles = Array.isArray(body.styles)
    ? body.styles.slice(0, 10).map(item => styleLabels[text(item, 40)] || text(item, 40)).filter(Boolean)
    : [];

  const intentKey = text(body.intent, 60);
  const purchaseKey = text(body.purchase_timing, 40);
  const occasionKey = text(body.occasion, 80);

  return {
    receivedAt: brazilTimestamp(),
    name: text(body.name, 120),
    phone: text(body.phone, 40),
    email: text(body.email, 180),
    intent: intentLabels[intentKey] || intentKey,
    perfumeName: text(body.perfume_name, 180),
    purchaseTiming: purchaseLabels[purchaseKey] || purchaseKey,
    styles: styles.join(', '),
    occasion: occasionLabels[occasionKey] || occasionKey,
    futurePerfume: text(body.future_perfume, 500),
    utmSource: text(body.utm_source, 180),
    utmMedium: text(body.utm_medium, 180),
    utmCampaign: text(body.utm_campaign, 180),
    utmContent: text(body.utm_content, 180),
    utmTerm: text(body.utm_term, 180),
    fbclid: text(body.fbclid, 500),
    pageUrl: text(body.page_url, 700),
    userAgent: text(body.user_agent, 700),
    consent: body.consent === true ? 'Sim' : 'NÃ£o',
    submissionId: text(body.submission_id, 120) || crypto.randomUUID()
  };
}

// --- Minimal PDF generator (no external package required) ---
// Uses built-in Helvetica / Helvetica-Bold with WinAnsi encoding.

function pdfSafeText(value) {
  return String(value ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '?');
}

function pdfHex(value) {
  const safe = pdfSafeText(value);
  return Buffer.from(safe, 'latin1').toString('hex').toUpperCase();
}

function wrapApprox(value, size, maxWidth) {
  const content = pdfSafeText(value || 'â€”');
  const approxChars = Math.max(8, Math.floor(maxWidth / (size * 0.53)));
  const paragraphs = content.split(/\r?\n/);
  const lines = [];

  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push('');
      continue;
    }
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= approxChars) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      if (word.length <= approxChars) {
        line = word;
      } else {
        for (let i = 0; i < word.length; i += approxChars) {
          const chunk = word.slice(i, i + approxChars);
          if (i + approxChars < word.length) lines.push(chunk);
          else line = chunk;
        }
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function cmdText(textValue, x, y, size = 11, font = 'F1', color = '0.06 0.06 0.06') {
  return `${color} rg BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm <${pdfHex(textValue)}> Tj ET\n`;
}

function cmdLine(x1, y1, x2, y2, width = 0.7, color = '0.72 0.57 0.27') {
  return `${color} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S\n`;
}

function cmdRect(x, y, w, h, color = '0.055 0.055 0.055') {
  return `${color} rg ${x} ${y} ${w} ${h} re f\n`;
}

function drawHeader(pageNo) {
  let c = '';
  c += cmdRect(0, 772, 595.28, 70, '0.055 0.055 0.055');
  c += cmdText('DAF', 54, 803, 21, 'F2', '1 1 1');
  c += cmdText('SPLITS', 100, 803, 9.5, 'F1', '0.72 0.57 0.27');
  c += cmdText('FICHA DE INTERESSE', 54, 786, 7.5, 'F1', '0.92 0.92 0.92');
  c += cmdText(String(pageNo).padStart(2, '0'), 515, 800, 9, 'F2', '0.72 0.57 0.27');
  return c;
}

function drawFooter(submissionId) {
  let c = '';
  c += cmdLine(54, 42, 541, 42, 0.5, '0.8 0.8 0.8');
  c += cmdText('Documento gerado automaticamente pela LP3 da DAF Splits.', 54, 27, 7.5, 'F1', '0.38 0.38 0.38');
  c += cmdText(`ID: ${submissionId}`, 355, 27, 7.2, 'F1', '0.38 0.38 0.38');
  return c;
}

function drawSectionTitle(title, y) {
  let c = '';
  c += cmdText(title.toUpperCase(), 54, y, 10, 'F2');
  c += cmdLine(54, y - 9, 541, y - 9, 0.7, '0.72 0.57 0.27');
  return { content: c, nextY: y - 31 };
}

function drawLabelValue(label, value, y, opts = {}) {
  const x = opts.x ?? 54;
  const width = opts.width ?? 487;
  const labelSize = opts.labelSize ?? 8.5;
  const valueSize = opts.valueSize ?? 11;
  const lineHeight = opts.lineHeight ?? 14;
  let c = '';

  c += cmdText(label.toUpperCase(), x, y, labelSize, 'F2', '0.72 0.57 0.27');
  const lines = wrapApprox(value || 'â€”', valueSize, width);
  let cursor = y - 18;
  for (const line of lines) {
    c += cmdText(line || ' ', x, cursor, valueSize, 'F1');
    cursor -= lineHeight;
  }
  return { content: c, nextY: cursor - 11 };
}

function createPdfBuffer(stream1, stream2) {
  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = '<< /Type /Pages /Kids [5 0 R 7 0 R] /Count 2 >>';
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  objects[5] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents 6 0 R >>';
  objects[6] = `<< /Length ${Buffer.byteLength(stream1, 'binary')} >>\nstream\n${stream1}endstream`;
  objects[7] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents 8 0 R >>';
  objects[8] = `<< /Length ${Buffer.byteLength(stream2, 'binary')} >>\nstream\n${stream2}endstream`;

  let pdf = '%PDF-1.4\n%Ã¢Ã£ÃÃ“\n';
  const offsets = [0];
  for (let i = 1; i <= 8; i++) {
    offsets[i] = Buffer.byteLength(pdf, 'binary');
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'binary');
  pdf += 'xref\n0 9\n';
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= 8; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 9 /Root 1 0 R >>\nstartxref\n${(xrefOffset)}\n%%EOF\n`;
  return Buffer.from(pdf, 'binary');
}

export function buildLeadPdf(lead) {
  let p1 = drawHeader(1);
  p1 += cmdText('NOVO LEAD', 54, 735, 9, 'F2', '0.72 0.57 0.27');
  p1 += cmdText(lead.name || 'Lead sem nome', 54, 705, 24, 'F2');
  p1 += cmdText(`Recebido em ${lead.receivedAt}`, 54, 683, 9.5, 'F1', '0.38 0.38 0.38');

  let section = drawSectionTitle('Contato', 640);
  p1 += section.content;
  let y = section.nextY;

  let block = drawLabelValue('WhatsApp', lead.phone, y, { width: 235 });
  p1 += block.content; y = block.nextY;
  block = drawLabelValue('E-mail', lead.email || 'NÃ£o informado', y);
  p1 += block.content; y = block.nextY;

  section = drawSectionTitle('O que ocliente procura', y - 3);
  p1 += section.content; y = section.nextY;
  block = drawLabelValue('IntenÃ§Ã£o', lead.intent, y);
  p1 += block.content; y = block.nextY;
  if (lead.perfumeName) {
    block = drawLabelValue('Perfume procurado', lead.perfumeName, y);
    p1 += block.content; y = block.nextY;
  }
  if (lead.purchaseTiming) {
    block = drawLabelValue('Momento de compra', lead.purchaseTiming, y);
    p1 += block.content; y = block.nextY;
  }

  section = drawSectionTitle('PreferÃªncias', y - 3);
  p1 += section.content; y = section.nextY;
  block = drawLabelValue('Perfis olfativos', lead.styles || 'NÃ£o informado', y);
  p1 += block.content; y = block.nextY;
  block = drawLabelValue('OcasiÃ£o', lead.occasion || 'NÃ£o informada', y);
  p1 += block.content; y = block.nextY;
  block = drawLabelValue('Perfume que gostaria de ver na DAF', lead.futurePerfume || 'NÃ£o informado', y, { valueSize: 10.5, lineHeight: 13 });
  p1 += block.content;
  p1 += drawFooter(lead.submissionId);

  let p2 = drawHeader(2);
  section = drawSectionTitle('Origem do lead / Ads', 724);
  p2 += section.content;
  let y2 = section.nextY;
  const campaignFields = [
    ['UTM Source', lead.utmSource],
    ['UTM Medium', lead.utmMedium],
    ['UTM Campaign', lead.utmCampaign],
    ['UTM Content', lead.utmContent],
    ['UTM Term', lead.utmTerm],
    ['FBCLID', lead.fbclid],
    ['PÃ¡gina de origem', lead.pageUrl]
  ];

  for (const [label, value] of campaignFields) {
    block = drawLabelValue(label, value || 'NÃ£o informado', y2, {
      valueSize: label === 'FBCLID' || label === 'PÃ¡gina de origem' ? 8.5 : 10.5,
      lineHeight: 11.5
    });
    p2 += block.content;
    y2 = block.nextY;
  }

  section = drawSectionTitle('Registro tÃ©cnico', Math.max(y2 - 3, 190));
  p2 += section.content;
  y2 = section.nextY;
  block = drawLabelValue('Consentimento', lead.consent, y2);
  p2 += block.content; y2 = block.nextY;
  block = drawLabelValue('Navegador / dispositivo', lead.userAgent || 'NÃ£o informado', y2, { valueSize: 8.2, lineHeight: 10.5 });
  p2 += block.content;
  p2 += drawFooter(lead.submissionId);

  return createPdfBuffer(p1, p2);
}

function whatsAppHref(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}

function fieldRow(label, value) {
  return `(€€€€ñÑÈø(€€€€€€ñÑÍÑå±”ô‰Á…‘‘¥¹œèáÁà€ÄÉÁà€áÁà€Àí½±½ÈèŒá„Ù„Éí™½¹ĞµÍ¥é”èÄÉÁàí™½¹Ğµİ•¥¡ĞèÜÀÀíÙ•ÉÑ¥…°µ…±¥¸éÑ½Àíİ¡¥Ñ”µÍÁ…”é¹½İÉ…Àìˆø‘í¡Ñµ±Í…Á”¡±…‰•°¥ôğ½Ñø(€€€€€€ñÑÍÑå±”ô‰Á…‘‘¥¹œèáÁà€Àí½±½ÈèŒÅŒÅŒÅŒí™½¹ĞµÍ¥é”èÄÑÁàí±¥¹”µ¡•¥¡ĞèÄ¸ĞÔìˆø‘í¡Ñµ±Í…Á”¡Ù…±Õ”ñğ€ŸŠPœ¥ôğ½Ñø(€€€€ğ½ÑÈù€ì)ô()™Õ¹Ñ¥½¸‰Õ¥±‘µ…¥±!Ñµ°¡±•…¤ì(€½¹ÍĞİ„€ôİ¡…ÑÍÁÁ!É•˜¡±•…¹Á¡½¹”¤ì(€½¹ÍĞÉ½İÌ€ôl(€€€l9½µ”œ°±•…¹¹…µ•t°(€€€l]¡…ÑÍÁÀœ°±•…¹Á¡½¹•t°(€€€lµµ…¥°œ°±•…¹•µ…¥°ñğ€;¼¥¹™½Éµ…‘¼t°(€€€l%¹Ñ•»Ÿ¼œ°±•…¹¥¹Ñ•¹Ñt°(€€€lA•É™Õµ”ÁÉ½ÕÉ…‘¼œ°±•…¹Á•É™Õµ•9…µ”ñğ€;¼¥¹™½Éµ…‘¼t°(€€€l5½µ•¹Ñ¼‘”½µÁÉ„œ°±•…¹ÁÕÉ¡…Í•Q¥µ¥¹œñğ€;¼¥¹™½Éµ…‘¼t°(€€€lA•É™¥Ì½±™…Ñ¥Ù½Ìœ°±•…¹ÍÑå±•Ìñğ€;¼¥¹™½Éµ…‘¼t°(€€€l=…Í§¼œ°±•…¹½…Í¥½¸ñğ€;¼¥¹™½Éµ…‘„t°(€€€lMÕ•ÍÓ¼Á…É„•ÍÑ½ÅÕ”œ°±•…¹™ÕÑÕÉ•A•É™Õµ”ñğ€;¼¥¹™½Éµ…‘„t°(€€€l…µÁ…¹¡„œ°±•…¹ÕÑµ…µÁ…¥¸ñğ€;¼¥¹™½Éµ…‘„t°(€€€lÉ¥…Ñ¥Ù¼€¼UQ4½¹Ñ•¹Ğœ°±•…¹ÕÑµ½¹Ñ•¹Ğñğ€;¼¥¹™½Éµ…‘¼t(€t¹µ…À ¡m°°Ùt¤€ôø™¥•±‘I½Ü¡°°Ø¤¤¹©½¥¸ œœ¤ì((€É•ÑÕÉ¸€ğ…‘½ÑåÁ”¡Ñµ°ø(ñ¡Ñµ°ø(€€ñ‰½‘äÍÑå±”ô‰µ…É¥¸èÀí‰…­É½Õ¹è˜Ñ˜É•í™½¹Ğµ™…µ¥±äéÉ¥…°±!•±Ù•Ñ¥„±Í…¹ÌµÍ•É¥˜í½±½ÈèŒÅŒÅŒÅŒìˆø(€€€€ñ‘¥ØÍÑå±”ô‰µ…àµİ¥‘Ñ èØàÁÁàíµ…É¥¸èÀ…ÕÑ¼íÁ…‘‘¥¹œèÈáÁà€ÄÙÁàìˆø(€€€€€€ñ‘¥ØÍÑå±”ô‰‰…­É½Õ¹èŒÄÄÄÄÄÄíÁ…‘‘¥¹œèÈÑÁà€ÈáÁàí‰½É‘•ÈµÉ…‘¥ÕÌèÄÁÁà€ÄÁÁà€À€Àìˆø(€€€€€€€€ñ‘¥ØÍÑå±”ô‰½±½ÈèŒÑ„ÄÕ”í™½¹ĞµÍ¥é”èÄÉÁàí±•ÑÑ•ÈµÍÁ…¥¹œèÉÁàí™½¹Ğµİ•¥¡ĞèÜÀÀìˆùMA1%QLğ½‘¥Øø(€€€€€€€€ñ ÄÍÑå±”ô‰½±½Èè™™™™™˜íµ…É¥¸èáÁà€À€Àí™½¹ĞµÍ¥é”èÈÕÁàí±¥¹”µ¡•¥¡ĞèÄ¸Èìˆù9½Ù¼±•…É••‰¥‘¼ğ½ Äø(€€€€€€ğ½‘¥Øø(€€€€€€ñ‘¥ØÍÑå±”ô‰‰…­É½Õ¹è™™™™™˜íÁ…‘‘¥¹œèÈáÁàí‰½É‘•ÈµÉ…‘¥ÕÌèÀ€À€ÄÁÁà€ÄÁÁàìˆø(€€€€€€€€ñÀÍÑå±”ô‰µ…É¥¸èÀ€À€ÈÁÁàí½±½ÈèŒÕ˜Õ˜Õ˜í™½¹ĞµÍ¥é”èÄÑÁàìˆùI••‰¥‘¼•´€‘í¡Ñµ±Í…Á”¡±•…¹É••¥Ù•‘Ğ¥ô¸™¥¡„½µÁ±•Ñ„Ñ…µ‹¥´•ÍÓ„…¹•á…‘„•´A¸ğ½Àø(€€€€€€€€ñÑ…‰±”É½±”ô‰ÁÉ•Í•¹Ñ…Ñ¥½¸ˆÍÑå±”ô‰İ¥‘Ñ èÄÀÀ”í‰½É‘•Èµ½±±…ÁÍ”é½±±…ÁÍ”ìˆø‘íÉ½İÍôğ½Ñ…‰±”ø(€€€€€€€€‘íİ„€ü€ñ‘¥ØÍÑå±”ô‰µ…É¥¸µÑ½ÀèÈÑÁàìˆøñ„¡É•˜ôˆ‘íİ…ôˆÍÑå±”ô‰‘¥ÍÁ±…äé¥¹±¥¹”µ‰±½¬í‰…­É½Õ¹èŒÄÔÄÔÄÔí½±½Èè™™™™™˜íÑ•áĞµ‘•½É…Ñ¥½¸é¹½¹”íÁ…‘‘¥¹œèÄÍÁà€ÄáÁàí‰½É‘•ÈµÉ…‘¥ÕÌèÙÁàí™½¹ĞµÍ¥é”èÄÍÁàí™½¹Ğµİ•¥¡ĞèÜÀÀí±•ÑÑ•ÈµÍÁ…¥¹œè¸ÕÁàìˆù	I%H]!QMA@<1ğ½„øğ½‘¥Øù€€è€œô(€€€€€€€€ñ‘¥ØÍÑå±”ô‰µ…É¥¸µÑ½ÀèÈÙÁàíÁ…‘‘¥¹œµÑ½ÀèÄáÁàí‰½É‘•ÈµÑ½ÀèÅÁàÍ½±¥€”İ”ÅØí½±½ÈèŒàààí™½¹ĞµÍ¥é”èÄÅÁàí±¥¹”µ¡•¥¡ĞèÄ¸Ôìˆù%‘„Í½±¥¥Ñ‡Ÿ¼è€‘í¡Ñµ±Í…Á”¡±•…¹ÍÕ‰µ¥ÍÍ¥½¹%¥ôğ½‘¥Øø(€€€€€€ğ½‘¥Øø(€€€€ğ½‘¥Øø(€€ğ½‰½‘äø(ğ½¡Ñµ°ù€ì)ô()…Íå¹Œ™Õ¹Ñ¥½¸Í•¹‘]¥Ñ¡I•Í•¹¡ì…Á¥-•ä°™É½´°É•¥Á¥•¹ÑÌ°±•…°Á‘™	åÑ•Ìô¤ì(€½¹ÍĞ‘…Ñ•M±Õœ€ô¹•Ü…Ñ” ¤¹Ñ½%M=MÑÉ¥¹œ ¤¹Í±¥” À°€ÄÀ¤ì(€½¹ÍĞ™¥±•¹…µ”€ô1•…‘}|‘í™¥±•¹…µ•M…™”¡±•…¹¹…µ”¥õ|‘í‘…Ñ•M±Õô¹Á‘™€ì(€½¹ÍĞÁ•É™Õµ•MÕ™™¥à€ô±•…¹Á•É™Õµ•9…µ”€ü€ğ€‘í±•…¹Á•É™Õµ•9…µ•õ€€è€œœì((€½¹ÍĞÁ…å±½…€ôì(€€€™É½´°(€€€Ñ¼èÉ•¥Á¥•¹ÑÌ°(€€€ÍÕ‰©•Ğè9½Ù¼±•…€´€‘í±•…¹¹…µ•ô‘íÁ•É™Õµ•MÕ™™¥áõ€°(€€€¡Ñµ°è‰Õ¥±‘µ…¥±!Ñµ°¡±•…¤°(€€€…ÑÑ…¡µ•¹ÑÌèl(€€€€€ì(€€€€€€€™¥±•¹…µ”°(€€€€€€€½¹Ñ•¹ĞèÁ‘™	åÑ•Ì¹Ñ½MÑÉ¥¹œ ‰…Í”ØĞœ¤°(€€€€€€€½¹Ñ•¹Ñ}ÑåÁ”è€…ÁÁ±¥…Ñ¥½¸½Á‘˜œ(€€€€€ô(€€€t(€ôì((€½¹ÍĞÉ•ÍÁ½¹Í”€ô…İ…¥Ğ™•Ñ  ¡ÑÑÁÌè¼½…Á¤¹É•Í•¹¹½´½•µ…¥±Ìœ°ì(€€€µ•Ñ¡½è€A=MPœ°(€€€¡•…‘•ÉÌèì(€€€€€ÕÑ¡½É¥é…Ñ¥½¸è	•…É•È€‘í…Á¥-•åõ€°(€€€€€€½¹Ñ•¹ĞµQåÁ”œè€…ÁÁ±¥…Ñ¥½¸½©Í½¸œ°(€€€€€€%‘•µÁ½Ñ•¹äµ-•äœè‘…˜µ±ÀÌ¼‘í±•…¹ÍÕ‰µ¥ÍÍ¥½¹%‘õ€(€€€ô°(€€€‰½‘äè)M=8¹ÍÑÉ¥¹¥™ä¡Á…å±½…¤(€ô¤ì((€½¹ÍĞÉ•ÍÁ½¹Í•Q•áĞ€ô…İ…¥ĞÉ•ÍÁ½¹Í”¹Ñ•áĞ ¤ì(€±•ĞÉ•ÍÁ½¹Í•…Ñ„€ôíôì(€ÑÉäìÉ•ÍÁ½¹Í•…Ñ„€ôÉ•ÍÁ½¹Í•Q•áĞ€ü)M=8¹Á…ÉÍ”¡É•ÍÁ½¹Í•Q•áĞ¤€èíôìô…Ñ ìÉ•ÍÁ½¹Í•…Ñ„€ôìÉ…ÜèÉ•ÍÁ½¹Í•Q•áĞôìô((€¥˜€ …É•ÍÁ½¹Í”¹½¬¤ì(€€€½¹Í½±”¹•ÉÉ½È I•Í•¹•ÉÉ½Èèœ°É•ÍÁ½¹Í”¹ÍÑ…ÑÕÌ°É•ÍÁ½¹Í•…Ñ„¤ì(€€€Ñ¡É½Ü¹•ÜÉÉ½È µ…¥°‘•±¥Ù•Éä™…¥±•œ¤ì(€ô((€É•ÑÕÉ¸É•ÍÁ½¹Í•…Ñ„ì)ô()•áÁ½ÉĞ‘•™…Õ±Ğ…Íå¹Œ™Õ¹Ñ¥½¸¡…¹‘±•È¡É•Ä°É•Ì¤ì(€¥˜€¡É•Ä¹µ•Ñ¡½€„ôô€A=MPœ¤ì(€€€É•ÑÕÉ¸É•Ì¹ÍÑ…ÑÕÌ ĞÀÔ¤¹©Í½¸¡ì•ÉÉ½Èè€5•Ñ¡½¹½Ğ…±±½İ•œô¤ì(€ô((€½¹ÍĞì(€€€IM9}A%}-d°(€€€1M}5%0°(€€€IM9}I=4€ô€MÁ±¥ÑÌ€ñ½¹‰½…É‘¥¹É•Í•¹¹‘•Øøœ(€ô€ôÁÉ½•ÍÌ¹•¹Øì((€¥˜€ …IM9}A%}-dñğ€…1M}5%0¤ì(€€€½¹Í½±”¹•ÉÉ½È 5¥ÍÍ¥¹œIM9}A%}-d½È1M}5%0•¹Ù¥É½¹µ•¹ĞÙ…É¥…‰±”¸œ¤ì(€€€É•ÑÕÉ¸É•Ì¹ÍÑ…ÑÕÌ ÔÀÀ¤¹©Í½¸¡ì•ÉÉ½Èè€	…­•¹¹½Ğ½¹™¥ÕÉ•œô¤ì(€ô((€ÑÉäì(€€€½¹ÍĞ‰½‘ä€ôÉ•Ä¹‰½‘äñğíôì((€€€€¼¼!½¹•åÁ½Ğè‰½ÑÌ½ÍÑÕµ…´ÁÉ••¹¡•È…µÁ½Ì¥¹Ù¥ÏµÙ•¥Ì¸(€€€¥˜€¡Ñ•áĞ¡‰½‘ä¹İ•‰Í¥Ñ”°€ÈÀÀ¤¤ì(€€€€€É•ÑÕÉ¸É•Ì¹ÍÑ…ÑÕÌ ÈÀÀ¤¹©Í½¸¡ì½¬èÑÉÕ”ô¤ì(€€€ô((€€€½¹ÍĞ±•…€ô¹½Éµ…±¥é•1•…¡‰½‘ä¤ì(€€€¥˜€ …±•…¹¹…µ”ñğ€…±•…¹Á¡½¹”ñğ€…±•…¹¥¹Ñ•¹Ğñğ‰½‘ä¹½¹Í•¹Ğ€„ôôÑÉÕ”¤ì(€€€€€É•ÑÕÉ¸É•Ì¹ÍÑ…ÑÕÌ ĞÀÀ¤¹©Í½¸¡ì•ÉÉ½Èè€5¥ÍÍ¥¹œÉ•ÅÕ¥É•™¥•±‘Ìœô¤ì(€€€ô((€€€½¹ÍĞÉ•¥Á¥•¹ÑÌ€ô1M}5%0¹ÍÁ±¥Ğ œ°œ¤¹µ…À¡¥Ñ•´€ôø¥Ñ•´¹ÑÉ¥´ ¤¤¹™¥±Ñ•È¡	½½±•…¸¤¹Í±¥” À°€ÄÀ¤ì(€€€¥˜€ …É•¥Á¥•¹ÑÌ¹±•¹Ñ ¤ì(€€€€€É•ÑÕÉ¸É•Ì¹ÍÑ…ÑÕÌ ÔÀÀ¤¹©Í½¸¡ì•ÉÉ½Èè€9¼É•¥Á¥•¹Ğ½¹™¥ÕÉ•œô¤ì(€€€ô((€€€½¹ÍĞÁ‘™	åÑ•Ì€ô‰Õ¥±‘1•…‘A‘˜¡±•…¤ì(€€€½¹ÍĞ•µ…¥°€ô…İ…¥ĞÍ•¹‘]¥Ñ¡I•Í•¹¡ì(€€€€€…Á¥-•äèIM9}A%}-d°(€€€€€™É½´èIM9}I=4°(€€€€€É•¥Á¥•¹ÑÌ°(€€€€€±•…°(€€€€€Á‘™	åÑ•Ì(€€€ô¤ì((€€€É•ÑÕÉ¸É•Ì¹ÍÑ…ÑÕÌ ÈÀÀ¤¹©Í½¸¡ì½¬èÑÉÕ”°•µ…¥±%è•µ…¥°¹¥ñğ¹Õ±°ô¤ì(€ô…Ñ €¡•ÉÉ½È¤ì(€€€½¹Í½±”¹•ÉÉ½È 1•…ÍÕ‰µ¥ÍÍ¥½¸•ÉÉ½Èèœ°•ÉÉ½È¤ì(€€€É•ÑÕÉ¸É•Ì¹ÍÑ…ÑÕÌ ÔÀÀ¤¹©Í½¸¡ì•ÉÉ½Èè€%¹Ñ•É¹…°Í•ÉÙ•È•ÉÉ½Èœô¤ì(€ô)ô(