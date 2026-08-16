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

    renderOpportunityMap(opportunities);

    opportunities.forEach((collection, index) => {
      const materialsLabel = (collection.materials || []).map((id) => ReciclData.getMaterialLabel(id)).join(' + ');
      const sla = ReciclAgenda.getSlaStatus(collection);
      const distance = distanceFor(collection, index);

      list.appendChild(el('button', { class: 'collection-card card-clickable', type: 'button', onClick: () => ReciclRouter.navigate('catador-detail', { id: collection.id }) }, [
        el('div', { class: 'collection-card-top' }, [
          el('div', {}, [
            el('div', { class: 'collection-card-title', text: collection.requesterName }),
            el('div', { class: 'collection-card-meta', text: materialsLabel || 'Materiais diversos' }),
          ]),
          el('span', { class: 'badge badge-turquesa', text: `${distance} km` }),
        ]),
        el('div', { class: 'collection-card-meta', text: `${collection.quantityLabel || 'Estimativa a confirmar'} · #${collection.protocol}` }),
        sla ? el('span', { class: `badge ${sla.tone}`, text: sla.label }) : null,
      ]));
    });
  }

  /** Distância estável por coleta (sem sortear a cada render). */
  function distanceFor(collection, index) {
    const base = [1.8, 2.4, 3.1, 4.2, 5.0];
    return base[index % base.length].toFixed(1);
  }

  /**
   * Mapa estilizado em CSS: posiciona os pontos com coletas abertas e traça a rota
   * do catador até o mais próximo. Sem API externa de mapas.
   */
  function renderOpportunityMap(opportunities) {
    const map = document.getElementById('catador-map');
    map.innerHTML = '';

    // Malha viária simplificada
    [['left:0;right:0;top:46%;height:8px'], ['top:0;bottom:0;left:64%;width:8px'],
     ['left:0;right:0;top:78%;height:6px'], ['top:0;bottom:0;left:26%;width:6px']]
      .forEach(([style]) => map.appendChild(el('span', { class: 'fake-map-road', style })));

    const self = { x: 30, y: 56 };
    const spots = [{ x: 52, y: 34 }, { x: 74, y: 64 }, { x: 40, y: 84 }, { x: 82, y: 26 }];

    if (opportunities.length) {
      // Rota até o ponto mais próximo, em dois segmentos (ruas são ortogonais).
      const target = spots[0];
      map.appendChild(el('span', {
        class: 'fake-map-route',
        style: `left:${Math.min(self.x, target.x)}%;top:${self.y}%;width:${Math.abs(target.x - self.x)}%;height:3px`,
      }));
      map.appendChild(el('span', {
        class: 'fake-map-route',
        style: `left:${target.x}%;top:${Math.min(self.y, target.y)}%;height:${Math.abs(target.y - self.y)}%;width:3px`,
      }));
    }

    map.appendChild(el('span', { class: 'fake-map-pin is-self', style: `left:${self.x}%;top:${self.y}%`, title: 'Você' }));
    opportunities.slice(0, spots.length).forEach((collection, index) => {
      const spot = spots[index];
      map.appendChild(el('span', {
        class: 'fake-map-pin',
        style: `left:${spot.x}%;top:${spot.y}%`,
        title: `${collection.requesterName} — ${distanceFor(collection, index)} km`,
      }));
    });

    map.appendChild(el('span', {
      class: 'fake-map-legend',
      text: opportunities.length
        ? `${opportunities.length} coleta(s) na janela de ${ReciclData.SLA_BUSINESS_DAYS} dias úteis`
        : 'Nenhuma coleta aberta',
    }));
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
    } else if (collection.status === 'retirado' || collection.status === 'validado') {
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
    // A retirada não fecha o ciclo: o material segue para pesagem na organização.
    const collection = ReciclState.updateCollection(activeDetailId, {
      status: 'retirado',
      weightFinal: weight,
      quality: qualityLevel.pct,
      qualityLabel: qualityLevel.label,
      photosPickup: [...pickupPhotos],
      pickedUpAt: new Date().toISOString(),
      collectionNotes: document.getElementById('reg-notes').value.trim(),
    });

    ReciclState.addNotification({
      profile: collection.requesterType,
      title: 'Material retirado',
      body: `${formatKg(weight)} a caminho da organização para pesagem.`,
    });
    ReciclState.addNotification({
      profile: 'organizacao',
      title: 'Material a caminho',
      body: `${collection.collectorName} retirou ${formatKg(weight)} de ${collection.requesterName}.`,
    });
    ReciclComponents.showToast('Retirada registrada! Leve o material à organização.', 'success');
    ReciclRouter.navigate('catador-result', { id: collection.id, replace: true });
  }

  // ---------- Resultado ----------
  function renderResult(params) {
    const collection = ReciclState.getCollection(params?.id || activeDetailId);
    const isValidated = collection?.status === 'validado';
    const weight = (isValidated ? collection.weightValidated : collection?.weightFinal) || 0;
    const quality = collection?.quality || 0;
    const value = weight * 0.45 * (0.7 + quality / 200);

    document.querySelector('[data-role="catador-result-weight"]').textContent = weight ? formatKg(weight) : '—';
    document.querySelector('[data-role="catador-result-quality"]').textContent = quality ? formatPercent(quality) : '—';
    document.querySelector('[data-role="catador-result-value"]').textContent = weight ? formatCurrencyBR(value) : '—';

    // Próximo passo do catador: levar o material à organização para pesagem e venda.
    const nextStep = document.getElementById('catador-result-next');
    nextStep.innerHTML = '';
    if (isValidated) {
      nextStep.appendChild(el('span', { class: 'badge badge-success', text: 'Validado' }));
      nextStep.appendChild(el('p', { class: 'text-sm text-muted', style: 'margin-top:8px',
        text: `Peso confirmado por ${collection.organizationName}. Ciclo fechado.` }));
    } else {
      nextStep.appendChild(el('span', { class: 'badge badge-warning', text: 'Próximo passo' }));
      nextStep.appendChild(el('p', { class: 'text-sm', style: 'margin-top:8px',
        text: 'Leve o material a uma organização de catadores para pesagem e venda. É a pesagem que valida a coleta.' }));
      const list = el('ul', { class: 'stack-tight' });
      ReciclData.ORGANIZATIONS.forEach((org) => {
        list.appendChild(el('li', { class: 'text-xs text-muted', text: `• ${org.name} — ${org.district}` }));
      });
      nextStep.appendChild(list);
    }
  }

  // ---------- Lista de coletas do catador ----------
  function renderCollectionsList() {
    const container = document.getElementById('catador-collections-list');
    const collections = myCollections().filter((c) => c.status !== 'solicitada');
    ReciclComponents.renderCollectionList(container, collections, {
      onClick: (collection) => {
        const isFinished = collection.status === 'retirado' || collection.status === 'validado';
        ReciclRouter.navigate(isFinished ? 'catador-result' : 'catador-detail', { id: collection.id });
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
    // Só conta o que a organização já validou — é o peso que vale de verdade.
    const done = myCollections().filter((c) => c.status === 'validado');
    const baseline = ReciclData.CATADOR_BASELINE;
    const totalKg = baseline.kg + done.reduce((sum, c) => sum + (c.weightValidated || c.weightFinal || 0), 0);
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
