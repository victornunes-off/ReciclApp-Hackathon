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

  const STATUS_FLOW = ['solicitada', 'catador_encontrado', 'em_andamento', 'concluida'];
  const STATUS_STEP_LABELS = {
    solicitada: 'Solicitada',
    catador_encontrado: 'Catador encontrado',
    em_andamento: 'Em andamento',
    concluida: 'Concluída',
  };
  const STATUS_STEP_DESCRIPTIONS = {
    solicitada: 'Estamos procurando um catador disponível.',
    catador_encontrado: 'Catador escalado para a coleta.',
    em_andamento: 'Coleta em andamento.',
    concluida: 'Coleta finalizada com sucesso.',
  };

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
    EMPRESA_BASELINE,
    CATADOR_BASELINE,
    getMaterialLabel,
    getMaterialIcon,
    buildCollectionTimelineSteps,
  };
})();
