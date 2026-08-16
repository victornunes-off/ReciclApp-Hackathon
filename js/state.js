/**
 * ReciclApp — estado centralizado da aplicação e persistência em localStorage.
 * Nenhuma senha, token ou dado sensível é armazenado.
 */

const ReciclState = (() => {
  const STORAGE_KEY = 'reciclapp_state_v1';

  const appState = {
    currentProfile: null, // 'usuario' | 'empresa' | 'catador'
    currentUser: null, // { name, orgName? }
    collectorAvailable: true,
    collections: [],
    notifications: [],
    demoModeActive: false,
  };

  function isQuotaError(error) {
    return error instanceof DOMException
      && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
  }

  /**
   * Descarta as fotos da coleta concluída mais antiga para liberar espaço.
   * Retorna false quando não há mais nada a descartar.
   */
  function dropOldestPhotos() {
    for (let index = appState.collections.length - 1; index >= 0; index -= 1) {
      const collection = appState.collections[index];
      if (collection.photosOrigin?.length || collection.photosPickup?.length) {
        collection.photosOrigin = [];
        collection.photosPickup = [];
        collection.photosDiscarded = true;
        return true;
      }
    }
    return false;
  }

  function persist() {
    while (true) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        return;
      } catch (error) {
        // Fotos são o que pesa no armazenamento: libera as mais antigas e tenta de novo.
        if (isQuotaError(error) && dropOldestPhotos()) continue;
        console.warn('Não foi possível salvar o estado local.', error);
        return;
      }
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      Object.assign(appState, parsed);
      return true;
    } catch (error) {
      console.warn('Não foi possível carregar o estado local.', error);
      return false;
    }
  }

  function reset() {
    appState.currentProfile = null;
    appState.currentUser = null;
    appState.collectorAvailable = true;
    appState.collections = [];
    appState.notifications = [];
    appState.demoModeActive = false;
    persist();
  }

  function setProfile(profile, user) {
    appState.currentProfile = profile;
    appState.currentUser = user;
    persist();
  }

  function addCollection(collection) {
    appState.collections.unshift(collection);
    persist();
    return collection;
  }

  function updateCollection(id, changes) {
    const target = appState.collections.find((item) => item.id === id);
    if (!target) return null;
    Object.assign(target, changes);
    persist();
    return target;
  }

  function getCollection(id) {
    return appState.collections.find((item) => item.id === id) || null;
  }

  function getCollectionsByProfile(profile) {
    if (profile === 'empresa') {
      return appState.collections.filter((item) => item.requesterType === 'empresa');
    }
    if (profile === 'usuario') {
      return appState.collections.filter((item) => item.requesterType === 'usuario');
    }
    return appState.collections;
  }

  function addNotification(notification) {
    appState.notifications.unshift({
      id: ReciclUtils.generateId('notif'),
      read: false,
      createdAt: new Date().toISOString(),
      ...notification,
    });
    persist();
  }

  function markNotificationsRead(profile) {
    appState.notifications
      .filter((notif) => notif.profile === profile)
      .forEach((notif) => { notif.read = true; });
    persist();
  }

  function getUnreadCount(profile) {
    return appState.notifications.filter((notif) => notif.profile === profile && !notif.read).length;
  }

  function getNotificationsByProfile(profile) {
    return appState.notifications.filter((notif) => notif.profile === profile);
  }

  function setCollectorAvailability(isAvailable) {
    appState.collectorAvailable = isAvailable;
    persist();
  }

  function seedDemoData() {
    reset();
    appState.demoModeActive = true;

    const now = Date.now();
    const isoDaysAgo = (days) => new Date(now - days * 86400000).toISOString().slice(0, 10);

    appState.collections = [
      {
        id: 'col-1010',
        protocol: '1010',
        requesterType: 'usuario',
        requesterName: 'Ana Beatriz',
        materials: ['papelao', 'plastico'],
        quantityLabel: '12 kg',
        weightFinal: 12,
        quality: 91,
        status: 'concluida',
        date: isoDaysAgo(6),
        address: 'Rua das Palmeiras, 123',
        collectorName: 'Carlos Mendes',
      },
      {
        id: 'col-1017',
        protocol: '1017',
        requesterType: 'empresa',
        requesterName: 'Empresa Verde Ltda.',
        collectionType: 'esporadica',
        materials: ['papel', 'metal'],
        quantityLabel: 'Média',
        weightFinal: 44,
        quality: 88,
        status: 'concluida',
        date: isoDaysAgo(4),
        address: 'Av. Imigrantes, 500',
        collectorName: 'Mariana Souza',
      },
    ];

    appState.notifications = [
      { id: ReciclUtils.generateId('notif'), profile: 'empresa', read: false, createdAt: new Date(now - 3600000).toISOString(), title: 'Carlos aceitou sua coleta', body: 'Coleta #1017 está em andamento.' },
      { id: ReciclUtils.generateId('notif'), profile: 'catador', read: false, createdAt: new Date(now - 7200000).toISOString(), title: 'Nova oportunidade próxima', body: 'Empresa Verde · 1,8 km de distância.' },
      { id: ReciclUtils.generateId('notif'), profile: 'usuario', read: true, createdAt: new Date(now - 86400000).toISOString(), title: 'Coleta concluída', body: 'Sua coleta de 12 kg foi finalizada.' },
    ];

    persist();
  }

  function ensureLoaded() {
    const hadStoredState = load();
    if (!hadStoredState) {
      persist();
    }
    return appState;
  }

  return {
    appState,
    ensureLoaded,
    persist,
    reset,
    setProfile,
    addCollection,
    updateCollection,
    getCollection,
    getCollectionsByProfile,
    addNotification,
    markNotificationsRead,
    getUnreadCount,
    getNotificationsByProfile,
    setCollectorAvailability,
    seedDemoData,
  };
})();
