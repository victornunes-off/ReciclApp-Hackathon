/**
 * ReciclApp — inicialização geral, autenticação simulada e modo demonstração.
 */

(() => {
  const { el, isValidEmail } = ReciclUtils;

  const PROFILE_LABELS = { empresa: 'empresa', catador: 'catador' };
  const PROFILE_HOME_SCREEN = { empresa: 'empresa-dashboard', catador: 'catador-home' };
  const DEMO_PERSONAS = {
    empresa: { name: 'Ricardo Alves', orgName: 'Empresa Verde Ltda.', email: 'contato@empresaverde.com' },
    catador: { name: 'João da Silva', email: 'joao.silva@email.com' },
  };

  let pendingProfile = 'empresa';

  function toggleFieldError(field, hasError) {
    const wrap = field.closest('.field');
    if (wrap) wrap.classList.toggle('has-error', hasError);
  }

  // ---------- Seleção de perfil / login ----------
  function selectProfile(profile) {
    pendingProfile = profile;
    document.querySelector('[data-role="login-profile-label"]').textContent = PROFILE_LABELS[profile];
    document.querySelector('[data-role="login-org-field"]').hidden = profile !== 'empresa';

    const form = document.getElementById('login-form');
    form.reset();
    form.querySelectorAll('.field').forEach((field) => field.classList.remove('has-error'));

    if (ReciclState.appState.demoModeActive) {
      const persona = DEMO_PERSONAS[profile];
      document.getElementById('login-name').value = persona.name;
      document.getElementById('login-email').value = persona.email;
      document.getElementById('login-password').value = 'demo1234';
      if (profile === 'empresa') document.getElementById('login-org').value = persona.orgName;
    }

    ReciclRouter.navigate('login');
  }

  function handleLoginSubmit(event, options = {}) {
    if (event) event.preventDefault();
    const nameField = document.getElementById('login-name');
    const emailField = document.getElementById('login-email');
    const passwordField = document.getElementById('login-password');

    let valid = true;
    toggleFieldError(nameField, !nameField.value.trim());
    if (!nameField.value.trim()) valid = false;

    toggleFieldError(emailField, !isValidEmail(emailField.value));
    if (!isValidEmail(emailField.value)) valid = false;

    if (!options.skipPassword) {
      toggleFieldError(passwordField, passwordField.value.length < 4);
      if (passwordField.value.length < 4) valid = false;
    }

    if (!valid) return;

    const user = { name: nameField.value.trim() };
    if (pendingProfile === 'empresa') {
      const orgField = document.getElementById('login-org');
      user.orgName = orgField.value.trim() || user.name;
    }

    ReciclState.setProfile(pendingProfile, user);
    ReciclRouter.resetHistory();
    ReciclComponents.showToast(`Bem-vindo(a), ${user.name.split(' ')[0]}!`, 'success');
    ReciclRouter.navigate(PROFILE_HOME_SCREEN[pendingProfile], { profile: pendingProfile, replace: true });
  }

  function logout() {
    ReciclState.setProfile(null, null);
    ReciclRouter.resetHistory();
    ReciclRouter.navigate('splash', { profile: null, replace: true });
  }

  function startDemo() {
    ReciclState.seedDemoData();
    const persona = DEMO_PERSONAS.empresa;
    ReciclState.setProfile('empresa', { name: persona.name, orgName: persona.orgName });
    ReciclRouter.resetHistory();
    ReciclComponents.showToast('Modo demonstração ativado — você está como Empresa Verde Ltda.', 'success');
    ReciclRouter.navigate('empresa-dashboard', { profile: 'empresa', replace: true });
  }

  // ---------- Notificações ----------
  function renderNotifications() {
    const profile = ReciclState.appState.currentProfile;
    if (!profile) return;
    ReciclComponents.renderNotificationList(document.getElementById('notifications-list'), ReciclState.getNotificationsByProfile(profile));
    ReciclState.markNotificationsRead(profile);
  }

  function updateNotifIndicators() {
    const profile = ReciclState.appState.currentProfile;
    const unread = profile ? ReciclState.getUnreadCount(profile) : 0;
    document.querySelectorAll('[data-target="notifications"]').forEach((bell) => {
      bell.classList.toggle('notif-dot', unread > 0);
    });
  }

  // ---------- Identificar material (simulação) ----------
  function handleClassifyChange(event) {
    const file = event.target.files[0];
    const resultEl = document.getElementById('classify-result');
    if (!file) {
      resultEl.hidden = true;
      return;
    }

    const sample = ReciclData.CLASSIFICATION_SAMPLES[Math.floor(Math.random() * ReciclData.CLASSIFICATION_SAMPLES.length)];
    const reader = new FileReader();
    reader.onload = () => {
      resultEl.innerHTML = '';
      resultEl.hidden = false;
      resultEl.appendChild(el('div', { class: 'card' }, [
        el('img', { src: reader.result, alt: 'Foto selecionada para identificação', style: 'width:100%;max-height:180px;object-fit:cover;border-radius:var(--radius-md);margin-bottom:var(--space-4)' }),
        el('div', { class: 'card-row' }, [
          el('h3', { text: sample.label, style: 'margin-bottom:0' }),
          el('span', { class: `badge ${sample.recyclable ? 'badge-success' : 'badge-error'}`, text: sample.recyclable ? 'Reciclável' : 'Não reciclável' }),
        ]),
        el('h4', { text: 'Orientações', style: 'margin-top:var(--space-4)' }),
        el('ul', { class: 'stack-tight' }, sample.tips.map((tip) => el('li', { class: 'text-sm text-muted', text: `• ${tip}` }))),
      ]));
    };
    reader.readAsDataURL(file);
  }

  // ---------- Visão geral (pitch de escala) ----------
  function renderOverview() {
    const metrics = ReciclData.OVERVIEW_METRICS;
    ReciclComponents.renderKpis(document.getElementById('overview-kpis'), [
      { value: ReciclUtils.formatKg(metrics.kgRecycled), label: 'Reciclados' },
      { value: ReciclUtils.formatPercent(metrics.avgQuality), label: 'Qualidade média' },
      { value: ReciclUtils.formatNumber(metrics.collections), label: 'Coletas' },
      { value: ReciclUtils.formatNumber(metrics.activeCollectors), label: 'Catadores ativos' },
      { value: ReciclUtils.formatNumber(metrics.companies), label: 'Empresas participantes' },
      { value: ReciclUtils.formatNumber(metrics.events), label: 'Eventos atendidos' },
    ]);
    ReciclComponents.renderMaterialBars(document.getElementById('overview-materials'), ReciclData.MATERIAL_DISTRIBUTION);
  }

  // ---------- Mapa de ações (delegação de eventos) ----------
  const actions = {
    'select-profile': (targetEl) => selectProfile(targetEl.dataset.profile),
    'start-demo': () => startDemo(),
    'logout': () => logout(),
    'back': () => ReciclRouter.back('splash'),
    'close-modal': (targetEl) => ReciclComponents.closeModal(targetEl.dataset.modal),
    'submit-login-as-guest': () => handleLoginSubmit(null, { skipPassword: true }),
    'view-report': () => ReciclEmpresa.viewReport(),
    'simulate-export': () => ReciclEmpresa.simulateExport(),
    'navigate': (targetEl) => {
      ReciclRouter.navigate(targetEl.dataset.target);
    },
  };

  function handleDelegatedClick(event) {
    const targetEl = event.target.closest('[data-action]');
    if (!targetEl) return;
    const handler = actions[targetEl.dataset.action];
    if (handler) handler(targetEl, event);
  }

  function init() {
    ReciclRouter.init();
    ReciclState.ensureLoaded();

    ReciclPhotos.init();
    ReciclEmpresa.init();
    ReciclCatador.init();

    ReciclRouter.onEnter('notifications', renderNotifications);
    ReciclRouter.onEnter('classify', () => { document.getElementById('classify-result').hidden = true; });
    ReciclRouter.onEnter('overview', renderOverview);
    ReciclRouter.onAfterNavigate(updateNotifIndicators);

    document.addEventListener('click', handleDelegatedClick);
    document.getElementById('login-form').addEventListener('submit', (event) => handleLoginSubmit(event));
    document.getElementById('classify-input').addEventListener('change', handleClassifyChange);

    const { currentProfile } = ReciclState.appState;
    if (currentProfile && PROFILE_HOME_SCREEN[currentProfile]) {
      ReciclRouter.navigate(PROFILE_HOME_SCREEN[currentProfile], { profile: currentProfile, replace: true });
    } else {
      // Perfil ausente ou descontinuado (ex.: sessão antiga de "usuario"): limpa e volta ao início.
      if (currentProfile) ReciclState.setProfile(null, null);
      ReciclRouter.navigate('splash', { profile: null, replace: true });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
