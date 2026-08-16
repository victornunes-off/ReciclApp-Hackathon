/**
 * ReciclApp — componentes de UI reutilizáveis (toast, modal, cards, estados).
 */

const ReciclComponents = (() => {
  const { el, formatKg, formatDate, formatPercent } = ReciclUtils;

  const STATUS_LABELS = {
    solicitada: { label: 'Solicitada', badge: 'badge-warning' },
    catador_encontrado: { label: 'Catador encontrado', badge: 'badge-turquesa' },
    em_andamento: { label: 'Em andamento', badge: 'badge-info' },
    retirado: { label: 'Retirado — aguardando pesagem', badge: 'badge-warning' },
    validado: { label: 'Validado', badge: 'badge-success' },
    concluida: { label: 'Concluída', badge: 'badge-success' },
    cancelada: { label: 'Cancelada', badge: 'badge-error' },
    orcamento_solicitado: { label: 'Orçamento solicitado', badge: 'badge-turquesa' },
  };

  const ICONS = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>',
    empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 7l3-4h12l3 4"/><path d="M9 11h6"/></svg>',
  };

  // ---------- Toast ----------
  function showToast(message, type = 'info', duration = 3200) {
    const stack = document.getElementById('toast-stack');
    if (!stack) return;
    const iconKey = type === 'success' ? 'check' : type === 'error' ? 'alert' : 'info';
    const toast = el('div', { class: `toast toast-${type}`, role: 'status' }, [
      el('span', { class: 'toast-icon', html: ICONS[iconKey] }),
      el('span', { text: message }),
    ]);
    stack.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // ---------- Modal ----------
  function openModal(modalId) {
    const overlay = document.getElementById(modalId);
    if (!overlay) return;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    const focusable = overlay.querySelector('button, input, select, textarea, a');
    if (focusable) focusable.focus();
  }

  function closeModal(modalId) {
    const overlay = document.getElementById(modalId);
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function confirmDialog({ title, rows = [], confirmLabel = 'Confirmar', cancelLabel = 'Voltar', onConfirm }) {
    const overlay = document.getElementById('modal-confirm');
    if (!overlay) return;
    overlay.querySelector('[data-role="confirm-title"]').textContent = title;

    const list = overlay.querySelector('[data-role="confirm-list"]');
    list.innerHTML = '';
    rows.forEach(([label, value]) => {
      list.appendChild(el('div', { class: 'summary-row' }, [
        el('dt', { text: label }),
        el('dd', { text: value }),
      ]));
    });

    const confirmBtn = overlay.querySelector('[data-role="confirm-action"]');
    confirmBtn.textContent = confirmLabel;
    overlay.querySelector('[data-role="cancel-action"]').textContent = cancelLabel;

    const freshConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(freshConfirmBtn, confirmBtn);
    freshConfirmBtn.addEventListener('click', () => {
      closeModal('modal-confirm');
      onConfirm();
    });

    openModal('modal-confirm');
  }

  // ---------- Empty / loading ----------
  function renderEmptyState(container, { title, text, actionLabel, onAction, icon = 'empty' }) {
    container.innerHTML = '';
    const children = [
      el('span', { class: 'empty-state-icon', html: ICONS[icon] || ICONS.empty }),
      el('h3', { text: title }),
      el('p', { class: 'text-sm', text }),
    ];
    if (actionLabel) {
      children.push(el('button', { class: 'btn btn-primary btn-auto', type: 'button', onClick: onAction, text: actionLabel }));
    }
    container.appendChild(el('div', { class: 'empty-state' }, children));
  }

  function renderLoadingState(container, message = 'Carregando...') {
    container.innerHTML = '';
    container.appendChild(el('div', { class: 'loading-state' }, [
      el('span', { class: 'spinner', 'aria-hidden': 'true' }),
      el('span', { text: message }),
    ]));
  }

  function setButtonLoading(button, isLoading, loadingText = 'Enviando...') {
    if (isLoading) {
      button.dataset.originalText = button.textContent;
      button.textContent = loadingText;
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
    }
  }

  // ---------- Status badge ----------
  function statusBadge(status) {
    const info = STATUS_LABELS[status] || { label: status, badge: 'badge' };
    return el('span', { class: `badge ${info.badge}`, text: info.label });
  }

  // ---------- Collection card ----------
  function renderCollectionCard(collection, { onClick } = {}) {
    const materialsLabel = (collection.materials || [])
      .map((materialId) => ReciclData.getMaterialLabel(materialId))
      .join(' + ');

    const card = el('button', { class: 'collection-card card-clickable', type: 'button', onClick: onClick ? () => onClick(collection) : undefined }, [
      el('div', { class: 'collection-card-top' }, [
        el('div', {}, [
          el('div', { class: 'collection-card-title', text: materialsLabel || 'Materiais diversos' }),
          el('div', { class: 'collection-card-meta', text: `#${collection.protocol} · ${formatDate(collection.date)}` }),
        ]),
        statusBadge(collection.status),
      ]),
      el('div', { class: 'collection-card-meta', text: `${collection.weightFinal ? formatKg(collection.weightFinal) : collection.quantityLabel || 'Estimativa pendente'}${collection.address ? ' · ' + collection.address : ''}` }),
    ]);
    return card;
  }

  function renderCollectionList(container, collections, opts = {}) {
    container.innerHTML = '';
    if (!collections.length) {
      renderEmptyState(container, opts.empty);
      return;
    }
    collections.forEach((collection) => {
      container.appendChild(renderCollectionCard(collection, opts));
    });
  }

  // ---------- Notifications ----------
  function renderNotificationList(container, notifications) {
    container.innerHTML = '';
    if (!notifications.length) {
      renderEmptyState(container, {
        title: 'Nenhuma notificação',
        text: 'Você será avisado por aqui sobre suas coletas.',
        icon: 'info',
      });
      return;
    }
    notifications.forEach((notif) => {
      container.appendChild(el('div', { class: `card card-tight${notif.read ? '' : ' notif-unread'}` }, [
        el('div', { class: 'card-row' }, [
          el('strong', { class: 'text-sm', text: notif.title }),
          !notif.read ? el('span', { class: 'badge badge-lima', text: 'novo' }) : null,
        ]),
        el('p', { class: 'text-sm text-muted mb-0', text: notif.body, style: 'margin-top:4px' }),
      ]));
    });
  }

  // ---------- Timeline ----------
  function renderTimeline(container, steps) {
    container.innerHTML = '';
    const list = el('ul', { class: 'timeline' });
    steps.forEach((step) => {
      list.appendChild(el('li', { class: `timeline-item is-${step.state}` }, [
        el('span', { class: 'timeline-dot', 'aria-hidden': 'true' }),
        el('div', { class: 'timeline-title', text: step.label }),
        step.desc ? el('div', { class: 'timeline-desc', text: step.desc }) : null,
      ]));
    });
    container.appendChild(list);
  }

  // ---------- Material distribution bars ----------
  function renderMaterialBars(container, distribution) {
    container.innerHTML = '';
    distribution.forEach((item) => {
      container.appendChild(el('div', { class: 'stat-bar-row' }, [
        el('span', { class: 'stat-bar-label', text: item.label }),
        el('span', { class: 'stat-bar-track' }, [
          el('span', { class: 'stat-bar-fill', style: `width:${item.pct}%` }),
        ]),
        el('span', { class: 'stat-bar-value', text: formatPercent(item.pct) }),
      ]));
    });
  }

  /**
   * Gráfico de colunas para uma única série ao longo do tempo.
   *
   * Série única, então sem legenda — o título já diz o que está plotado.
   * Rotula apenas o mês corrente: valor em cada coluna vira ruído e não é lido.
   * Cada coluna é um <button> para ser tocável, focável por teclado e legível
   * por leitor de tela; a tabela oculta abaixo garante o acesso aos números.
   */
  function renderColumnChart(container, { series, unit = 'kg', caption } = {}) {
    container.innerHTML = '';
    if (!series || !series.length) {
      renderEmptyState(container, { title: 'Sem dados ainda', text: 'Os meses aparecerão aqui conforme as coletas forem validadas.' });
      return;
    }

    const maxValue = Math.max(...series.map((point) => point.value), 1);
    const axisTop = niceCeiling(maxValue);

    const chart = el('div', { class: 'chart' });

    // Eixo Y + área de plotagem
    const plot = el('div', { class: 'chart-plot' });
    [1, 0.5, 0].forEach((fraction) => {
      plot.appendChild(el('div', { class: 'chart-gridline', style: `bottom:${fraction * 100}%` }, [
        el('span', { class: 'chart-ytick', text: formatCompact(axisTop * fraction) }),
      ]));
    });

    const bars = el('div', { class: 'chart-bars' });
    const tooltip = el('div', { class: 'chart-tooltip', role: 'status', 'aria-live': 'polite' });

    series.forEach((point) => {
      const heightPct = (point.value / axisTop) * 100;
      const bar = el('button', {
        type: 'button',
        class: `chart-bar${point.isCurrent ? ' is-current' : ''}`,
        'aria-label': `${point.label}: ${formatKg(point.value)}`,
        onClick: () => showPoint(point),
        onMouseenter: () => showPoint(point),
        onFocus: () => showPoint(point),
      }, [
        point.isCurrent
          ? el('span', { class: 'chart-bar-value', text: formatCompact(point.value) })
          : null,
        el('span', { class: 'chart-bar-fill', style: `height:${Math.max(heightPct, 1.5)}%` }),
      ]);
      bars.appendChild(bar);
    });

    function showPoint(point) {
      tooltip.textContent = `${point.label} · ${formatKg(point.value)}`;
      tooltip.classList.add('is-visible');
    }

    plot.appendChild(bars);
    chart.appendChild(plot);
    chart.appendChild(el('div', { class: 'chart-x' }, series.map((point) => (
      el('span', { class: `chart-xlabel${point.isCurrent ? ' is-current' : ''}`, text: point.label })
    ))));
    chart.appendChild(tooltip);

    // Alternativa textual aos dados do gráfico
    const table = el('table', { class: 'sr-only' }, [
      el('caption', { text: caption || `Série mensal em ${unit}` }),
      el('tbody', {}, series.map((point) => el('tr', {}, [
        el('th', { scope: 'row', text: point.label }),
        el('td', { text: formatKg(point.value) }),
      ]))),
    ]);

    container.appendChild(chart);
    container.appendChild(table);
  }

  /** Teto "redondo" para o eixo (100, 250, 500, 1.000...). */
  function niceCeiling(value) {
    const magnitude = 10 ** Math.floor(Math.log10(value));
    const steps = [1, 2, 2.5, 5, 10];
    const step = steps.find((candidate) => value <= candidate * magnitude) || 10;
    return step * magnitude;
  }

  function formatCompact(value) {
    const rounded = Math.round(value);
    return rounded >= 1000
      ? `${(rounded / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
      : String(rounded);
  }

  // ---------- KPI grid ----------
  function renderKpis(container, kpis) {
    container.innerHTML = '';
    kpis.forEach((kpi) => {
      container.appendChild(el('div', { class: 'kpi-card' }, [
        el('span', { class: 'kpi-value', text: kpi.value }),
        el('span', { class: 'kpi-label', text: kpi.label }),
      ]));
    });
  }

  // ---------- Seletor de materiais (grid de chips) ----------
  function renderMaterialChipGrid(container, selectedIds, onToggle) {
    container.innerHTML = '';
    ReciclData.MATERIALS.forEach((material) => {
      const isSelected = selectedIds.has(material.id);
      container.appendChild(el('button', {
        type: 'button',
        class: 'chip-select',
        'aria-pressed': String(isSelected),
        onClick: () => onToggle(material.id),
      }, [
        el('span', { html: ReciclData.getMaterialIcon(material.id), 'aria-hidden': 'true' }),
        el('span', { text: material.label }),
      ]));
    });
  }

  // ---------- Lista de opções selecionáveis (radio-like cards) ----------
  function renderOptionList(container, options, selectedId, onSelect) {
    container.innerHTML = '';
    options.forEach((option) => {
      container.appendChild(el('button', {
        type: 'button',
        class: 'option-select',
        'aria-pressed': String(option.id === selectedId),
        onClick: () => onSelect(option.id),
      }, [
        el('strong', { text: option.label || option.title }),
        el('span', { text: option.hint || option.desc }),
      ]));
    });
  }

  return {
    ICONS,
    STATUS_LABELS,
    showToast,
    openModal,
    closeModal,
    confirmDialog,
    renderEmptyState,
    renderLoadingState,
    setButtonLoading,
    statusBadge,
    renderCollectionCard,
    renderCollectionList,
    renderNotificationList,
    renderTimeline,
    renderMaterialBars,
    renderKpis,
    renderMaterialChipGrid,
    renderOptionList,
    renderColumnChart,
  };
})();
