import { Units } from '../types';

export const weightUnit = (u: Units) => (u === 'imperial' ? 'lb' : 'kg');
export const lengthUnit = (u: Units) => (u === 'imperial' ? 'in' : 'cm');
export const showWeight = (kg: number, u: Units) => (u === 'imperial' ? Math.round(kg * 2.20462 * 10) / 10 : Math.round(kg * 10) / 10);
export const showLength = (cm: number, u: Units) => (u === 'imperial' ? Math.round((cm / 2.54) * 10) / 10 : Math.round(cm * 10) / 10);
export const toKg = (v: number, u: Units) => (u === 'imperial' ? v / 2.20462 : v);
export const toCm = (v: number, u: Units) => (u === 'imperial' ? v * 2.54 : v);
export const showHeight = (cm: number, u: Units) => {
  if (u === 'metric') return `${Math.round(cm)} cm`;
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}′${inches % 12}″`;
};
