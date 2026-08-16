/**
 * ReciclApp — lógica do perfil Catador (oportunidades, coleta e ganhos).
 */

const ReciclCatador = (() => {
  const { el, formatKg, formatPercent, formatDate, formatCurrencyBR, generateId } = ReciclUtils;

  let activeDetailId = null;
  let selectedQuality = 'excelente';
  let pickupPhotos = [];

  function currentName() {
    return ReciclState.appState.currentUser?.name || 'Catador';
  }

  function availableOpportunities() {
    return ReciclState.appState.collections.filter((c) => c.status === 'solicitada' && !c.isBulkQuote);
  }

  function myCollections() {
    return ReciclState.appState.collections.filter((c) => c.collectorName === currentName());
  }

  // ---------- Início ----------
  function renderHome() {
    document.querySelector('[data-role="catador-greeting"]').textContent = `Olá, ${currentName()}! 👋`;

    const toggle = document.getElementById('catador-availability-toggle');
    const isAvailable = ReciclState.appState.collectorAvailable;
    toggle.setAttribute('aria-checked', String(isAvailable));

    const list = document.getElementById('catador-opportunities-list');
    if (!isAvailable) {
      ReciclComponents.renderEmptyState(list, {
        title: 'Você está indisponível',
        text: 'Ative "Disponível para coletas" para ver novas oportunidades.',
        icon: 'info',
      });
      return;
    }

    const opportunities = availableOpportunities();
    list.innerHTML = '';
    if (!opportunities.length) {
      ReciclComponents.renderEmptyState(list, {
        title: 'Nenhuma oportunidade no momento',
        text: 'Assim que alguém solicitar uma coleta próxima, ela aparecerá aqui.',
        icon: 'empty',
      });
      return;
    }

    opportunities.forEach((collection) => {
      const materialsLabel = (collection.materials || []).map((id) => ReciclData.getMaterialLabel(id)).join(' + ');
      list.appendChild(el('button', { class: 'collection-card card-clickable', type: 'button', onClick: () => ReciclRouter.navigate('catador-detail', { id: collection.id }) }, [
        el('div', { class: 'collection-card-top' }, [
          el('div', {}, [
            el('div', { class: 'collection-card-title', text: collection.requesterName }),
            el('div', { class: 'collection-card-meta', text: materialsLabel || 'Materiais diversos' }),
          ]),
          el('span', { class: 'badge badge-turquesa', text: `${(1 + Math.random() * 3).toFixed(1)} km` }),
        ]),
        el('div', { class: 'collection-card-meta', text: `${collection.quantityLabel || 'Estimativa a confirmar'} · #${collection.protocol}` }),
      ]));
    });
  }

  function toggleAvailability() {
    const next = !ReciclState.appState.collectorAvailable;
    ReciclState.setCollectorAvailability(next);
    renderHome();
  }

  // ---------- Detalhes da coleta ----------
  function renderDetail(params) {
    if (params && params.id) activeDetailId = params.id;
    const collection = ReciclState.getCollection(activeDetailId);
    const card = document.getElementById('catador-detail-card');
    const actionBtn = document.getElementById('catador-detail-action');
    document.querySelector('[data-role="catador-detail-protocol"]').textContent = collection ? `Coleta #${collection.protocol}` : 'Coleta';

    if (!collection) {
      ReciclComponents.renderEmptyState(card, { title: 'Coleta não encontrada', text: 'Volte para a lista de oportunidades.', icon: 'empty' });
      document.getElementById('catador-detail-photos').innerHTML = '';
      actionBtn.hidden = true;
      return;
    }

    ReciclPhotos.renderGallery(document.getElementById('catador-detail-photos'), collection.photosOrigin, {
      label: 'Fotos enviadas na solicitação',
      emptyText: 'Quem solicitou não enviou fotos do material.',
    });

    const materialsLabel = (collection.materials || []).map((id) => ReciclData.getMaterialLabel(id)).join(', ');
    card.innerHTML = '';
    card.appendChild(el('h3', { text: collection.requesterName }));
    [
      ['Local', collection.address || '—'],
      ['Materiais', materialsLabel || '—'],
      ['Estimativa', collection.quantityLabel || '—'],
      ['Data', formatDate(collection.date)],
    ].forEach(([label, value]) => {
      card.appendChild(el('div', { class: 'summary-row' }, [el('dt', { text: label }), el('dd', { text: value })]));
    });

    actionBtn.hidden = false;
    actionBtn.onclick = null;
    if (collection.status === 'solicitada') {
      actionBtn.textContent = 'Aceitar coleta';
      actionBtn.className = 'btn btn-primary';
      actionBtn.onclick = () => acceptCollection(collection.id);
    } else if (collection.status === 'catador_encontrado' && collection.collectorName === currentName()) {
      actionBtn.textContent = 'Iniciar coleta';
      actionBtn.className = 'btn btn-secondary';
      actionBtn.onclick = () => startCollection(collection.id);
    } else if (collection.status === 'em_andamento' && collection.collectorName === currentName()) {
      actionBtn.textContent = 'Registrar coleta';
      actionBtn.className = 'btn btn-primary';
      actionBtn.onclick = () => ReciclRouter.navigate('catador-register', { id: collection.id });
    } else if (collection.status === 'concluida') {
      actionBtn.textContent = 'Ver resultado';
      actionBtn.className = 'btn btn-outline';
      actionBtn.onclick = () => ReciclRouter.navigate('catador-result', { id: collection.id });
    } else {
      actionBtn.hidden = true;
    }
  }

  function acceptCollection(id) {
    ReciclState.updateCollection(id, {
      status: 'catador_encontrado',
      collectorName: currentName(),
      distanceKm: (1 + Math.random() * 3).toFixed(1),
      etaMin: 12 + Math.floor(Math.random() * 15),
    });
    const collection = ReciclState.getCollection(id);
    ReciclState.addNotification({ profile: collection.requesterType, title: `${currentName()} aceitou sua coleta`, body: `Coleta #${collection.protocol} está a caminho.` });
    ReciclComponents.showToast('Coleta aceita! Ela foi adicionada às suas coletas.', 'success');
    renderDetail();
  }

  function startCollection(id) {
    ReciclState.updateCollection(id, { status: 'em_andamento' });
    ReciclComponents.showToast('Coleta em andamento.', 'info');
    renderDetail();
  }

  // ---------- Registrar coleta ----------
  function renderQualityOptions() {
    ReciclComponents.renderOptionList(document.getElementById('reg-quality-options'), ReciclData.QUALITY_LEVELS, selectedQuality, (id) => {
      selectedQuality = id;
      renderQualityOptions();
    });
  }

  function renderRegisterForm() {
    document.getElementById('catador-register-form').reset();
    selectedQuality = 'excelente';
    renderQualityOptions();

    pickupPhotos = [];
    document.getElementById('reg-photos-error').style.display = 'none';
    ReciclPhotos.createField(document.getElementById('reg-photos-field'), {
      photos: pickupPhotos,
      hint: 'Comprove o material recolhido: qualidade, volume e acondicionamento.',
      onChange: (photos) => {
        if (photos.length) document.getElementById('reg-photos-error').style.display = 'none';
      },
    });

    // Referência: o que foi fotografado na origem
    const collection = ReciclState.getCollection(activeDetailId);
    ReciclPhotos.renderGallery(document.getElementById('reg-origin-photos'), collection?.photosOrigin, {
      label: 'Referência — foto da solicitação',
      emptyText: 'Sem foto de referência para esta coleta.',
    });
  }

  function handleRegisterSubmit(event) {
    event.preventDefault();
    const weightField = document.getElementById('reg-weight');
    const weight = Number(weightField.value);
    const wrap = weightField.closest('.field');

    const hasWeightError = !weight || weight <= 0;
    wrap.classList.toggle('has-error', hasWeightError);

    // A foto é a evidência que valida o índice de qualidade — por isso é obrigatória aqui.
    const photosError = document.getElementById('reg-photos-error');
    photosError.style.display = pickupPhotos.length ? 'none' : 'block';

    if (hasWeightError) { weightField.focus(); return; }
    if (!pickupPhotos.length) {
      ReciclComponents.showToast('Registre ao menos uma foto do material coletado.', 'error');
      return;
    }

    const qualityLevel = ReciclData.QUALITY_LEVELS.find((level) => level.id === selectedQuality) || ReciclData.QUALITY_LEVELS[0];
    const collection = ReciclState.updateCollection(activeDetailId, {
      status: 'concluida',
      weightFinal: weight,
      quality: qualityLevel.pct,
      qualityLabel: qualityLevel.label,
      photosPickup: [...pickupPhotos],
      collectionNotes: document.getElementById('reg-notes').value.trim(),
    });

    ReciclState.addNotification({
      profile: collection.requesterType,
      title: 'Coleta concluída',
      body: `${formatKg(weight)} coletados com ${formatPercent(qualityLevel.pct)} de qualidade.`,
    });
    ReciclComponents.showToast('Coleta registrada com sucesso!', 'success');
    ReciclRouter.navigate('catador-result', { id: collection.id, replace: true });
  }

  // ---------- Resultado ----------
  function renderResult(params) {
    const collection = ReciclState.getCollection(params?.id || activeDetailId);
    const weight = collection?.weightFinal || 0;
    const quality = collection?.quality || 0;
    const value = weight * 0.45 * (0.7 + quality / 200);

    document.querySelector('[data-role="catador-result-weight"]').textContent = weight ? formatKg(weight) : '—';
    document.querySelector('[data-role="catador-result-quality"]').textContent = quality ? formatPercent(quality) : '—';
    document.querySelector('[data-role="catador-result-value"]').textContent = weight ? formatCurrencyBR(value) : '—';
  }

  // ---------- Lista de coletas do catador ----------
  function renderCollectionsList() {
    const container = document.getElementById('catador-collections-list');
    const collections = myCollections().filter((c) => c.status !== 'solicitada');
    ReciclComponents.renderCollectionList(container, collections, {
      onClick: (collection) => {
        if (collection.status === 'concluida') ReciclRouter.navigate('catador-result', { id: collection.id });
        else ReciclRouter.navigate('catador-detail', { id: collection.id });
      },
      empty: {
        title: 'Nenhuma coleta aceita ainda',
        text: 'Aceite uma oportunidade na tela de início para começar.',
        actionLabel: 'Ver oportunidades',
        onAction: () => ReciclRouter.navigate('catador-home'),
      },
    });
  }

  // ---------- Ganhos ----------
  function renderEarnings() {
    const done = myCollections().filter((c) => c.status === 'concluida');
    const baseline = ReciclData.CATADOR_BASELINE;
    const totalKg = baseline.kg + done.reduce((sum, c) => sum + (c.weightFinal || 0), 0);
    const totalCollections = baseline.collections + done.length;
    const avgQuality = done.length
      ? Math.round((baseline.quality * baseline.collections + done.reduce((sum, c) => sum + (c.quality || 0), 0)) / (baseline.collections + done.length))
      : baseline.quality;

    ReciclComponents.renderKpis(document.getElementById('catador-earnings-kpis'), [
      { value: totalCollections, label: 'Coletas' },
      { value: formatKg(totalKg), label: 'Kg coletados' },
      { value: formatPercent(avgQuality), label: 'Qualidade média' },
    ]);

    ReciclComponents.renderCollectionList(document.getElementById('catador-earnings-history'), done, {
      empty: { title: 'Nenhuma coleta concluída', text: 'Suas coletas finalizadas aparecerão aqui.', icon: 'empty' },
    });
  }

  // ---------- Perfil ----------
  function renderProfile() {
    document.querySelector('[data-role="catador-profile-name"]').textContent = currentName();
    document.querySelector('[data-role="catador-avatar"]').textContent = currentName().charAt(0).toUpperCase();
  }

  function init() {
    ReciclRouter.onEnter('catador-home', renderHome);
    ReciclRouter.onEnter('catador-detail', renderDetail);
    ReciclRouter.onEnter('catador-register', renderRegisterForm);
    ReciclRouter.onEnter('catador-result', renderResult);
    ReciclRouter.onEnter('catador-collections', renderCollectionsList);
    ReciclRouter.onEnter('catador-earnings', renderEarnings);
    ReciclRouter.onEnter('catador-profile', renderProfile);

    document.getElementById('catador-availability-toggle').addEventListener('click', toggleAvailability);
    document.getElementById('catador-register-form').addEventListener('submit', handleRegisterSubmit);
  }

  return { init };
})();
