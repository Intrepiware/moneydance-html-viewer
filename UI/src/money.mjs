export function cents(value) {
  if (!Number.isSafeInteger(value)) throw new RangeError('INVALID_CENTS');
  return value;
}
export function addCents(a, b) { return cents(cents(a) + cents(b)); }
export function parseUsd(value) {
  if (typeof value !== 'string' || !/^-?\$?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(value)) throw new RangeError('INVALID_USD');
  const negative = value.startsWith('-');
  const [whole, fraction = ''] = value.replace(/[-$,]/g, '').split('.');
  const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return cents(Number(negative ? -amount : amount));
}
export function formatUsd(value) {
  const amount = BigInt(cents(value)), abs = amount < 0n ? -amount : amount;
  const whole = (abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${amount < 0n ? '-' : ''}$${whole}.${(abs % 100n).toString().padStart(2, '0')}`;
}
