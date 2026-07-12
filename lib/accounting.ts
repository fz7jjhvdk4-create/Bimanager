/**
 * Delad momsberäkning för kassaboken så att skapande och redigering
 * alltid avrundar likadant (till 2 decimaler).
 */
export function beraknaMoms(beloppExMoms: number, momsSats: number) {
  const momsBelopp = Math.round(beloppExMoms * momsSats * 100) / 100;
  const beloppInklMoms = Math.round((beloppExMoms + momsBelopp) * 100) / 100;
  return { momsBelopp, beloppInklMoms };
}
