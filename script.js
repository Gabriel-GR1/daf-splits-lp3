// Meta Pixel
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1470839471393001');
fbq('track', 'PageView');

// CTA exibido somente no estado de sucesso do formulário.
const successState = document.getElementById('successState');

if (successState && !successState.querySelector('.success-group-cta')) {
  const successCta = document.createElement('div');
  successCta.className = 'success-group-cta';
  successCta.innerHTML = `
    <p class="success-group-kicker">ENQUANTO ISSO...</p>
    <h3>Conheça alguns dos perfumes que já trabalhamos.</h3>
    <p class="success-group-text">Entre no nosso grupo exclusivo e acompanhe fragrâncias, novidades e oportunidades da DAF Splits.</p>
    <a class="success-group-button" href="https://chat.whatsapp.com/GCi2WhyhAPXEExFhNszgoX?s=cl&p=i&mlu=0&ilr=4" target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.5 0 .2 5.3.2 11.9c0 2.1.6 4.2 1.6 6L0 24l6.3-1.7a12 12 0 0 0 5.8 1.5h.1c6.5 0 11.8-5.3 11.8-11.9 0-3.2-1.2-6.2-3.5-8.4Zm-8.4 18.3h-.1a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.7 9.7 0 1 1 8.4 4.6Zm5.4-7.3c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.2-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.4.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1-1.1 2.6s1.2 3.1 1.3 3.3c.2.2 2.3 3.6 5.7 5 .8.3 1.4.5 1.9.6.8.3 1.5.2 2.1.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3Z"/></svg>
      <span>ENTRAR NO GRUPO DA DAF</span>
      <b>→</b>
    </a>
  `;

  const confirmation = successState.querySelector('.success-confirmation');
  if (confirmation) confirmation.insertAdjacentElement('afterend', successCta);
  else successState.appendChild(successCta);

  const style = document.createElement('style');
  style.textContent = `
    .success-group-cta {
      width: min(390px, 100%);
      margin: clamp(44px, 7vh, 72px) auto 0;
      padding-top: 24px;
      border-top: 1px solid rgba(217, 173, 84, .22);
      text-align: center;
    }
    .success-group-kicker {
      margin: 0 0 8px !important;
      color: #f1cf83 !important;
      font-size: 9px !important;
      line-height: 1.3 !important;
      letter-spacing: .28em;
      font-weight: 700;
    }
    .success-group-cta h3 {
      margin: 0 auto 8px;
      max-width: 350px;
      color: #f4f2ed;
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(25px, 2.2vw, 31px);
      font-weight: 500;
      line-height: 1.05;
    }
    .success-group-text {
      max-width: 360px;
      margin: 0 auto !important;
      color: #a9a39b !important;
      font-size: 11px !important;
      line-height: 1.5 !important;
    }
    .success-group-button {
      width: 100%;
      min-height: 54px;
      margin-top: 18px;
      padding: 0 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      border-radius: 12px;
      background: linear-gradient(90deg, #e4b95d, #ffd387 48%, #f0a85c 100%);
      color: #111;
      text-decoration: none;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .07em;
      box-shadow: 0 10px 30px rgba(0,0,0,.2);
      transition: transform .18s ease, filter .18s ease;
    }
    .success-group-button:hover {
      transform: translateY(-1px);
      filter: brightness(1.04);
    }
    .success-group-button svg {
      width: 21px;
      height: 21px;
      flex: 0 0 21px;
      fill: currentColor;
    }
    .success-group-button b {
      margin-left: auto;
      font-size: 18px;
      font-weight: 500;
    }
    @media (max-width: 620px) {
      .success-group-cta {
        margin-top: 42px;
        padding-top: 22px;
      }
      .success-group-cta h3 { font-size: 26px; }
      .success-group-button { min-height: 52px; font-size: 10px; }
    }
  `;
  document.head.appendChild(style);

  successCta.querySelector('.success-group-button')?.addEventListener('click', () => {
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', 'WhatsAppGroupClick', { page: 'lp3-success' });
    }
  });
}

// Carrega o código original da LP3 depois de inicializar o Pixel.
const appScript = document.createElement('script');
appScript.src = './app.js';
appScript.async = false;
document.body.appendChild(appScript);
