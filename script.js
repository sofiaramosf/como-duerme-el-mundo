(() => {
  const CYCLE_MS = 24000; // Duración editable de cada ciclo del contador.
  const TRANSITION_MS = 3200;
  const screens = [...document.querySelectorAll('.screen')];
  const experience = document.getElementById('experience');
  let activeScreen = 'home';
  let counterTimer = null;
  let transitionTimer = null;
  let navigationTimer = null;

  const stopTimers = () => {
    if (counterTimer !== null) clearInterval(counterTimer);
    if (transitionTimer !== null) clearTimeout(transitionTimer);
    if (navigationTimer !== null) clearTimeout(navigationTimer);
    counterTimer = transitionTimer = navigationTimer = null;
  };

  function resetCounters() {
    document.querySelectorAll('.country-card').forEach(card => {
      const count = card.querySelector('.sleep-time');
      const bar = card.querySelector('.progress span');
      if (count) count.textContent = '0 h 0 min';
      if (bar) bar.style.width = '0%';
    });
  }

  function startCounters() {
    resetCounters();
    const cards = [...document.querySelectorAll('.country-card')];
    const startedAt = performance.now();
    counterTimer = setInterval(() => {
      const elapsed = (performance.now() - startedAt) % CYCLE_MS;
      const progress = elapsed >= CYCLE_MS - 40 ? 1 : elapsed / CYCLE_MS;
      cards.forEach(card => {
        const node = card.querySelector('.sleep-time');
        const bar = card.querySelector('.progress span');
        const total = Number(node.dataset.duration);
        const minutes = Math.min(total, Math.floor(progress * total));
        node.textContent = `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
        bar.style.width = `${progress * 100}%`;
      });
    }, 40);
  }

  function showScreen(name) {
    stopTimers();
    screens.forEach(screen => screen.classList.remove('country-departing', 'detail-arriving'));
    const previous = screens.find(screen => screen.id === activeScreen);
    const next = document.getElementById(name);
    if (!next) return;
    const countryEntry = activeScreen === 'countries' && ['japan', 'kuwait', 'mexico'].includes(name);
    if (countryEntry) {
      const countries = document.getElementById('countries');
      const origin = countrySelectionOrigin || { x: window.innerWidth * .5, y: window.innerHeight * .5 };
      const x = `${(origin.x / window.innerWidth) * 100}%`;
      const y = `${(origin.y / window.innerHeight) * 100}%`;
      countries.style.setProperty('--launch-x', x);
      countries.style.setProperty('--launch-y', y);
      next.style.setProperty('--launch-x', x);
      next.style.setProperty('--launch-y', y);
      countries.classList.add('country-departing');
      next.classList.add('detail-arriving');
    }
    screens.forEach(screen => {
      screen.inert = screen !== next;
      screen.setAttribute('aria-hidden', screen === next ? 'false' : 'true');
      if (screen !== next && screen !== previous) screen.classList.remove('active', 'leaving');
    });
    if (previous && previous !== next) {
      previous.classList.add('leaving');
      previous.classList.remove('active');
      window.setTimeout(() => previous.classList.remove('leaving'), countryEntry ? 1300 : 900);
    }
    next.classList.remove('leaving');
    next.classList.add('active');
    activeScreen = name;

    if (countryEntry) {
      navigationTimer = window.setTimeout(() => {
        document.getElementById('countries').classList.remove('country-departing');
        next.classList.remove('detail-arriving');
        navigationTimer = null;
      }, 1350);
      countrySelectionOrigin = null;
    }

    if (name === 'countries') startCounters();
    if (name === 'home') {
      resetCounters();
      document.querySelectorAll('.country-grid button').forEach(button => button.classList.remove('chosen'));
      document.querySelector('.japan').classList.remove('transitioning');
      document.querySelector('.kuwait').classList.remove('transitioning');
      document.querySelector('.mexico').classList.remove('transitioning');
      experience.classList.remove('clouding');
    }
  }

  function transitionToFinal() {
    if (activeScreen !== 'japan' && activeScreen !== 'kuwait' && activeScreen !== 'mexico') return;
    const detailScreen = document.getElementById(activeScreen);
    if (detailScreen.classList.contains('transitioning')) return;
    detailScreen.classList.add('transitioning');
    // Keep the selected country visible while its cloud layer expands.
    transitionTimer = setTimeout(() => {
      transitionTimer = null;
      showScreen('final');
      const finale = document.getElementById('final');
      finale.classList.add('arriving');
      experience.classList.add('clouding');
      setTimeout(() => {
        finale.classList.remove('arriving');
        experience.classList.remove('clouding');
        detailScreen.classList.remove('transitioning');
      }, 1700);
    }, TRANSITION_MS);
  }

  document.querySelectorAll('[data-go]').forEach(button => {
    button.addEventListener('click', () => showScreen(button.dataset.go));
  });
  document.querySelectorAll('[data-detail-next]').forEach(button => {
    button.addEventListener('click', transitionToFinal);
  });

  let countrySelectionOrigin = null;
  function chooseCountry(country, originElement = null) {
    document.querySelectorAll('.country-grid button').forEach(button => {
      button.classList.toggle('chosen', button.dataset.country === country);
    });
    if (originElement) {
      const rect = originElement.getBoundingClientRect();
      countrySelectionOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    if (country === 'Japón') showScreen('japan');
    if (country === 'Kuwait') showScreen('kuwait');
    if (country === 'México') showScreen('mexico');
  }
  document.querySelectorAll('[data-select]').forEach(element => {
    element.addEventListener('click', event => {
      event.stopPropagation();
      chooseCountry(element.dataset.select, element);
    });
    if (element.classList.contains('country-card')) {
      element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          chooseCountry(element.dataset.select, element);
        }
      });
    }
  });
  document.querySelectorAll('.country-grid button').forEach(button => {
    button.addEventListener('click', () => chooseCountry(button.dataset.country, button));
  });

  showScreen('home');
})();
