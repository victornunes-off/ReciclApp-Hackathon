/**
 * ReciclApp — utilitários genéricos (formatação, validação, DOM seguro).
 */

const ReciclUtils = (() => {
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false) return;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key.startsWith('on') && typeof value === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'html') {
        // Uso restrito: apenas para markup estático confiável (SVGs internos).
        node.innerHTML = value;
      } else {
        node.setAttribute(key, value);
      }
    });
    (Array.isArray(children) ? children : [children]).forEach((child) => {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function formatKg(value) {
    const number = Number(value) || 0;
    return `${number.toLocaleString('pt-BR', { minimumFractionDigits: number % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 })} kg`;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString('pt-BR');
  }

  function formatPercent(value) {
    return `${Math.round(Number(value) || 0)}%`;
  }

  function formatCurrencyBR(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /** Aceita tanto "YYYY-MM-DD" quanto um ISO completo com hora. */
  function formatDate(isoDate) {
    if (!isoDate) return '—';
    const hasTime = String(isoDate).includes('T');
    const date = new Date(hasTime ? isoDate : `${isoDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString('pt-BR');
  }

  function formatDateTime(isoDate) {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return isoDate;
    return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  function generateId(prefix = 'id') {
    return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 9999)}`;
  }

  function generateProtocol() {
    return String(1000 + Math.floor(Math.random() * 9000));
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function isFutureOrTodayDate(isoDate) {
    if (!isoDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${isoDate}T00:00:00`);
    return target.getTime() >= today.getTime();
  }

  function clampText(value, maxLength) {
    return String(value || '').slice(0, maxLength);
  }

  function startOfDay(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  /** Soma dias úteis (pula sábado e domingo). Feriados ficam fora do escopo do protótipo. */
  function addBusinessDays(date, businessDays) {
    const result = startOfDay(date);
    let added = 0;
    while (added < businessDays) {
      result.setDate(result.getDate() + 1);
      if (!isWeekend(result)) added += 1;
    }
    return result;
  }

  /** Dias úteis restantes até a data (0 = vence hoje, negativo = atrasado). */
  function businessDaysUntil(isoDate, from = new Date()) {
    const target = startOfDay(new Date(isoDate));
    const cursor = startOfDay(from);
    if (target.getTime() === cursor.getTime()) return 0;

    const isPast = target < cursor;
    const [start, end] = isPast ? [target, cursor] : [cursor, target];
    let count = 0;
    const walker = new Date(start);
    while (walker < end) {
      walker.setDate(walker.getDate() + 1);
      if (!isWeekend(walker)) count += 1;
    }
    return isPast ? -count : count;
  }

  function addDays(date, days) {
    const result = startOfDay(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function toISODate(date) {
    return startOfDay(date).toISOString().slice(0, 10);
  }

  function debounce(fn, wait = 250) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  return {
    el,
    formatKg,
    formatNumber,
    formatPercent,
    formatCurrencyBR,
    formatDate,
    formatDateTime,
    generateId,
    generateProtocol,
    isValidEmail,
    isFutureOrTodayDate,
    clampText,
    debounce,
    startOfDay,
    addBusinessDays,
    businessDaysUntil,
    addDays,
    toISODate,
  };
})();
