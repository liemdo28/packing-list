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

export function getAvailableSources(role) {
  switch (role) {
    case 'admin': return ['B1', 'B3'];
    case 'b1': return ['B1'];
    case 'b3': return ['B3'];
    default: return [];
  }
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
