/**
 * ReciclApp — lógica do perfil Empresa (coleta esporádica, eventos, grandes volumes).
 */

const ReciclEmpresa = (() => {
  const { el, formatKg, formatPercent, formatDate, generateId, generateProtocol, isFutureOrTodayDate } = ReciclUtils;

  const spMaterials = new Set();
  const evMaterials = new Set();
  const bulkMaterials = new Set();
  const photoDrafts = { sp: [], ev: [], bulk: [] };
  let evNeed = 'antes';
  let activeTrackingId = null;

  const EVENT_NEED_OPTIONS = [
    { id: 'antes', label: 'Antes do evento', hint: 'Retirada de materiais de montagem/preparação.' },
    { id: 'durante', label: 'Durante o evento', hint: 'Coleta contínua enquanto o evento acontece.' },
    { id: 'apos', label: 'Após o evento', hint: 'Retirada de materiais ao final da operação.' },
  ];

  function currentOrgName() {
    const user = ReciclState.appState.currentUser;
    return user?.orgName || user?.name || 'Empresa';
  }

  function computeImpact() {
    const empresaCollections = ReciclState.getCollectionsByProfile('empresa');
    // Só entra no impacto o que foi validado na organização.
    const done = empresaCollections.filter((c) => c.status === 'validado');
    const baseline = ReciclData.EMPRESA_BASELINE;

    const kg = baseline.kg + done.reduce((sum, c) => sum + (c.weightValidated || c.weightFinal || 0), 0);
    const collections = baseline.collections + empresaCollections.length;
    const doneQualitySum = done.reduce((sum, c) => sum + (c.quality || 0), 0);
    const quality = done.length
      ? Math.round((baseline.quality * baseline.collections + doneQualitySum) / (baseline.collections + done.length))
      : baseline.quality;
    const collectors = baseline.collectors + new Set(done.map((c) => c.collectorName).filter(Boolean)).size;
    const events = baseline.events + empresaCollections.filter((c) => c.collectionType === 'evento').length;

    return { kg, quality, collections, collectors, events };
  }

  /**
   * Selo de Sustentabilidade: combina volume validado com consistência —
   * retiradas feitas dentro da janela de SLA.
   */
  function getSealSnapshot() {
    const validated = ReciclState.getCollectionsByProfile('empresa').filter((c) => c.status === 'validado');
    const baseline = ReciclData.EMPRESA_BASELINE;
    const totalKg = baseline.kg + validated.reduce((sum, c) => sum + (c.weightValidated || c.weightFinal || 0), 0);

    const withSla = validated.filter((c) => c.slaDueAt);
    const onTime = withSla.filter((c) => ReciclAgenda.wasCollectedOnTime(c)).length;
    const punctuality = withSla.length ? Math.round((onTime / withSla.length) * 100) : 100;

    return { ...ReciclData.calculateSeal(totalKg, punctuality), totalKg, punctuality };
  }

  function renderSealCard(container) {
    const seal = getSealSnapshot();
    container.innerHTML = '';
    container.appendChild(el('div', { class: 'seal-card' }, [
      el('div', { class: 'seal-badge', style: `--seal-color:${seal.current.color}` }, [
        el('span', { class: 'seal-badge-icon', html: SEAL_ICON, 'aria-hidden': 'true' }),
      ]),
      el('div', { class: 'seal-info' }, [
        el('span', { class: 'seal-label', text: 'Selo de Sustentabilidade' }),
        el('strong', { class: 'seal-tier', text: seal.current.label }),
        el('span', { class: 'text-xs text-muted', text: `${formatKg(seal.totalKg)} validados · ${formatPercent(seal.punctuality)} no prazo` }),
      ]),
    ]));

    if (seal.next) {
      const missing = [];
      if (seal.kgToNext > 0) missing.push(`${formatKg(seal.kgToNext)}`);
      if (seal.punctualityToNext > 0) missing.push(`+${seal.punctualityToNext}% de pontualidade`);
      const progress = Math.min(100, Math.round((seal.totalKg / seal.next.minKg) * 100));

      container.appendChild(el('div', { class: 'seal-progress' }, [
        el('div', { class: 'stat-bar-track' }, [
          el('span', { class: 'stat-bar-fill', style: `width:${progress}%;background:${seal.next.color}` }),
        ]),
        el('span', {
          class: 'text-xs text-muted',
          text: missing.length
            ? `Faltam ${missing.join(' e ')} para o selo ${seal.next.label}.`
            : `Você já atingiu os critérios do selo ${seal.next.label}.`,
        }),
      ]));
    } else {
      container.appendChild(el('span', { class: 'text-xs text-muted', text: 'Categoria máxima atingida. Mantenha a consistência para conservá-la.' }));
    }
  }

  const SEAL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l2.6 5.6 6.1.8-4.5 4.2 1.2 6.1L12 15.8 6.6 18.7l1.2-6.1L3.3 8.4l6.1-.8L12 2Z"/></svg>';

  /** Card do contrato: frequência vigente, próxima coleta e SLA em aberto. */
  function renderContractCard(container) {
    const { contract } = ReciclState.appState;
    container.innerHTML = '';
    if (!contract || !contract.active) {
      container.appendChild(el('p', { class: 'text-sm text-muted mb-0', text: 'Nenhum contrato ativo.' }));
      return;
    }

    const frequency = ReciclAgenda.getFrequency(contract.frequency);
    const openOrder = ReciclState.appState.collections.find(
      (item) => item.origin === 'contrato' && item.status !== 'validado',
    );

    container.appendChild(el('div', { class: 'card-row' }, [
      el('div', {}, [
        el('span', { class: 'text-xs text-muted', text: 'Frequência contratada' }),
        el('strong', { class: 'contract-frequency', text: frequency.label }),
      ]),
      el('button', {
        class: 'btn btn-outline btn-sm btn-auto', type: 'button',
        text: 'Alterar', onClick: () => ReciclRouter.navigate('empresa-frequency'),
      }),
    ]));

    if (openOrder) {
      const sla = ReciclAgenda.getSlaStatus(openOrder);
      container.appendChild(el('div', { class: 'contract-sla' }, [
        el('span', { class: `badge ${sla ? sla.tone : 'badge-turquesa'}`, text: sla ? sla.label : 'Em aberto' }),
        el('span', { class: 'text-xs text-muted', text: `Coleta #${openOrder.protocol} · ${ReciclComponents.STATUS_LABELS[openOrder.status]?.label || openOrder.status}` }),
      ]));
    } else {
      container.appendChild(el('p', {
        class: 'text-xs text-muted mb-0',
        style: 'margin-top:8px',
        text: `Próxima coleta prevista para ${formatDate(contract.nextTriggerDate)}.`,
      }));
    }
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    document.querySelector('[data-role="empresa-greeting"]').textContent = `Olá, ${currentOrgName()}.`;
    renderSealCard(document.getElementById('empresa-seal'));
    renderContractCard(document.getElementById('empresa-contract'));
    const impact = computeImpact();
    ReciclComponents.renderKpis(document.getElementById('empresa-dashboard-kpis'), [
      { value: formatKg(impact.kg), label: 'Reciclados' },
      { value: formatPercent(impact.quality), label: 'Qualidade média' },
      { value: impact.collections, label: 'Coletas' },
      { value: impact.collectors, label: 'Catadores envolvidos' },
    ]);

    const list = document.getElementById('empresa-dashboard-collections');
    const collections = ReciclState.getCollectionsByProfile('empresa').slice(0, 3);
    ReciclComponents.renderCollectionList(list, collections, {
      onClick: (collection) => ReciclRouter.navigate('empresa-tracking', { id: collection.id }),
      empty: {
        title: 'Nenhuma coleta ainda',
        text: 'Solicite sua primeira coleta para começar a acompanhar os resultados.',
        actionLabel: 'Nova coleta',
        onAction: () => ReciclRouter.navigate('empresa-collection-type'),
      },
    });
  }

  // ---------- Frequência do contrato ----------
  function renderFrequencyScreen() {
    const { contract } = ReciclState.appState;
    const container = document.getElementById('empresa-frequency-options');
    const current = contract?.frequency;

    ReciclComponents.renderOptionList(container, ReciclData.FREQUENCIES, current, (id) => {
      if (!contract) return;
      ReciclState.updateContract({
        frequency: id,
        nextTriggerDate: ReciclAgenda.calculateNextTrigger(
          contract.lastTriggerDate ? new Date(contract.lastTriggerDate) : new Date(), id,
        ),
      });
      ReciclComponents.showToast(`Frequência alterada para: ${ReciclAgenda.getFrequency(id).label}.`, 'success');
      renderFrequencyScreen();
    });

    const summary = document.getElementById('empresa-frequency-summary');
    summary.innerHTML = '';
    if (contract) {
      summary.appendChild(el('p', {
        class: 'text-sm text-muted mb-0',
        text: `Próxima coleta prevista para ${formatDate(contract.nextTriggerDate)}. Ao vencer, abre-se uma janela de ${ReciclData.SLA_BUSINESS_DAYS} dias úteis para a retirada.`,
      }));
    }
  }

  /** Atalho de demonstração: evita esperar o prazo real vencer durante o pitch. */
  function simulateTrigger() {
    const collection = ReciclAgenda.forceTriggerNow();
    if (!collection) {
      ReciclComponents.showToast('Já existe uma coleta em aberto para este contrato.', 'info');
      return;
    }
    ReciclComponents.showToast('Prazo cumprido: coleta aberta e disponível no mapa dos catadores.', 'success');
    ReciclRouter.navigate('empresa-tracking', { id: collection.id });
  }

  // ---------- Coleta esporádica ----------
  /** Preenche só quando vazio: a função é re-executada a cada toggle de material
      e não pode sobrescrever o que a pessoa já digitou. */
  function prefillIfEmpty(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (!field.value) field.value = value;
  }

  function renderSporadicForm() {
    prefillIfEmpty('sp-company', currentOrgName());
    ReciclComponents.renderMaterialChipGrid(document.getElementById('sp-materials-grid'), spMaterials, (id) => {
      if (spMaterials.has(id)) spMaterials.delete(id); else spMaterials.add(id);
      renderSporadicForm();
    });
    document.getElementById('sp-materials-error').style.display = 'none';
    const dateField = document.getElementById('sp-date');
    if (!dateField.value) dateField.value = new Date().toISOString().slice(0, 10);
    ReciclPhotos.createField(document.getElementById('sp-photos-field'), {
      photos: photoDrafts.sp,
      hint: 'Registre o material como ele está hoje — volume, condição e acondicionamento.',
    });
  }

  function handleSporadicSubmit(event) {
    event.preventDefault();
    const addressField = document.getElementById('sp-address');
    const dateField = document.getElementById('sp-date');
    let valid = true;

    toggleFieldError(addressField, !addressField.value.trim());
    if (!addressField.value.trim()) valid = false;

    toggleFieldError(dateField, !isFutureOrTodayDate(dateField.value));
    if (!isFutureOrTodayDate(dateField.value)) valid = false;

    if (spMaterials.size === 0) {
      document.getElementById('sp-materials-error').style.display = 'block';
      valid = false;
    }
    if (!valid) return;

    const collection = createCollection({
      collectionType: 'esporadica',
      materials: [...spMaterials],
      quantityLabel: document.getElementById('sp-quantity').value || 'Não informado',
      address: addressField.value.trim(),
      unit: document.getElementById('sp-unit').value.trim(),
      date: dateField.value,
      window: document.getElementById('sp-window').value,
      observation: document.getElementById('sp-notes').value.trim(),
      photosOrigin: [...photoDrafts.sp],
    });

    finishSubmission(event.submitter, collection, 'Estamos procurando um catador disponível.');
    spMaterials.clear();
    photoDrafts.sp.length = 0;
    event.target.reset();
  }

  // ---------- Coleta para evento ----------
  function renderEventForm() {
    const datalist = document.getElementById('ev-name-suggestions');
    datalist.innerHTML = '';
    ReciclData.EVENT_NAMES.forEach((name) => datalist.appendChild(el('option', { value: name })));

    ReciclComponents.renderMaterialChipGrid(document.getElementById('ev-materials-grid'), evMaterials, (id) => {
      if (evMaterials.has(id)) evMaterials.delete(id); else evMaterials.add(id);
      renderEventForm();
    });
    document.getElementById('ev-materials-error').style.display = 'none';

    ReciclComponents.renderOptionList(document.getElementById('ev-need-options'), EVENT_NEED_OPTIONS, evNeed, (id) => {
      evNeed = id;
      renderEventForm();
    });

    const dateField = document.getElementById('ev-date');
    if (!dateField.value) dateField.value = new Date().toISOString().slice(0, 10);

    ReciclPhotos.createField(document.getElementById('ev-photos-field'), {
      photos: photoDrafts.ev,
      hint: 'Fotos do local ou do material previsto ajudam a planejar a operação.',
    });
  }

  function handleEventSubmit(event) {
    event.preventDefault();
    const nameField = document.getElementById('ev-name');
    const dateField = document.getElementById('ev-date');
    const localField = document.getElementById('ev-local');
    const audienceField = document.getElementById('ev-audience');
    let valid = true;

    [[nameField, !nameField.value.trim()], [dateField, !isFutureOrTodayDate(dateField.value)], [localField, !localField.value.trim()], [audienceField, !audienceField.value || Number(audienceField.value) <= 0]]
      .forEach(([field, hasError]) => {
        toggleFieldError(field, hasError);
        if (hasError) valid = false;
      });

    if (evMaterials.size === 0) {
      document.getElementById('ev-materials-error').style.display = 'block';
      valid = false;
    }
    if (!valid) return;

    const collection = createCollection({
      collectionType: 'evento',
      materials: [...evMaterials],
      eventName: nameField.value.trim(),
      date: dateField.value,
      eventTime: document.getElementById('ev-time').value,
      address: localField.value.trim(),
      audience: Number(audienceField.value),
      eventNeed: EVENT_NEED_OPTIONS.find((option) => option.id === evNeed)?.label,
      quantityLabel: 'Estimativa a confirmar',
      photosOrigin: [...photoDrafts.ev],
    });

    finishSubmission(event.submitter, collection, 'Estamos organizando a operação para o seu evento.');
    evMaterials.clear();
    photoDrafts.ev.length = 0;
    evNeed = 'antes';
    event.target.reset();
  }

  // ---------- Grande volume ----------
  function renderBulkForm() {
    prefillIfEmpty('bulk-company', currentOrgName());
    ReciclComponents.renderMaterialChipGrid(document.getElementById('bulk-materials-grid'), bulkMaterials, (id) => {
      if (bulkMaterials.has(id)) bulkMaterials.delete(id); else bulkMaterials.add(id);
      renderBulkForm();
    });
    document.getElementById('bulk-materials-error').style.display = 'none';
    ReciclPhotos.createField(document.getElementById('bulk-photos-field'), {
      photos: photoDrafts.bulk,
      hint: 'Fotos dos pontos de coleta ajudam a dimensionar a operação.',
    });
  }

  function handleBulkSubmit(event) {
    event.preventDefault();
    const quantityField = document.getElementById('bulk-quantity');
    const contactField = document.getElementById('bulk-contact');
    let valid = true;

    toggleFieldError(quantityField, !quantityField.value || Number(quantityField.value) <= 0);
    if (!quantityField.value || Number(quantityField.value) <= 0) valid = false;

    toggleFieldError(contactField, !contactField.value.trim());
    if (!contactField.value.trim()) valid = false;

    if (bulkMaterials.size === 0) {
      document.getElementById('bulk-materials-error').style.display = 'block';
      valid = false;
    }
    if (!valid) return;

    const collection = createCollection({
      collectionType: 'grande_volume',
      materials: [...bulkMaterials],
      unit: document.getElementById('bulk-unit').value.trim(),
      quantityLabel: `${quantityField.value} kg (estimado)`,
      points: Number(document.getElementById('bulk-points').value) || 1,
      period: document.getElementById('bulk-period').value,
      observation: document.getElementById('bulk-notes').value.trim(),
      contact: contactField.value.trim(),
      date: new Date().toISOString().slice(0, 10),
      photosOrigin: [...photoDrafts.bulk],
      isBulkQuote: true,
    });

    finishSubmission(event.submitter, collection, 'Em uma versão completa, nossa equipe entraria em contato para estruturar a operação.', 'Solicitação recebida');
    bulkMaterials.clear();
    photoDrafts.bulk.length = 0;
    event.target.reset();
  }

  // ---------- Helpers compartilhados ----------
  function toggleFieldError(field, hasError) {
    const wrap = field.closest('.field');
    if (wrap) wrap.classList.toggle('has-error', hasError);
  }

  function createCollection(fields) {
    return ReciclState.addCollection({
      id: generateId('col'),
      protocol: generateProtocol(),
      requesterType: 'empresa',
      requesterName: currentOrgName(),
      status: 'solicitada',
      ...fields,
    });
  }

  function finishSubmission(submitButton, collection, toastMessage, toastTitle = 'Solicitação enviada!') {
    if (submitButton) ReciclComponents.setButtonLoading(submitButton, true, 'Enviando solicitação...');
    setTimeout(() => {
      if (submitButton) ReciclComponents.setButtonLoading(submitButton, false);
      ReciclComponents.showToast(`${toastTitle} ${toastMessage}`, 'success');
      activeTrackingId = collection.id;
      ReciclRouter.navigate('empresa-tracking', { id: collection.id });
    }, 900);
  }

  // ---------- Acompanhamento ----------
  function renderTracking(params) {
    if (params && params.id) activeTrackingId = params.id;
    const collection = ReciclState.getCollection(activeTrackingId);
    document.querySelector('[data-role="empresa-tracking-protocol"]').textContent = collection ? `Coleta #${collection.protocol}` : 'Coleta';

    const timelineEl = document.getElementById('empresa-tracking-timeline');
    const detailsEl = document.getElementById('empresa-tracking-details');

    if (!collection) {
      ReciclComponents.renderEmptyState(timelineEl, { title: 'Coleta não encontrada', text: 'Volte ao dashboard e escolha uma coleta.', icon: 'empty' });
      detailsEl.innerHTML = '';
      return;
    }

    ReciclComponents.renderTimeline(timelineEl, ReciclData.buildCollectionTimelineSteps(collection.status));

    detailsEl.innerHTML = '';
    const materialsLabel = (collection.materials || []).map((id) => ReciclData.getMaterialLabel(id)).join(', ');
    const rows = [
      ['Empresa', collection.requesterName],
      ['Catador', collection.collectorName || 'Aguardando aceite'],
      ['Materiais', materialsLabel || '—'],
      ['Quantidade estimada', collection.quantityLabel || '—'],
      ['Quantidade final', collection.weightFinal ? formatKg(collection.weightFinal) : 'Aguardando registro'],
      ['Qualidade', collection.quality ? formatPercent(collection.quality) : '—'],
      ['Data', formatDate(collection.date)],
    ];
    if (collection.eventName) rows.splice(2, 0, ['Evento', collection.eventName]);
    rows.forEach(([label, value]) => {
      detailsEl.appendChild(el('div', { class: 'summary-row' }, [el('dt', { text: label }), el('dd', { text: value })]));
    });

    if (collection.isBulkQuote) {
      detailsEl.appendChild(el('p', { class: 'text-xs text-muted', style: 'margin-top:8px', text: 'Em uma versão completa, nossa equipe entraria em contato para estruturar a operação.' }));
    }

    ReciclPhotos.renderComparison(document.getElementById('empresa-tracking-photos'), collection);
  }

  // ---------- Lista de coletas ----------
  function renderCollectionsList() {
    const container = document.getElementById('empresa-collections-list');
    ReciclComponents.renderCollectionList(container, ReciclState.getCollectionsByProfile('empresa'), {
      onClick: (collection) => ReciclRouter.navigate('empresa-tracking', { id: collection.id }),
      empty: {
        title: 'Nenhuma coleta ainda',
        text: 'Solicite sua primeira coleta para começar a acompanhar os resultados.',
        actionLabel: 'Nova coleta',
        onAction: () => ReciclRouter.navigate('empresa-collection-type'),
      },
    });
  }

  // ---------- Impacto ----------
  function renderImpactScreen() {
    const impact = computeImpact();
    ReciclComponents.renderKpis(document.getElementById('empresa-impact-kpis'), [
      { value: formatKg(impact.kg), label: 'Reciclados' },
      { value: formatPercent(impact.quality), label: 'Qualidade média' },
      { value: impact.collections, label: 'Coletas' },
      { value: impact.events, label: 'Eventos atendidos' },
      { value: impact.collectors, label: 'Catadores envolvidos' },
    ]);
    ReciclComponents.renderMaterialBars(document.getElementById('empresa-impact-materials'), ReciclData.MATERIAL_DISTRIBUTION);
  }

  // ---------- Relatório ----------
  function renderReport() {
    document.querySelector('[data-role="report-company"]').textContent = currentOrgName();
    const impact = computeImpact();
    const aproveitados = Math.round(impact.kg * (impact.quality / 100));
    const rejeitos = impact.kg - aproveitados;

    ReciclComponents.renderKpis(document.getElementById('report-kpis'), [
      { value: formatKg(impact.kg), label: 'Coletados' },
      { value: formatKg(aproveitados), label: 'Aproveitados' },
      { value: formatKg(rejeitos), label: 'Rejeitos' },
      { value: formatPercent(impact.quality), label: 'Qualidade' },
    ]);
    ReciclComponents.renderKpis(document.getElementById('report-social-kpis'), [
      { value: impact.collectors, label: 'Catadores envolvidos' },
      { value: impact.collections, label: 'Coletas realizadas' },
    ]);
  }

  function viewReport() {
    renderReport();
    ReciclComponents.showToast('Relatório atualizado com os dados mais recentes.', 'success');
  }

  function simulateExport() {
    ReciclComponents.showToast('Em uma versão completa, este relatório poderá ser exportado.', 'info');
  }

  // ---------- Serviços ----------
  function renderServices() {
    const container = document.getElementById('empresa-services-list');
    container.innerHTML = '';
    ReciclData.SERVICES.forEach((service) => {
      container.appendChild(el('div', { class: 'card card-tight' }, [
        el('h3', { text: service.title, style: 'font-size:var(--fs-base)' }),
        el('p', { class: 'text-sm text-muted mb-0', text: service.desc }),
      ]));
    });
    container.appendChild(el('div', { class: 'card card-tight', style: 'background:var(--color-surface-alt)' }, [
      el('h3', { text: 'Modelo comercial', style: 'font-size:var(--fs-base)' }),
      el('p', { class: 'text-sm text-muted', text: 'Usuário: gratuito · Catador: gratuito · Empresa: cliente pagante.' }),
      el('p', { class: 'text-xs text-muted mb-0', text: 'Receitas futuras: assinatura, taxa sobre operações, serviços para eventos, gestão de grandes volumes e relatórios.' }),
    ]));
  }

  // ---------- Perfil ----------
  function renderProfile() {
    document.querySelector('[data-role="empresa-profile-name"]').textContent = currentOrgName();
    document.querySelector('[data-role="empresa-avatar"]').textContent = currentOrgName().charAt(0).toUpperCase();
  }

  function init() {
    ReciclRouter.onEnter('empresa-dashboard', renderDashboard);
    ReciclRouter.onEnter('empresa-frequency', renderFrequencyScreen);
    ReciclRouter.onEnter('empresa-sporadic', renderSporadicForm);
    ReciclRouter.onEnter('empresa-event', renderEventForm);
    ReciclRouter.onEnter('empresa-bulk', renderBulkForm);
    ReciclRouter.onEnter('empresa-tracking', renderTracking);
    ReciclRouter.onEnter('empresa-collections', renderCollectionsList);
    ReciclRouter.onEnter('empresa-impact', renderImpactScreen);
    ReciclRouter.onEnter('empresa-report', renderReport);
    ReciclRouter.onEnter('empresa-services', renderServices);
    ReciclRouter.onEnter('empresa-profile', renderProfile);

    document.getElementById('empresa-sporadic-form').addEventListener('submit', handleSporadicSubmit);
    document.getElementById('empresa-event-form').addEventListener('submit', handleEventSubmit);
    document.getElementById('empresa-bulk-form').addEventListener('submit', handleBulkSubmit);
  }

  return { init, viewReport, simulateExport, simulateTrigger, getSealSnapshot, renderSealCard };
})();
