const MICROCREDITS_PER_MILLION = 1_000_000;

type FormatCreditsOptions = {
  approximate?: boolean;
  precision?: number;
  showSign?: boolean;
};

export function formatCredits(
  microcredits: number,
  {
    approximate = false,
    precision = 2,
    showSign = false,
  }: FormatCreditsOptions = {},
) {
  const credits = microcredits / MICROCREDITS_PER_MILLION;
  const sign = showSign && microcredits > 0 ? "+" : "";
  const estimate = approximate ? "~" : "";

  return `${estimate}${sign}${credits.toFixed(precision)}M`;
}

export function formatCreditBalance(microcredits: number) {
  return formatCredits(microcredits, { precision: 2 });
}

export function formatCreditEstimate(microcredits: number) {
  return formatCredits(microcredits, { approximate: true, precision: 4 });
}

export function formatCreditDelta(microcredits: number) {
  return formatCredits(microcredits, { precision: 4, showSign: true });
}
