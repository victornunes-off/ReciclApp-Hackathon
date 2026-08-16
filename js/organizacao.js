/**
 * ReciclApp — perfil Organização de catadores (Fluxo 4).
 *
 * É aqui que o ciclo fecha: o catador entrega o material, a organização pesa e
 * essa pesagem é o que valida a coleta e alimenta o dashboard e o selo do cliente.
 */

const ReciclOrganizacao = (() => {
  const { el, formatKg, formatDate, formatPercent } = ReciclUtils;

  let activeIntakeId = null;

  function currentOrgName() {
    return ReciclState.appState.currentUser?.orgName
      || ReciclState.appState.currentUser?.name
      || ReciclData.ORGANIZATIONS[0].name;
  }

  /** Coletas já retiradas pelo catador e ainda não pesadas. */
  function pendingIntakes() {
    return ReciclState.appState.collections.filter((item) => item.status === 'retirado');
  }

  function validatedByOrg() {
    return ReciclState.appState.collections.filter(
      (item) => item.status === 'validado' && item.organizationName === currentOrgName(),
    );
  }

  // ---------- Início ----------
  function renderHome() {
    document.querySelector('[data-role="org-greeting"]').textContent = `Olá, ${currentOrgName()}!`;

    const pending = pendingIntakes();
    ReciclComponents.renderKpis(document.getElementById('org-home-kpis'), [
      { value: pending.length, label: 'Aguardando pesagem' },
      { value: formatKg(validatedByOrg().reduce((sum, c) => sum + (c.weightValidated || 0), 0)), label: 'Validado por você' },
    ]);

    const list = document.getElementById('org-intake-list');
    list.innerHTML = '';
    if (!pending.length) {
      ReciclComponents.renderEmptyState(list, {
        title: 'Nenhum material aguardando',
        text: 'Quando um catador registrar uma retirada, ela aparecerá aqui para pesagem.',
        icon: 'empty',
      });
      return;
    }

    pending.forEach((collection) => {
      const materials = (collection.materials || []).map((id) => ReciclData.getMaterialLabel(id)).join(' + ');
      list.appendChild(el('button', {
        class: 'collection-card card-clickable',
        type: 'button',
        onClick: () => ReciclRouter.navigate('org-weigh', { id: collection.id }),
      }, [
        el('div', { class: 'collection-card-top' }, [
          el('div', {}, [
            el('div', { class: 'collection-card-title', text: collection.requesterName }),
            el('div', { class: 'collection-card-meta', text: materials || 'Materiais diversos' }),
          ]),
          el('span', { class: 'badge badge-warning', text: 'Pesar' }),
        ]),
        el('div', { class: 'collection-card-meta', text: `Catador: ${collection.collectorName || '—'} · declarado ${formatKg(collection.weightFinal || 0)}` }),
      ]));
    });
  }

  // ---------- Pesagem ----------
  function renderWeighScreen(params) {
    if (params && params.id) activeIntakeId = params.id;
    const collection = ReciclState.getCollection(activeIntakeId);
    const info = document.getElementById('org-weigh-info');
    const form = document.getElementById('org-weigh-form');

    if (!collection) {
      ReciclComponents.renderEmptyState(info, { title: 'Coleta não encontrada', text: 'Volte e escolha outra entrega.', icon: 'empty' });
      form.hidden = true;
      return;
    }

    form.hidden = false;
    form.reset();
    document.querySelector('[data-role="org-weigh-protocol"]').textContent = `Coleta #${collection.protocol}`;

    info.innerHTML = '';
    const materials = (collection.materials || []).map((id) => ReciclData.getMaterialLabel(id)).join(', ');
    [
      ['Cliente', collection.requesterName],
      ['Catador', collection.collectorName || '—'],
      ['Materiais', materials || '—'],
      ['Peso declarado na retirada', formatKg(collection.weightFinal || 0)],
      ['Qualidade registrada', collection.quality ? formatPercent(collection.quality) : '—'],
      ['Data da retirada', formatDate(collection.pickedUpAt || collection.date)],
    ].forEach(([label, value]) => {
      info.appendChild(el('div', { class: 'summary-row' }, [el('dt', { text: label }), el('dd', { text: value })]));
    });

    // Sugere o peso declarado pelo catador como ponto de partida.
    document.getElementById('org-weight').value = collection.weightFinal || '';

    ReciclPhotos.renderGallery(document.getElementById('org-weigh-photos'), collection.photosPickup, {
      label: 'Fotos do recolhimento',
      emptyText: 'O catador não registrou fotos.',
    });

    const orgSelect = document.getElementById('org-destination');
    orgSelect.innerHTML = '';
    ReciclData.ORGANIZATIONS.forEach((org) => {
      orgSelect.appendChild(el('option', { value: org.name, text: `${org.name} — ${org.district}` }));
    });
    orgSelect.value = currentOrgName();
  }

  function handleWeighSubmit(event) {
    event.preventDefault();
    const weightField = document.getElementById('org-weight');
    const weight = Number(weightField.value);
    const wrap = weightField.closest('.field');

    if (!weight || weight <= 0) {
      wrap.classList.add('has-error');
      weightField.focus();
      return;
    }
    wrap.classList.remove('has-error');

    const collection = ReciclState.updateCollection(activeIntakeId, {
      status: 'validado',
      weightValidated: weight,
      organizationName: document.getElementById('org-destination').value,
      validatedAt: new Date().toISOString(),
    });

    ReciclState.addNotification({
      profile: 'empresa',
      title: `Coleta #${collection.protocol} validada`,
      body: `${formatKg(weight)} confirmados por ${collection.organizationName}.`,
    });
    ReciclState.addNotification({
      profile: 'catador',
      title: 'Entrega confirmada',
      body: `${formatKg(weight)} registrados em ${collection.organizationName}.`,
    });

    ReciclComponents.showToast('Ciclo fechado! O impacto foi contabilizado para o cliente.', 'success');
    ReciclRouter.navigate('org-result', { id: collection.id, replace: true });
  }

  // ---------- Resultado ----------
  function renderResult(params) {
    const collection = ReciclState.getCollection(params?.id || activeIntakeId);
    document.querySelector('[data-role="org-result-weight"]').textContent = collection?.weightValidated ? formatKg(collection.weightValidated) : '—';
    document.querySelector('[data-role="org-result-client"]').textContent = collection?.requesterName || '—';

    const seal = ReciclEmpresa.getSealSnapshot();
    document.querySelector('[data-role="org-result-seal"]').textContent = seal.current.label;
  }

  // ---------- Histórico ----------
  function renderHistory() {
    const validated = validatedByOrg();
    ReciclComponents.renderKpis(document.getElementById('org-history-kpis'), [
      { value: validated.length, label: 'Entradas validadas' },
      { value: formatKg(validated.reduce((sum, c) => sum + (c.weightValidated || 0), 0)), label: 'Total recebido' },
    ]);
    ReciclComponents.renderCollectionList(document.getElementById('org-history-list'), validated, {
      empty: { title: 'Nenhuma validação ainda', text: 'As pesagens confirmadas aparecerão aqui.', icon: 'empty' },
    });
  }

  function renderProfile() {
    document.querySelector('[data-role="org-profile-name"]').textContent = currentOrgName();
    document.querySelector('[data-role="org-avatar"]').textContent = currentOrgName().charAt(0).toUpperCase();
  }

  function init() {
    ReciclRouter.onEnter('org-home', renderHome);
    ReciclRouter.onEnter('org-weigh', renderWeighScreen);
    ReciclRouter.onEnter('org-result', renderResult);
    ReciclRouter.onEnter('org-history', renderHistory);
    ReciclRouter.onEnter('org-profile', renderProfile);

    document.getElementById('org-weigh-form').addEventListener('submit', handleWeighSubmit);
  }

  return { init };
})();
