/**
 * Formatter utilities for currency, dates, numbers, and tags.
 */

export function formatCurrency(amount, currency = "TND") {
  if (amount === undefined || amount === null) return `0 ${currency}`;
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  return `${num.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatDateFR(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function formatHours(hours) {
  if (!hours) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

export function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // Past midnight
  }
  
  const diffMinutes = endMinutes - startMinutes;
  return +(diffMinutes / 60).toFixed(2);
}
