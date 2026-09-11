const form = document.getElementById('leadForm');
const steps = [...document.querySelectorAll('.form-step')];
const successState = document.getElementById('successState');
const stepCounter = document.getElementById('stepCounter');
const progressFill = document.getElementById('progressFill');
const progressLabels = [...document.querySelectorAll('[data-label-step]')];
const specificFields = document.getElementById('specificFields');
const profileFields = document.getElementById('profileFields');
const submitBtn = document.getElementById('submitBtn');

let currentStep = 1;
const submissionId = (window.crypto && typeof window.crypto.randomUUID === 'function')
  ? window.crypto.randomUUID()
  : `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const utmParams = (() => {
  const params = new URLSearchParams(window.location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  return Object.fromEntries(keys.map(k => [k, params.get(k) || '']));
})();

function updateProgress() {
  stepCounter.textContent = `0${currentStep} / 03`;
  progressFill.style.width = `${((currentStep - 1) / 2) * 100}%`;
  progressLabels.forEach((el, index) => el.classList.toggle('active', index + 1 === currentStep));
}

function showStep(step) {
  currentStep = Math.max(1, Math.min(3, step));
  steps.forEach(el => el.classList.toggle('active', Number(el.dataset.step) === currentStep));
  updateProgress();
  document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function selectedIntent() {
  return form.querySelector('input[name="intent"]:checked')?.value || '';
}

function prepareStep2() {
  const intent = selectedIntent();
  const isSpecific = intent === 'perfume_especifico';
  specificFields.classList.toggle('hidden', !isSpecific);
  profileFields.classList.toggle('hidden', isSpecific);
}

function validateStep(step) {
  if (step === 1) {
    const error = document.getElementById('step1Error');
    if (!selectedIntent()) {
      error.textContent = 'Selecione uma opÃ§Ã£o para continuar.';
      return false;
    }
    error.textContent = '';
    return true;
  }

  if (step === 2) {
    const error = document.getElementById('step2Error');
    const intent = selectedIntent();
    if (intent === 'perfume_especifico') {
      const perfume = form.elements.perfume_name.value.trim();
      if (!perfume) {
        error.textContent = 'Informe qual perfume vocÃª procura.';
        return false;
      }
    }
    error.textContent = '';
    return true;
  }
  return true;
}

document.querySelectorAll('[data-next]').forEach(button => {
  button.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    if (currentStep === 1) prepareStep2();
    showStep(currentStep + 1);
  });
});

document.querySelectorAll('[data-back]').forEach(button => {
  button.addEventListener('click', () => showStep(currentStep - 1));
});

form.addEventListener('change', (event) => {
  if (event.target.name === 'intent') {
    document.getElementById('step1Error').textContent = '';
    document.querySelectorAll('.choice-card').forEach(card => {
      card.classList.toggle('selected', card.querySelector('input')?.checked);
    });
  }
});

function serializeForm() {
  const data = new FormData(form);
  return {
    intent: data.get('intent') || '',
    perfume_name: data.get('perfume_name') || '',
    purchase_timing: data.get('purchase_timing') || '',
    styles: data.getAll('styles'),
    occasion: data.get('occasion') || '',
    name: data.get('name') || '',
    phone: data.get('phone') || '',
    email: data.get('email') || '',
    future_perfume: data.get('future_perfume') || '',
    website: data.get('website') || '',
    consent: Boolean(data.get('consent')),
    page_url: window.location.href,
    user_agent: navigator.userAgent,
    submission_id: submissionId,
    ...utmParams
  };
}

function basicContactValidation() {
  const name = form.elements.name.value.trim();
  const phone = form.elements.phone.value.replace(/\D/g, '');
  const email = form.elements.email.value.trim();
  const consent = form.elements.consent.checked;

  if (name.length < 2) return 'Informe seu nome.';
  if (phone.length < 10) return 'Informe um WhatsApp vÃ¡lido.';
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return 'Informe um e-mail vÃ¡lido ou deixe o campo vazio.';
  if (!consent) return 'Ã‰ necessÃ¡rio autorizar o contato para enviar a solicitaÃ§Ã£o.';
  return '';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const errorEl = document.getElementById('submitError');
  const validationError = basicContactValidation();
  if (validationError) {
    errorEl.textContent = validationError;
    return;
  }

  errorEl.textContent = '';
  submitBtn.disabled = true;
  submitBtn.firstChild.textContent = 'ENVIANDO... ';

  try {
    const response = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serializeForm())
    });

    if (!response.ok) throw new Error('Falha no envio');

    steps.forEach(el => el.classList.remove('active'));
    successState.classList.add('active');
    document.querySelector('.progress-top').style.display = 'none';
    document.querySelectoŠ	Ëœš]˜XŞK[›İIÊKœİ[K™\Ü^HH	Û›Û™IÎÂ‚ˆYˆ
\[ÙˆÚ[™İË™˜œHOOH	Ù[˜İ[Û‰ÊHÂˆÚ[™İË™˜œJ	İ˜XÚÉË	ÓXY	ÊNÂˆBˆHØ]Ú
\œ›ÜŠHÂˆ\œ›Ü‘[^ÛÛ[H	Ó°èÛÈ›ÚHÜÜğë]™[[šX\ˆYÛÜ˜Kˆ[H›İ˜[Y[H[H[œİ[\Ë‰ÎÂˆİX›Z]‹™\ØX›YH˜[ÙNÂˆİX›Z]‹™š\œİÚ[^ÛÛ[H	ÑS•’PTˆÓÓPÒUpáğàÓÈ	ÎÂˆBŸJNÂ‚\]T›ÙÜ™\ÜÊ
NÂ