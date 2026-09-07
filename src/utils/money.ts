import Big from 'big.js';

// Configure global default rounding to HALF_UP (Big.roundHalfUp = 1)
Big.RM = 1;

/**
 * Formats a monetary value using Indian digit grouping (lakhs and crores) and the Rupee symbol.
 * Example:
 *  "2350000"    -> "₹ 23,50,000.00"
 *  "23984.24"   -> "₹ 23,984.24"
 *  "-0.24"      -> "-₹ 0.24"
 *  "0"          -> "₹ 0.00"
 */
export function formatIndianCurrency(amount: string | number | Big): string {
  if (amount === null || amount === undefined || amount === '') {
    return '₹ 0.00';
  }

  const b = amount instanceof Big ? amount : new Big(amount);
  const isNegative = b.lt(0);
  const absoluteString = b.abs().toFixed(2);

  const [intPart, decPart] = absoluteString.split('.');

  let formattedInt = '';
  if (intPart.length <= 3) {
    formattedInt = intPart;
  } else {
    const lastThree = intPart.slice(-3);
    const otherDigits = intPart.slice(0, -3);
    const groupedOthers = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInt = `${groupedOthers},${lastThree}`;
  }

  const sign = isNegative ? '-₹ ' : '₹ ';
  return `${sign}${formattedInt}.${decPart}`;
}

export const formatRupees = formatIndianCurrency;

/**
 * Creates a safe Big instance initialized from a string or number.
 */
export function toBig(value: string | number | Big): Big {
  return value instanceof Big ? value : new Big(value || '0');
}
