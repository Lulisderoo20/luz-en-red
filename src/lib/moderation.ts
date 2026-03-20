const aggressiveTerms = [
  'idiota',
  'estupida',
  'estúpida',
  'odiar',
  'muérete',
  'callate',
  'cállate',
  'maldita',
];

export function findAggressiveLanguage(value: string): string[] {
  const normalized = value.toLowerCase();

  return aggressiveTerms.filter((term) => normalized.includes(term));
}

export function assertSafeText(value: string): void {
  const matches = findAggressiveLanguage(value);

  if (matches.length > 0) {
    throw new Error(
      'Detectamos lenguaje que puede herir a otras hermanas. Revisá el texto antes de publicarlo.',
    );
  }
}
