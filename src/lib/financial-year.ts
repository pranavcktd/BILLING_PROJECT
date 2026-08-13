export function financialYearLabel(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const fyStartYear = month >= 4 ? year : year - 1;
  const fyEndYear = fyStartYear + 1;
  return `${fyStartYear}-${String(fyEndYear).slice(-2)}`;
}
