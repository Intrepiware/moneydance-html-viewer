import { validDate, validExportDate, SnapshotError } from './snapshot.mjs';

export function formatExportDate(stamp, { locale, timeZone } = {}) {
  if (!validExportDate(stamp)) throw new SnapshotError('INVALID_SNAPSHOT', 'exportDate');
  return 'As of: ' + new Intl.DateTimeFormat(locale, {
    year:'numeric', month:'numeric', day:'numeric', hour:'numeric', minute:'2-digit',
    second:'2-digit', timeZoneName:'short', timeZone,
  }).format(new Date(stamp));
}

export function transactionDateParts(date) {
  if (!validDate(date)) throw new SnapshotError('INVALID_SNAPSHOT', 'entry.date');
  const [year, month, day] = date.split('-');
  return {year, month, day};
}
