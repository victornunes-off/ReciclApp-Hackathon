/**
 * ReciclApp — captura de fotos do material (origem e coleta).
 *
 * As fotos comprovam qualidade, volume e modo de acondicionamento.
 * Como o protótipo não tem backend, cada imagem é redimensionada e convertida
 * em data URL antes de ir para o localStorage — sem isso, uma única foto de
 * celular (vários MB) estouraria a cota do navegador.
 */

const ReciclPhotos = (() => {
  const { el } = ReciclUtils;

  const MAX_PHOTOS = 3;
  const MAX_EDGE = 720;          // maior lado, em px, após o redimensionamento
  const JPEG_QUALITY = 0.72;
  const MAX_FILE_BYTES = 25 * 1024 * 1024;

  const STAGE_LABELS = {
    origem: 'Origem (na solicitação)',
    coleta: 'Coleta (no recolhimento)',
  };

  /** Redimensiona e recomprime a imagem, devolvendo uma data URL leve. */
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
        image.onload = () => {
          const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
          const width = Math.max(1, Math.round(image.width * scale));
          const height = Math.max(1, Math.round(image.height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(image, 0, 0, width, height);

          try {
            resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
          } catch (error) {
            reject(error);
          }
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------- Visualizador ampliado ----------
  function openViewer(src) {
    const viewer = document.getElementById('photo-viewer');
    if (!viewer) return;
    viewer.querySelector('img').src = src;
    viewer.classList.add('is-open');
    viewer.setAttribute('aria-hidden', 'false');
    viewer.querySelector('.photo-viewer-close').focus();
  }

  function closeViewer() {
    const viewer = document.getElementById('photo-viewer');
    if (!viewer) return;
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden', 'true');
    viewer.querySelector('img').removeAttribute('src');
  }

  function buildThumb(src, index, onRemove) {
    const thumb = el('div', { class: 'photo-thumb' }, [
      el('img', {
        src,
        alt: `Foto ${index + 1} do material`,
        onClick: () => openViewer(src),
      }),
    ]);
    if (onRemove) {
      thumb.appendChild(el('button', {
        type: 'button',
        class: 'photo-remove',
        'aria-label': `Remover foto ${index + 1}`,
        text: '×',
        onClick: () => onRemove(index),
      }));
    }
    return thumb;
  }

  /**
   * Campo de captura de fotos.
   * `photos` é mutado no lugar e devolvido em onChange.
   */
  function createField(container, { photos, max = MAX_PHOTOS, onChange = () => {}, hint } = {}) {
    const inputId = ReciclUtils.generateId('photo-input');
    const cameraId = ReciclUtils.generateId('photo-camera');
    let isBusy = false;

    function setBusy(value) {
      isBusy = value;
      render();
    }

    async function addFiles(fileList) {
      const remaining = max - photos.length;
      if (remaining <= 0) {
        ReciclComponents.showToast(`Máximo de ${max} fotos por etapa.`, 'error');
        return;
      }

      const images = [...fileList].filter((file) => file.type.startsWith('image/'));
      if (!images.length) {
        ReciclComponents.showToast('Selecione um arquivo de imagem.', 'error');
        return;
      }

      setBusy(true);
      for (const file of images.slice(0, remaining)) {
        if (file.size > MAX_FILE_BYTES) {
          ReciclComponents.showToast('Imagem muito grande — escolha outra.', 'error');
          continue;
        }
        try {
          photos.push(await compressImage(file));
        } catch (error) {
          console.warn('Falha ao processar imagem.', error);
          ReciclComponents.showToast('Não foi possível processar essa imagem.', 'error');
        }
      }
      setBusy(false);
      onChange(photos);
    }

    function removeAt(index) {
      photos.splice(index, 1);
      onChange(photos);
      render();
    }

    function fileInput(id, useCamera) {
      const input = el('input', {
        type: 'file',
        id,
        accept: 'image/*',
        multiple: !useCamera,
        class: 'sr-only',
      });
      if (useCamera) input.setAttribute('capture', 'environment');
      input.addEventListener('change', (event) => {
        addFiles(event.target.files);
        event.target.value = '';
      });
      return input;
    }

    function render() {
      container.innerHTML = '';
      const isFull = photos.length >= max;

      if (photos.length) {
        const grid = el('div', { class: 'photo-grid' });
        photos.forEach((src, index) => grid.appendChild(buildThumb(src, index, removeAt)));
        container.appendChild(grid);
      }

      if (isBusy) {
        container.appendChild(el('p', { class: 'text-xs text-muted', text: 'Processando imagem...' }));
      }

      const actions = el('div', { class: 'photo-actions' }, [
        el('label', { class: 'btn btn-outline btn-sm', for: cameraId, 'aria-disabled': String(isFull) }, [
          el('span', { html: CAMERA_ICON, 'aria-hidden': 'true' }),
          el('span', { text: photos.length ? 'Nova foto' : 'Tirar foto' }),
        ]),
        el('label', { class: 'btn btn-ghost btn-sm', for: inputId, 'aria-disabled': String(isFull) }, [
          el('span', { text: 'Escolher da galeria' }),
        ]),
        fileInput(cameraId, true),
        fileInput(inputId, false),
      ]);
      if (isFull) actions.classList.add('is-disabled');
      container.appendChild(actions);

      container.appendChild(el('p', {
        class: 'text-xs text-muted mb-0',
        text: hint || `Até ${max} fotos — ajudam a avaliar qualidade, volume e acondicionamento.`,
      }));
    }

    render();
    return { render };
  }

  /** Galeria somente leitura (usada nas telas de acompanhamento). */
  function renderGallery(container, photos, { label, emptyText } = {}) {
    container.innerHTML = '';
    if (label) {
      container.appendChild(el('h4', { class: 'photo-gallery-label', text: label }));
    }
    if (!photos || !photos.length) {
      container.appendChild(el('p', {
        class: 'text-xs text-muted mb-0',
        text: emptyText || 'Nenhuma foto registrada nesta etapa.',
      }));
      return;
    }
    const grid = el('div', { class: 'photo-grid' });
    photos.forEach((src, index) => grid.appendChild(buildThumb(src, index, null)));
    container.appendChild(grid);
  }

  /** Comparativo origem x coleta — a evidência visual do IQC. */
  function renderComparison(container, collection) {
    container.innerHTML = '';
    const origin = collection.photosOrigin || [];
    const pickup = collection.photosPickup || [];
    if (!origin.length && !pickup.length) {
      container.appendChild(el('p', {
        class: 'text-xs text-muted mb-0',
        text: 'Nenhuma foto registrada para esta coleta.',
      }));
      return;
    }
    [['origem', origin], ['coleta', pickup]].forEach(([stage, photos]) => {
      const block = el('div', { class: 'photo-stage' });
      renderGallery(block, photos, {
        label: STAGE_LABELS[stage],
        emptyText: stage === 'coleta'
          ? 'O catador ainda não registrou fotos.'
          : 'Sem fotos na solicitação.',
      });
      container.appendChild(block);
    });
  }

  const CAMERA_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8V6a2 2 0 0 1 2-2h1.5L9 2h6l1.5 2H18a2 2 0 0 1 2 2v2"/><rect x="2" y="8" width="20" height="12" rx="2"/><circle cx="12" cy="14" r="3.2"/></svg>';

  function init() {
    const viewer = document.getElementById('photo-viewer');
    if (!viewer) return;
    viewer.addEventListener('click', (event) => {
      if (event.target === viewer || event.target.closest('.photo-viewer-close')) closeViewer();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeViewer();
    });
  }

  return { init, createField, renderGallery, renderComparison, compressImage, MAX_PHOTOS };
})();
