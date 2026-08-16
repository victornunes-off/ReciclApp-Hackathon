/**
 * ReciclApp — motor de agendamento (Fluxo 2).
 *
 * É o fluxo invisível do sistema: monitora a frequência contratada pelo cliente e,
 * quando o prazo se cumpre, abre automaticamente uma ordem de coleta com uma janela
 * de 5 dias úteis (SLA) para a retirada por um catador.
 */

const ReciclAgenda = (() => {
  const { addDays, addBusinessDays, businessDaysUntil, toISODate, generateId, generateProtocol } = ReciclUtils;

  function getFrequency(id) {
    return ReciclData.FREQUENCIES.find((item) => item.id === id) || ReciclData.FREQUENCIES[2];
  }

  /** Data em que a próxima ordem de coleta deve ser disparada. */
  function calculateNextTrigger(fromDate, frequencyId) {
    return toISODate(addDays(fromDate, getFrequency(frequencyId).days));
  }

  /** Abre a ordem de coleta e inicia a janela de SLA. */
  function openCollectionOrder(contract, triggeredAt = new Date()) {
    const dueDate = addBusinessDays(triggeredAt, ReciclData.SLA_BUSINESS_DAYS);
    return ReciclState.addCollection({
      id: generateId('col'),
      protocol: generateProtocol(),
      requesterType: 'empresa',
      requesterName: contract.clientName,
      origin: 'contrato',
      collectionType: 'recorrente',
      materials: contract.materials || ['papelao', 'plastico', 'papel', 'metal'],
      quantityLabel: 'Conforme acúmulo do período',
      address: contract.address,
      status: 'solicitada',
      date: toISODate(triggeredAt),
      slaOpenedAt: toISODate(triggeredAt),
      slaDueAt: toISODate(dueDate),
    });
  }

  /**
   * Verifica se o prazo da frequência venceu e, em caso positivo, abre a ordem.
   * Chamado na inicialização do app e ao alterar a frequência.
   */
  function runSchedulingEngine(now = new Date()) {
    const { contract } = ReciclState.appState;
    if (!contract || !contract.active) return null;
    if (!contract.nextTriggerDate) return null;

    const isDue = new Date(contract.nextTriggerDate) <= ReciclUtils.startOfDay(now);
    if (!isDue) return null;

    // Não abre uma nova ordem se ainda existe uma do contrato em aberto.
    const hasOpenOrder = ReciclState.appState.collections.some(
      (item) => item.origin === 'contrato' && item.status !== 'validado' && item.status !== 'cancelada',
    );
    if (hasOpenOrder) return null;

    const collection = openCollectionOrder(contract, now);
    ReciclState.updateContract({
      lastTriggerDate: toISODate(now),
      nextTriggerDate: calculateNextTrigger(now, contract.frequency),
    });
    ReciclState.addNotification({
      profile: 'empresa',
      title: 'Coleta aberta automaticamente',
      body: `Prazo do contrato cumprido. A retirada deve ocorrer em até ${ReciclData.SLA_BUSINESS_DAYS} dias úteis.`,
    });
    ReciclState.addNotification({
      profile: 'catador',
      title: 'Nova oportunidade próxima',
      body: `${contract.clientName} — coleta disponível no mapa.`,
    });
    return collection;
  }

  /** Situação da janela de SLA de uma coleta, para exibição. */
  function getSlaStatus(collection) {
    if (!collection.slaDueAt) return null;
    const remaining = businessDaysUntil(collection.slaDueAt);
    const isClosed = collection.status === 'validado' || collection.status === 'retirado';

    let tone = 'badge-turquesa';
    let label = `${remaining} dia(s) útil(eis) restante(s)`;
    if (remaining < 0) {
      tone = 'badge-error';
      label = `Atrasada em ${Math.abs(remaining)} dia(s) útil(eis)`;
    } else if (remaining === 0) {
      tone = 'badge-warning';
      label = 'Vence hoje';
    } else if (remaining <= 2) {
      tone = 'badge-warning';
    }
    return { remaining, tone, label, isClosed };
  }

  /** Retirada feita dentro do prazo? Alimenta a consistência do selo. */
  function wasCollectedOnTime(collection) {
    if (!collection.slaDueAt || !collection.pickedUpAt) return true;
    return new Date(collection.pickedUpAt) <= new Date(collection.slaDueAt);
  }

  /** Usado na demonstração para não precisar esperar dias reais. */
  function forceTriggerNow() {
    const { contract } = ReciclState.appState;
    if (!contract || !contract.active) return null;
    ReciclState.updateContract({ nextTriggerDate: toISODate(new Date()) });
    return runSchedulingEngine();
  }

  return {
    getFrequency,
    calculateNextTrigger,
    runSchedulingEngine,
    getSlaStatus,
    wasCollectedOnTime,
    forceTriggerNow,
  };
})();
