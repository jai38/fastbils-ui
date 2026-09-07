import { describe, it, expect } from 'vitest';
import Big from 'big.js';
import { formatIndianCurrency } from './money';

describe('formatIndianCurrency', () => {
  it('formats zero correctly', () => {
    expect(formatIndianCurrency('0')).toBe('₹ 0.00');
    expect(formatIndianCurrency(0)).toBe('₹ 0.00');
  });

  it('formats small amounts below one thousand', () => {
    expect(formatIndianCurrency('45.5')).toBe('₹ 45.50');
    expect(formatIndianCurrency('750')).toBe('₹ 750.00');
  });

  it('formats thousands with single comma', () => {
    expect(formatIndianCurrency('1500')).toBe('₹ 1,500.00');
    expect(formatIndianCurrency('14250')).toBe('₹ 14,250.00');
  });

  it('formats lakhs correctly using Indian digit grouping', () => {
    expect(formatIndianCurrency('2350000')).toBe('₹ 23,50,000.00');
    expect(formatIndianCurrency('100000')).toBe('₹ 1,00,000.00');
  });

  it('formats crores correctly', () => {
    expect(formatIndianCurrency('10000000')).toBe('₹ 1,00,00,000.00');
    expect(formatIndianCurrency('125000000.75')).toBe('₹ 12,50,00,000.75');
  });

  it('formats worked example A grand total and round-off from DOMAIN.md section 5.3', () => {
    expect(formatIndianCurrency('23984.00')).toBe('₹ 23,984.00');
    expect(formatIndianCurrency('20651.10')).toBe('₹ 20,651.10');
    expect(formatIndianCurrency('3333.14')).toBe('₹ 3,333.14');
    expect(formatIndianCurrency('-0.24')).toBe('-₹ 0.24');
  });

  it('handles Big instances directly', () => {
    const amount = new Big('6401.10');
    expect(formatIndianCurrency(amount)).toBe('₹ 6,401.10');
  });
});
