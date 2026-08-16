/**
 * ReciclApp — lógica do perfil Usuário (coleta esporádica pessoal).
 */

const ReciclUsuario = (() => {
  const { el, formatKg, formatPercent, generateId, generateProtocol } = ReciclUtils;
  const STEP_DESCRIPTIONS = {
    ...ReciclData.STATUS_STEP_DESCRIPTIONS,
    solicitada: 'Estamos procurando um catador próximo.',
  };

  const draft = {
    materials: new Set(),
    quantity: null,
    photos: [],
    address: '',
    complement: '',
    observation: '',
  };

  const autoTimers = new Map();
  let activeTrackingId = null;

  function resetDraft() {
    draft.materials = new Set();
    draft.quantity = null;
    draft.photos = [];
    draft.address = '';
    draft.complement = '';
    draft.observation = '';
  }

  function estimateWeightFromQuantity(quantityId) {
    const ranges = { pequena: [2, 5], media: [6, 20], grande: [21, 40] };
    const [min, max] = ranges[quantityId] || [4, 18];
    return Math.round((min + Math.random() * (max - min)) * 10) / 10;
  }

  // ---------- Tela: Início ----------
  function renderHome() {
    const user = ReciclState.appState.currentUser;
    document.querySelector('[data-role="user-greeting"]').textContent = `Olá, ${user?.name || 'visitante'}! 👋`;
    const list = document.getElementById('user-home-collections');
    const collections = ReciclState.getCollectionsByProfile('usuario').slice(0, 3);
    ReciclComponents.renderCollectionList(list, collections, {
      onClick: (collection) => openCollection(collection),
      empty: {
        title: 'Nenhuma coleta ainda',
        text: 'Quando você solicitar uma coleta, ela aparecerá aqui.',
        actionLabel: 'Solicitar coleta',
        onAction: () => { resetDraft(); ReciclRouter.navigate('user-materials'); },
      },
    });
  }

  function openCollection(collection) {
    if (collection.status === 'concluida') {
      ReciclRouter.navigate('user-result', { id: collection.id });
    } else {
      ReciclRouter.navigate('user-tracking', { id: collection.id });
    }
  }

  // ---------- Tela: Materiais ----------
  function renderMaterials() {
    const grid = document.getElementById('user-materials-grid');
    ReciclComponents.renderMaterialChipGrid(grid, draft.materials, (materialId) => {
      if (draft.materials.has(materialId)) draft.materials.delete(materialId);
      else draft.materials.add(materialId);
      renderMaterials();
    });
    document.getElementById('user-materials-error').style.display = 'none';
  }

  function goToQuantity() {
    if (draft.materials.size === 0) {
      document.getElementById('user-materials-error').style.display = 'block';
      return;
    }
    ReciclRouter.navigate('user-quantity');
  }

  // ---------- Tela: Quantidade ----------
  function renderQuantity() {
    const container = document.getElementById('user-quantity-options');
    ReciclComponents.renderOptionList(container, ReciclData.QUANTITY_OPTIONS, draft.quantity, (optionId) => {
      draft.quantity = optionId;
      renderQuantity();
    });
  }

  function goToPhotos() {
    if (!draft.quantity) {
      ReciclComponents.showToast('Selecione uma quantidade estimada.', 'error');
      return;
    }
    ReciclRouter.navigate('user-photos');
  }

  // ---------- Tela: Fotos do material ----------
  function renderPhotos() {
    ReciclPhotos.createField(document.getElementById('user-photos-field'), {
      photos: draft.photos,
      hint: 'Até 3 fotos — mostram o volume, a condição e como o material está acondicionado.',
    });
  }

  function goToLocation() {
    ReciclRouter.navigate('user-location');
  }

  // ---------- Tela: Local ----------
  function useMyLocation() {
    document.getElementById('user-address').value = 'Rua das Palmeiras, 123 — Porto Velho/RO';
    ReciclComponents.showToast('Localização preenchida (simulada).', 'info');
  }

  function handleLocationSubmit(event) {
    event.preventDefault();
    const addressField = document.getElementById('user-address');
    const addressFieldWrap = addressField.closest('.field');
    if (!addressField.value.trim()) {
      addressFieldWrap.classList.add('has-error');
      addressField.focus();
      return;
    }
    addressFieldWrap.classList.remove('has-error');
    draft.address = addressField.value.trim();
    draft.complement = document.getElementById('user-complement').value.trim();
    draft.observation = document.getElementById('user-observation').value.trim();
    ReciclRouter.navigate('user-confirm');
  }

  // ---------- Tela: Confirmação ----------
  function renderConfirm() {
    const summary = document.getElementById('user-confirm-summary');
    const materialsLabel = [...draft.materials].map((id) => ReciclData.getMaterialLabel(id)).join(', ');
    const quantityOption = ReciclData.QUANTITY_OPTIONS.find((option) => option.id === draft.quantity);
    summary.innerHTML = '';
    [
      ['Materiais', materialsLabel],
      ['Quantidade', quantityOption?.label || '—'],
      ['Fotos', draft.photos.length ? `${draft.photos.length} registrada(s)` : 'Nenhuma'],
      ['Endereço', draft.address],
      ['Complemento', draft.complement || '—'],
      ['Tipo de coleta', 'Esporádica'],
      ['Observações', draft.observation || '—'],
    ].forEach(([label, value]) => {
      summary.appendChild(el('div', { class: 'summary-row' }, [
        el('dt', { text: label }),
        el('dd', { text: value }),
      ]));
    });

    ReciclPhotos.renderGallery(document.getElementById('user-confirm-photos'), draft.photos, {
      label: 'Fotos do material',
      emptyText: 'Você optou por não enviar fotos.',
    });
  }

  function submitRequest() {
    const button = document.getElementById('user-confirm-submit');
    ReciclComponents.setButtonLoading(button, true, 'Enviando solicitação...');
    setTimeout(() => {
      const collection = ReciclState.addCollection({
        id: generateId('col'),
        protocol: generateProtocol(),
        requesterType: 'usuario',
        requesterName: ReciclState.appState.currentUser?.name || 'Usuário',
        materials: [...draft.materials],
        quantityLabel: ReciclData.QUANTITY_OPTIONS.find((option) => option.id === draft.quantity)?.label,
        quantityId: draft.quantity,
        address: draft.address,
        complement: draft.complement,
        observation: draft.observation,
        photosOrigin: [...draft.photos],
        status: 'solicitada',
        date: new Date().toISOString().slice(0, 10),
      });
      ReciclComponents.setButtonLoading(button, false);
      ReciclComponents.showToast('Coleta solicitada com sucesso.', 'success');
      resetDraft();
      activeTrackingId = collection.id;
      ReciclRouter.navigate('user-tracking', { id: collection.id, replace: true });
    }, 900);
  }

  // ---------- Tela: Acompanhamento ----------
  function scheduleAutoProgress(collectionId) {
    if (autoTimers.has(collectionId)) return;
    const timers = [];
    timers.push(setTimeout(() => {
      const collection = ReciclState.getCollection(collectionId);
      if (!collection || collection.status !== 'solicitada') return;
      const collector = ReciclData.COLLECTORS[Math.floor(Math.random() * ReciclData.COLLECTORS.length)];
      ReciclState.updateCollection(collectionId, {
        status: 'catador_encontrado',
        collectorName: collector.name,
        collectorRating: collector.rating,
        distanceKm: (1 + Math.random() * 3).toFixed(1),
        etaMin: 12 + Math.floor(Math.random() * 15),
      });
      ReciclState.addNotification({ profile: 'usuario', title: `${collector.name} aceitou sua coleta`, body: 'Acompanhe o andamento na tela de coleta.' });
      ReciclComponents.showToast(`${collector.name} aceitou sua coleta.`, 'success');
      if (ReciclRouter.getActiveScreen() === 'user-tracking' && activeTrackingId === collectionId) renderTracking({ id: collectionId });
    }, 3200));

    timers.push(setTimeout(() => {
      const collection = ReciclState.getCollection(collectionId);
      if (!collection || collection.status !== 'catador_encontrado') return;
      ReciclState.updateCollection(collectionId, { status: 'em_andamento' });
      if (ReciclRouter.getActiveScreen() === 'user-tracking' && activeTrackingId === collectionId) renderTracking({ id: collectionId });
    }, 6600));

    timers.push(setTimeout(() => {
      const collection = ReciclState.getCollection(collectionId);
      if (!collection || collection.status !== 'em_andamento') return;
      const weight = estimateWeightFromQuantity(collection.quantityId);
      const quality = 86 + Math.floor(Math.random() * 11);
      ReciclState.updateCollection(collectionId, { status: 'concluida', weightFinal: weight, quality });
      ReciclState.addNotification({ profile: 'usuario', title: 'Coleta concluída', body: `${formatKg(weight)} coletados com ${formatPercent(quality)} de qualidade.` });
      ReciclComponents.showToast('Coleta concluída!', 'success');
      if (ReciclRouter.getActiveScreen() === 'user-tracking' && activeTrackingId === collectionId) renderTracking({ id: collectionId });
    }, 10200));

    autoTimers.set(collectionId, timers);
  }

  function renderTracking(params) {
    if (params && params.id) activeTrackingId = params.id;
    const collection = ReciclState.getCollection(activeTrackingId);
    const statusCard = document.getElementById('user-tracking-status');
    const timelineEl = document.getElementById('user-tracking-timeline');
    document.querySelector('[data-role="user-tracking-protocol"]').textContent = collection ? `Coleta #${collection.protocol}` : 'Coleta';

    if (!collection) {
      ReciclComponents.renderEmptyState(statusCard, { title: 'Coleta não encontrada', text: 'Volte e solicite uma nova coleta.', icon: 'empty' });
      timelineEl.innerHTML = '';
      return;
    }

    statusCard.innerHTML = '';
    statusCard.appendChild(ReciclComponents.statusBadge(collection.status));
    statusCard.appendChild(el('p', { class: 'text-sm', style: 'margin-top:8px', text: STEP_DESCRIPTIONS[collection.status] }));

    if (collection.status === 'catador_encontrado' || collection.status === 'em_andamento') {
      statusCard.appendChild(el('div', { class: 'card-row', style: 'margin-top:8px' }, [
        el('div', { class: 'card-row', style: 'gap:10px' }, [
          el('span', { class: 'avatar avatar-sm', text: collection.collectorName?.charAt(0) || '?' }),
          el('div', {}, [
            el('div', { class: 'text-sm', style: 'font-weight:600', text: collection.collectorName }),
            el('div', { class: 'text-xs text-muted', text: `⭐ ${collection.collectorRating} · ${collection.distanceKm} km` }),
          ]),
        ]),
        el('span', { class: 'text-xs text-muted', text: `chegada ≈ ${collection.etaMin} min` }),
      ]));
    }

    if (collection.status === 'concluida') {
      statusCard.appendChild(el('button', {
        class: 'btn btn-primary btn-auto',
        type: 'button',
        style: 'margin-top:12px',
        text: 'Ver resultado',
        onClick: () => ReciclRouter.navigate('user-result', { id: collection.id }),
      }));
    }

    ReciclComponents.renderTimeline(timelineEl, ReciclData.buildCollectionTimelineSteps(collection.status));
    ReciclPhotos.renderComparison(document.getElementById('user-tracking-photos'), collection);

    if (collection.status !== 'concluida') {
      scheduleAutoProgress(collection.id);
    }
  }

  // ---------- Tela: Resultado ----------
  function renderResult(params) {
    const collection = ReciclState.getCollection(params?.id || activeTrackingId);
    document.querySelector('[data-role="user-result-weight"]').textContent = collection?.weightFinal ? formatKg(collection.weightFinal) : '—';
    document.querySelector('[data-role="user-result-quality"]').textContent = collection?.quality ? formatPercent(collection.quality) : '—';
  }

  // ---------- Tela: Lista de coletas ----------
  function renderCollectionsList() {
    const container = document.getElementById('user-collections-list');
    ReciclComponents.renderCollectionList(container, ReciclState.getCollectionsByProfile('usuario'), {
      onClick: (collection) => openCollection(collection),
      empty: {
        title: 'Nenhuma coleta ainda',
        text: 'Quando você solicitar uma coleta, ela aparecerá aqui.',
        actionLabel: 'Solicitar coleta',
        onAction: () => { resetDraft(); ReciclRouter.navigate('user-materials'); },
      },
    });
  }

  // ---------- Tela: Impacto ----------
  function renderImpact() {
    const done = ReciclState.getCollectionsByProfile('usuario').filter((c) => c.status === 'concluida');
    const totalKg = done.reduce((sum, c) => sum + (c.weightFinal || 0), 0);
    const avgQuality = done.length ? Math.round(done.reduce((sum, c) => sum + (c.quality || 0), 0) / done.length) : 0;
    const collectors = new Set(done.map((c) => c.collectorName).filter(Boolean));

    ReciclComponents.renderKpis(document.getElementById('user-impact-kpis'), [
      { value: formatKg(totalKg), label: 'Reciclados' },
      { value: done.length ? formatPercent(avgQuality) : '—', label: 'Qualidade média' },
      { value: done.length, label: 'Coletas concluídas' },
      { value: collectors.size, label: 'Catadores beneficiados' },
    ]);

    const counts = {};
    done.forEach((c) => (c.materials || []).forEach((m) => { counts[m] = (counts[m] || 0) + 1; }));
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    const distribution = Object.entries(counts).map(([id, count]) => ({
      label: ReciclData.getMaterialLabel(id),
      pct: Math.round((count / total) * 100),
    }));
    const materialsContainer = document.getElementById('user-impact-materials');
    if (distribution.length) {
      ReciclComponents.renderMaterialBars(materialsContainer, distribution);
    } else {
      ReciclComponents.renderEmptyState(materialsContainer, { title: 'Sem dados ainda', text: 'Conclua uma coleta para ver seus materiais aqui.', icon: 'empty' });
    }
  }

  // ---------- Tela: Perfil ----------
  function renderProfile() {
    const user = ReciclState.appState.currentUser;
    document.querySelector('[data-role="user-profile-name"]').textContent = user?.name || 'Usuário';
    document.querySelector('[data-role="user-avatar"]').textContent = (user?.name || 'U').charAt(0).toUpperCase();
  }

  function init() {
    ReciclRouter.onEnter('user-home', renderHome);
    ReciclRouter.onEnter('user-materials', renderMaterials);
    ReciclRouter.onEnter('user-quantity', renderQuantity);
    ReciclRouter.onEnter('user-photos', renderPhotos);
    ReciclRouter.onEnter('user-confirm', renderConfirm);
    ReciclRouter.onEnter('user-tracking', renderTracking);
    ReciclRouter.onEnter('user-result', renderResult);
    ReciclRouter.onEnter('user-collections', renderCollectionsList);
    ReciclRouter.onEnter('user-impact', renderImpact);
    ReciclRouter.onEnter('user-profile', renderProfile);

    document.getElementById('user-location-form').addEventListener('submit', handleLocationSubmit);
    document.getElementById('user-confirm-submit').addEventListener('click', submitRequest);
  }

  return { init, resetDraft, goToQuantity, goToPhotos, goToLocation, useMyLocation };
})();
