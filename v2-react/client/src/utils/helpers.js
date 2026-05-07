import { canPerformAction } from './workflow';

export function isValidTransfer(fromCode, toCode) {
  const rules = [
    { from: 'B1', to: 'B2' },
    { from: 'B1', to: 'B3' },
    { from: 'B3', to: 'B1' },
    { from: 'B3', to: 'B2' },
  ];
  return rules.some(r => r.from === fromCode && r.to === toCode);
}

export function getAvailableDestinations(fromCode) {
  const map = {
    B1: ['B2', 'B3'],
    B3: ['B1', 'B2'],
  };
  return map[fromCode] || [];
}

/**
 * Returns which stores a given role can ORDER FROM (i.e. the "from" side of a transfer).
 *
 * B1 orders noodles from B3            → B3 → B1
 * B2 orders items from B1 or noodles from B3 → B1/B3 → B2
 * B3 orders items from B1             → B1 → B3
 */
export function getAvailableSources(role) {
  switch (role) {
    case 'admin':      return ['B1', 'B3'];
    case 'b1':         return ['B3'];          // B1 receives noodles from B3
    case 'b2':         return ['B1', 'B3'];    // B2 receives from B1 and B3
    case 'b3':         return ['B1'];          // B3 receives items from B1
    case 'accountant': return ['B1', 'B3'];
    default:           return [];
  }
}

/**
 * Returns the default "to" store for a role when creating a new order.
 * Each store's users order TO their own store.
 */
export function getDefaultToStore(role) {
  switch (role) {
    case 'b1': return 'B1';
    case 'b2': return 'B2';
    case 'b3': return 'B3';
    default:   return null;
  }
}

/**
 * Returns the default "from" store for a role (first available source).
 */
export function getDefaultFromStore(role) {
  const sources = getAvailableSources(role);
  return sources[0] || null;
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
