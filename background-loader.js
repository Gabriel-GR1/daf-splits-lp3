(() => {
  const BREAKPOINT = '(max-width: 980px)';

  async function loadHeroBackground() {
    // O mobile mantém o visual limpo que já foi aprovado.
    if (window.matchMedia(BREAKPOINT).matches) return;

    const hero = document.querySelector('.hero');
    if (!hero || hero.querySelector('.hero-bg')) return;

    const files = Array.from({ length: 11 }, (_, index) =>
      `./assets/bg-parts/bg-${String(index).padStart(2, '0')}.txt`
    );

    try {
      const parts = await Promise.all(
        files.map(async (url) => {
          const response = await fetch(url, { cache: 'force-cache' });
          if (!response.ok) {
            throw new Error(`Falha ao carregar ${url}: ${response.status}`);
          }
          return (await response.text()).trim();
        })
      );

      const background = document.createElement('div');
      background.className = 'hero-bg';
      background.setAttribute('aria-hidden', 'true');
      background.style.backgroundImage = `url("data:image/webp;base64,${parts.join('')}")`;
      hero.prepend(background);
    } catch (error) {
      console.error('Não foi possível carregar o background da LP3.', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeroBackground, { once: true });
  } else {
    loadHeroBackground();
  }
})();
