import { CURRENCY, type CurrencyCode, MONEY_ROUNDING_UNIT } from '@smash-bill/shared';

export interface SplitCalculationInput {
  courtFeeTotal: number;
  shuttlecockCost: number;
  extraCost?: number;
  presentPlayerCount: number;
}

export interface SplitCalculationResult {
  totalCost: number;
  presentPlayerCount: number;
  rawFeePerPlayer: number;
  roundedFeePerPlayer: number;
  clubFundSurplus: number;
  currency: CurrencyCode;
}

/**
 * Pure domain calculation that splits match expenses evenly across present players,
 * rounding each player's share up to the nearest 1,000 VND (ADR-002).
 */
export function calculateMatchSplit(input: SplitCalculationInput): SplitCalculationResult {
  const { courtFeeTotal, shuttlecockCost, extraCost = 0, presentPlayerCount } = input;

  if (!Number.isInteger(presentPlayerCount) || presentPlayerCount <= 0) {
    throw new RangeError('presentPlayerCount must be a positive integer');
  }

  if (courtFeeTotal < 0 || shuttlecockCost < 0 || extraCost < 0) {
    throw new RangeError('Expense amounts cannot be negative');
  }

  const totalCost = courtFeeTotal + shuttlecockCost + extraCost;
  if (totalCost === 0) {
    return {
      totalCost: 0,
      presentPlayerCount,
      rawFeePerPlayer: 0,
      roundedFeePerPlayer: 0,
      clubFundSurplus: 0,
      currency: CURRENCY,
    };
  }

  const rawFeePerPlayer = totalCost / presentPlayerCount;
  const roundedFeePerPlayer =
    Math.ceil(rawFeePerPlayer / MONEY_ROUNDING_UNIT) * MONEY_ROUNDING_UNIT;
  const clubFundSurplus = roundedFeePerPlayer * presentPlayerCount - totalCost;

  return {
    totalCost,
    presentPlayerCount,
    rawFeePerPlayer: Math.round(rawFeePerPlayer),
    roundedFeePerPlayer,
    clubFundSurplus,
    currency: CURRENCY,
  };
}
