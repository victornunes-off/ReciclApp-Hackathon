/**
 * ReciclApp — roteador de telas (SPA simples baseada em exibição condicional).
 * Cada tela é um elemento <section class="screen" id="screen-<nome>">.
 */

const ReciclRouter = (() => {
  const history = [];
  const enterHandlers = {};
  const afterNavigateHandlers = [];
  let activeScreen = null;
  let appShellEl = null;

  function init() {
    appShellEl = document.querySelector('.app-shell');
  }

  function onEnter(screenName, handler) {
    enterHandlers[screenName] = handler;
  }

  function getScreenEl(screenName) {
    return document.getElementById(`screen-${screenName}`);
  }

  function updateNavHighlight(screenName) {
    document.querySelectorAll('[data-nav-target]').forEach((navItem) => {
      const isActive = navItem.getAttribute('data-nav-target') === screenName;
      navItem.classList.toggle('is-active', isActive);
      if (navItem.hasAttribute('aria-current')) {
        if (isActive) navItem.setAttribute('aria-current', 'page');
        else navItem.removeAttribute('aria-current');
      }
    });
  }

  function updateAuthenticatedFrame(profile) {
    if (!appShellEl) return;
    appShellEl.setAttribute('data-authenticated', profile ? 'true' : 'false');
    appShellEl.setAttribute('data-profile', profile || '');
  }

  function navigate(screenName, params = {}) {
    const target = getScreenEl(screenName);
    if (!target) {
      console.warn(`Tela não encontrada: ${screenName}`);
      return;
    }

    if (activeScreen && activeScreen !== screenName && !params.replace) {
      history.push(activeScreen);
    }

    document.querySelectorAll('.screen.is-active').forEach((screenEl) => {
      screenEl.classList.remove('is-active');
    });
    target.classList.add('is-active');
    activeScreen = screenName;

    updateNavHighlight(screenName);
    if (params.profile !== undefined) {
      updateAuthenticatedFrame(params.profile);
    }

    if (typeof enterHandlers[screenName] === 'function') {
      enterHandlers[screenName](params);
    }

    const main = document.querySelector('.app-main');
    if (main) main.scrollTop = 0;
    window.scrollTo(0, 0);

    afterNavigateHandlers.forEach((handler) => handler(screenName));
  }

  function onAfterNavigate(handler) {
    afterNavigateHandlers.push(handler);
  }

  function back(fallbackScreen) {
    const previous = history.pop();
    if (previous) {
      navigate(previous, { replace: true });
    } else if (fallbackScreen) {
      navigate(fallbackScreen, { replace: true });
    }
  }

  function resetHistory() {
    history.length = 0;
  }

  function getActiveScreen() {
    return activeScreen;
  }

  return {
    init,
    onEnter,
    onAfterNavigate,
    navigate,
    back,
    resetHistory,
    getActiveScreen,
    updateAuthenticatedFrame,
  };
})();
