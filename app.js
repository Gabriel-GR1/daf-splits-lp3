const form = document.getElementById('leadForm');
const steps = [...document.querySelectorAll('.form-step')];
const successState = document.getElementById('successState');
const stepCounter = document.getElementById('stepCounter');
const progressFill = document.getElementById('progressFill');
const progressLabels = [...document.querySelectorAll('[data-label-step]')];
const progressTop = document.getElementById('progressTop');
const privacyNote = document.getElementById('privacyNote');
const specificPrompt = document.getElementById('specificPrompt');
const perfumeNameInput = document.getElementById('perfumeNameInput');
const specificFields = document.getElementById('specificFields');
const profileFields = document.getElementById('profileFields');
const step2Title = document.getElementById('step2Title');
const step2Intro = document.getElementById('step2Intro');
const submitBtn = document.getElementById('submitBtn');

let currentStep = 1;

const submissionId = (window.crypto && typeof window.crypto.randomUUID === 'function')
  ? window.crypto.randomUUID()
  : `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const utmParams = (() => {
  const params = new URLSearchParams(window.location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  return Object.fromEntries(keys.map(key => [key, params.get(key) || '']));
})();

function readCookie(name) {
  const prefix = `${name}=`;
  const item = document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : '';
}

function getMetaBrowserData() {
  const fbp = readCookie('_fbp');
  let fbc = readCookie('_fbc');

  if (!fbc && utmParams.fbclid) {
    fbc = `fb.1.${Date.now()}.${utmParams.fbclid}`;
  }

  return { fbp, fbc };
}

function updateProgress() {
  stepCounter.textContent = `0${currentStep} / 03`;
  progressFill.style.width = `${((currentStep - 1) / 2) * 100}%`;
  progressLabels.forEach((el, index) => {
    el.classList.toggle('active', index + 1 === currentStep);
    el.classList.toggle('done', index + 1 < currentStep);
  });
}

function showStep(step) {
  currentStep = Math.max(1, Math.min(3, step));
  steps.forEach(el => el.classList.toggle('active', Number(el.dataset.step) === currentStep));
  updateProgress();

  if (window.matchMedia('(max-width: 980px)').matches) {
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function selectedIntent() {
  return form.querySelector('input[name="intent"]:checked')?.value || '';
}

function clearRadioGroup(name) {
  form.querySelectorAll(`input[name="${name}"]`).forEach(input => { input.checked = false; });
}

function prepareIntentUI() {
  const intent = selectedIntent();
  const isSpecific = intent === 'perfume_especifico';

  specificPrompt.classList.toggle('hidden', !isSpecific);

  if (!isSpecific) {
    perfumeNameInput.value = '';
  } else {
    requestAnimationFrame(() => perfumeNameInput.focus({ preventScroll: true }));
  }
}

function prepareStep2() {
  const intent = selectedIntent();
  const isSpecific = intent === 'perfume_especifico';

  specificFields.classList.toggle('hidden', !isSpecific);
  profileFields.classList.toggle('hidden', isSpecific);

  if (isSpecific) {
    step2Title.textContent = 'Só mais duas coisas.';
    step2Intro.textContent = 'Isso nos ajuda a entender sua intenção e a prioridade do seu pedido.';
    form.querySelectorAll('input[name="styles"]').forEach(input => { input.checked = false; });
    clearRadioGroup('occasion');
  } else {
    step2Title.textContent = intent === 'indicacao' ? 'Vamos encontrar o seu perfil.' : 'O que você gostaria de descobrir?';
    step2Intro.textContent = 'Escolha as características e a ocasião que mais combinam com o que você procura.';
    clearRadioGroup('purchase_goal');
  }
}

function validateStep(step) {
  if (step === 1) {
    const error = document.getElementById('step1Error');
    const intent = selectedIntent();

    if (!intent) {
      error.textContent = 'Selecione uma opção para continuar.';
      return false;
    }

    if (intent === 'perfume_especifico' && perfumeNameInput.value.trim().length < 2) {
      error.textContent = 'Informe qual perfume você está procurando.';
      perfumeNameInput.focus();
      return false;
    }

    error.textContent = '';
    return true;
  }

  if (step === 2) {
    const error = document.getElementById('step2Error');
    const intent = selectedIntent();
    const timing = form.querySelector('input[name="purchase_timing"]:checked');

    if (intent === 'perfume_especifico') {
      const goal = form.querySelector('input[name="purchase_goal"]:checked');
      if (!goal) {
        error.textContent = 'Conte o que você pretende fazer com esse perfume.';
        return false;
      }
    } else {
      const styles = [...form.querySelectorAll('input[name="styles"]:checked')];
      const occasion = form.querySelector('input[name="occasion"]:checked');

      if (!styles.length) {
        error.textContent = 'Selecione ao menos um tipo de perfume.';
        return false;
      }
      if (!occasion) {
        error.textContent = 'Selecione a ocasião principal.';
        return false;
      }
    }

    if (!timing) {
      error.textContent = 'Selecione quando você pretende comprar.';
      return false;
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

form.addEventListener('change', event => {
  if (event.target.name === 'intent') {
    document.getElementById('step1Error').textContent = '';
    document.querySelectorAll('.choice-card').forEach(card => {
      card.classList.toggle('selected', card.querySelector('input')?.checked);
    });
    prepareIntentUI();
  }

  if (currentStep === 2) {
    document.getElementById('step2Error').textContent = '';
  }
});

perfumeNameInput.addEventListener('input', () => {
  if (perfumeNameInput.value.trim().length >= 2) {
    document.getElementById('step1Error').textContent = '';
  }
});

function serializeForm() {
  const data = new FormData(form);
  return {
    intent: data.get('intent') || '',
    perfume_name: data.get('perfume_name') || '',
    purchase_goal: data.get('purchase_goal') || '',
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
    submitted_at: new Date().toISOString(),
    submission_id: submissionId,
    ...utmParams,
    ...getMetaBrowserData()
  };
}

function basicContactValidation() {
  const name = form.elements.name.value.trim();
  const phone = form.elements.phone.value.replace(/\D/g, '');
  const email = form.elements.email.value.trim();
  const consent = form.elements.consent.checked;

  if (name.length < 2) return 'Informe seu nome.';
  if (phone.length < 10 || phone.length > 13) return 'Informe um WhatsApp válido.';
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return 'Informe um e-mail válido ou deixe o campo vazio.';
  if (!consent) return 'É necessário autorizar o contato para enviar a solicitação.';
  return '';
}

function formatPhoneInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

form.elements.phone.addEventListener('input', event => {
  event.target.value = formatPhoneInput(event.target.value);
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const errorEl = document.getElementById('submitError');
  const validationError = basicContactValidation();

  if (validationError) {
    errorEl.textContent = validationError;
    return;
  }

  errorEl.textContent = '';
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'ENVIANDO... <span>→</span>';

  try {
    const payload = serializeForm();
    const response = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Falha no envio');

    steps.forEach(el => el.classList.remove('active'));
    successState.classList.add('active');
    progressTop.style.display = 'none';
    privacyNote.style.display = 'none';

    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', {}, { eventID: submissionId });
    }

    fetch('/api/meta-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(error => console.error('Meta CAPI:', error));
  } catch (error) {
    console.error(error);
    errorEl.textContent = 'Não foi possível enviar agora. Tente novamente em alguns instantes.';
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'ENVIAR MINHA SOLICITAÇÃO <span>→</span>';
  }
});

updateProgress();

// Background fotográfico do hero (desktop): reconstruído a partir de partes
// de texto versionadas no próprio repositório para manter o asset junto da LP.
(async function loadHeroBackground() {
  if (window.matchMedia('(max-width: 980px)').matches) return;

  const hero = document.querySelector('.hero');
  if (!hero || hero.querySelector('.hero-bg')) return;

  try {
    const files = Array.from({ length: 11 }, (_, index) =>
      `./assets/bg-parts/bg-${String(index).padStart(2, '0')}.txt`
    );

    const parts = await Promise.all(files.map(async (url) => {
      const response = await fetch(url, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`Falha ao carregar ${url}: ${response.status}`);
      return (await response.text()).trim();
    }));

    const layer = document.createElement('div');
    layer.className = 'hero-bg';
    layer.setAttribute('aria-hidden', 'true');
    layer.style.backgroundImage = `url("data:image/webp;base64,${parts.join('')}")`;
    hero.prepend(layer);
  } catch (error) {
    console.error('Não foi possível carregar o background da LP3.', error);
  }
})();
