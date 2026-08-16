/**
 * ReciclApp — dados fictícios e constantes de domínio.
 * Nenhuma informação real de pessoas, empresas ou valores é utilizada.
 */

const ReciclData = (() => {
  const MATERIAL_ICONS = {
    papelao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 8l9-4 9 4-9 4-9-4Z"/><path d="M3 8v8l9 4 9-4V8"/><path d="M12 12v8"/></svg>',
    papel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2h9l3 3v17H6V2Z"/><path d="M15 2v3h3"/><path d="M9 12h6M9 16h6"/></svg>',
    plastico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3h6l1 3v2l1 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9l1-2V6l1-3Z"/><path d="M8 12h8"/></svg>',
    vidro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 2h6l1 5-2 3v10a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2V10L8 7l1-5Z"/></svg>',
    metal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/></svg>',
    outro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>',
  };

  const MATERIALS = [
    { id: 'papelao', label: 'Papelão' },
    { id: 'papel', label: 'Papel' },
    { id: 'plastico', label: 'Plástico' },
    { id: 'vidro', label: 'Vidro' },
    { id: 'metal', label: 'Metal' },
    { id: 'outro', label: 'Outro' },
  ];

  const QUANTITY_OPTIONS = [
    { id: 'pequena', label: 'Pequena quantidade', hint: 'Até 5 kg — cabe em algumas sacolas.' },
    { id: 'media', label: 'Média quantidade', hint: 'Entre 5 kg e 20 kg.' },
    { id: 'grande', label: 'Grande quantidade', hint: 'Acima de 20 kg.' },
  ];

  const QUALITY_LEVELS = [
    { id: 'excelente', label: 'Excelente', pct: 94 },
    { id: 'boa', label: 'Boa', pct: 82 },
    { id: 'contaminada', label: 'Contaminada', pct: 48 },
  ];

  const COLLECTORS = [
    { id: 'col-joao', name: 'João da Silva', rating: 4.9, city: 'Porto Velho' },
    { id: 'col-carlos', name: 'Carlos Mendes', rating: 4.8, city: 'Porto Velho' },
    { id: 'col-mariana', name: 'Mariana Souza', rating: 5.0, city: 'Porto Velho' },
  ];

  const EVENT_NAMES = [
    'Expo Rondônia 2026',
    'Feira Sustentável PVH',
    'Encontro Empresarial Amazônia',
  ];

  const MATERIAL_DISTRIBUTION = [
    { id: 'papelao', label: 'Papelão', pct: 38 },
    { id: 'plastico', label: 'Plástico', pct: 27 },
    { id: 'metal', label: 'Metal', pct: 14 },
    { id: 'vidro', label: 'Vidro', pct: 11 },
    { id: 'papel', label: 'Papel', pct: 10 },
  ];

  const CLASSIFICATION_SAMPLES = [
    {
      label: 'Garrafa PET',
      recyclable: true,
      tips: ['Esvazie o conteúdo.', 'Se possível, compacte a garrafa.', 'Mantenha separada de resíduos orgânicos.'],
    },
    {
      label: 'Caixa de papelão',
      recyclable: true,
      tips: ['Remova fitas adesivas.', 'Desmonte e achate a caixa.', 'Mantenha seca antes do descarte.'],
    },
    {
      label: 'Copo plástico engordurado',
      recyclable: false,
      tips: ['Lave antes de descartar como reciclável.', 'Se não for possível limpar, descarte como rejeito.'],
    },
    {
      label: 'Lata de alumínio',
      recyclable: true,
      tips: ['Enxágue restos de líquido.', 'Pode ser amassada para ocupar menos espaço.'],
    },
  ];

  const OVERVIEW_METRICS = {
    kgRecycled: 12480,
    avgQuality: 94,
    collections: 184,
    activeCollectors: 37,
    companies: 26,
    events: 18,
  };

  const SERVICES = [
    { id: 'sporadic', title: 'Coleta esporádica', desc: 'Para materiais acumulados.' },
    { id: 'event', title: 'Coleta para eventos', desc: 'Para feiras, congressos e eventos corporativos.' },
    { id: 'bulk', title: 'Grandes volumes', desc: 'Para operações maiores, com múltiplos pontos.' },
    { id: 'reports', title: 'Gestão e relatórios', desc: 'Para acompanhamento e comprovação dos resultados.' },
  ];

  /* O ciclo só fecha quando a organização de catadores pesa o material —
     é essa etapa que valida os dados e alimenta o selo do cliente. */
  const STATUS_FLOW = ['solicitada', 'catador_encontrado', 'em_andamento', 'retirado', 'validado'];
  const STATUS_STEP_LABELS = {
    solicitada: 'Coleta aberta',
    catador_encontrado: 'Catador a caminho',
    em_andamento: 'Retirada em andamento',
    retirado: 'Material retirado',
    validado: 'Validado na organização',
  };
  const STATUS_STEP_DESCRIPTIONS = {
    solicitada: 'Disponível para os catadores da região.',
    catador_encontrado: 'Catador escalado para a coleta.',
    em_andamento: 'Coleta em andamento.',
    retirado: 'Aguardando pesagem na organização de catadores.',
    validado: 'Ciclo concluído e impacto contabilizado.',
  };

  /* Periodicidade do contrato. O cliente pode alterar quando quiser. */
  const FREQUENCIES = [
    { id: 'semanal', label: '1 vez por semana', hint: 'Coleta a cada 7 dias.', days: 7 },
    { id: 'quinzenal', label: 'A cada 15 dias', hint: 'Duas coletas por mês.', days: 15 },
    { id: 'mensal', label: '1 vez por mês', hint: 'Coleta a cada 30 dias.', days: 30 },
    { id: 'bimestral', label: 'A cada 2 meses', hint: 'Coleta a cada 60 dias.', days: 60 },
  ];

  const SLA_BUSINESS_DAYS = 5;

  /* Organizações parceiras de Porto Velho (fictícias). */
  const ORGANIZATIONS = [
    { id: 'org-recicla-pvh', name: 'Cooperativa Recicla PVH', district: 'Zona Leste' },
    { id: 'org-mais-vida', name: 'Associação Mais Vida', district: 'Centro' },
    { id: 'org-rio-madeira', name: 'Coop. Rio Madeira', district: 'Zona Sul' },
  ];

  /* Selo de Sustentabilidade: volume validado + consistência de retiradas no prazo. */
  const SEAL_TIERS = [
    { id: 'bronze', label: 'Bronze', minKg: 0, minPunctuality: 0, color: '#A97142' },
    { id: 'prata', label: 'Prata', minKg: 500, minPunctuality: 60, color: '#8C9BA5' },
    { id: 'ouro', label: 'Ouro', minKg: 1500, minPunctuality: 80, color: '#C9A227' },
    { id: 'diamante', label: 'Diamante', minKg: 3000, minPunctuality: 90, color: '#2FA8A0' },
  ];

  /**
   * Retorna o selo atual e o próximo, com o que falta para subir de categoria.
   * A consistência conta: volume alto com atraso não sobe de nível.
   */
  function calculateSeal(totalKg, punctualityPct) {
    let current = SEAL_TIERS[0];
    SEAL_TIERS.forEach((tier) => {
      if (totalKg >= tier.minKg && punctualityPct >= tier.minPunctuality) current = tier;
    });
    const next = SEAL_TIERS[SEAL_TIERS.indexOf(current) + 1] || null;
    return {
      current,
      next,
      kgToNext: next ? Math.max(0, next.minKg - totalKg) : 0,
      punctualityToNext: next ? Math.max(0, next.minPunctuality - punctualityPct) : 0,
    };
  }

  const EMPRESA_BASELINE = {
    kg: 1248,
    quality: 93,
    collections: 32,
    collectors: 12,
    events: 27,
  };

  const CATADOR_BASELINE = {
    collections: 32,
    kg: 840,
    quality: 93,
  };

  function getMaterialLabel(id) {
    return MATERIALS.find((material) => material.id === id)?.label || id;
  }

  function getMaterialIcon(id) {
    return MATERIAL_ICONS[id] || MATERIAL_ICONS.outro;
  }

  function buildCollectionTimelineSteps(status) {
    const currentIndex = STATUS_FLOW.indexOf(status);
    return STATUS_FLOW.map((step, index) => ({
      label: STATUS_STEP_LABELS[step],
      state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending',
    }));
  }

  return {
    MATERIALS,
    MATERIAL_ICONS,
    QUANTITY_OPTIONS,
    QUALITY_LEVELS,
    COLLECTORS,
    EVENT_NAMES,
    MATERIAL_DISTRIBUTION,
    CLASSIFICATION_SAMPLES,
    OVERVIEW_METRICS,
    SERVICES,
    STATUS_FLOW,
    STATUS_STEP_LABELS,
    STATUS_STEP_DESCRIPTIONS,
    FREQUENCIES,
    SLA_BUSINESS_DAYS,
    ORGANIZATIONS,
    SEAL_TIERS,
    EMPRESA_BASELINE,
    CATADOR_BASELINE,
    calculateSeal,
    getMaterialLabel,
    getMaterialIcon,
    buildCollectionTimelineSteps,
  };
})();
