import { describe, expect, it } from 'vitest';
import { calculateMatchSplit } from './split-cost';

describe('calculateMatchSplit', () => {
  it('splits evenly when total is an exact multiple of 1,000 VND per player', () => {
    const result = calculateMatchSplit({
      courtFeeTotal: 200000,
      shuttlecockCost: 60000,
      presentPlayerCount: 4,
    });

    expect(result).toEqual({
      totalCost: 260000,
      presentPlayerCount: 4,
      rawFeePerPlayer: 65000,
      roundedFeePerPlayer: 65000,
      clubFundSurplus: 0,
      currency: 'VND',
    });
  });

  it('rounds per-player fee up to the nearest 1,000 VND and tracks surplus', () => {
    const result = calculateMatchSplit({
      courtFeeTotal: 190000,
      shuttlecockCost: 60000,
      presentPlayerCount: 6,
    });

    // 250,000 / 6 = 41,666.67 -> ceil to 1,000 = 42,000; 42,000 * 6 - 250,000 = 2,000
    expect(result).toEqual({
      totalCost: 250000,
      presentPlayerCount: 6,
      rawFeePerPlayer: 41667,
      roundedFeePerPlayer: 42000,
      clubFundSurplus: 2000,
      currency: 'VND',
    });
  });

  it('includes optional extraCost in the total calculation', () => {
    const result = calculateMatchSplit({
      courtFeeTotal: 200000,
      shuttlecockCost: 50000,
      extraCost: 30000,
      presentPlayerCount: 7,
    });

    expect(result.totalCost).toBe(280000);
    expect(result.roundedFeePerPlayer).toBe(40000);
    expect(result.clubFundSurplus).toBe(0);
  });

  it('handles zero total cost with zero surplus', () => {
    const result = calculateMatchSplit({
      courtFeeTotal: 0,
      shuttlecockCost: 0,
      presentPlayerCount: 4,
    });

    expect(result.roundedFeePerPlayer).toBe(0);
    expect(result.clubFundSurplus).toBe(0);
  });

  it('throws RangeError when presentPlayerCount is 0 or negative', () => {
    expect(() =>
      calculateMatchSplit({
        courtFeeTotal: 200000,
        shuttlecockCost: 50000,
        presentPlayerCount: 0,
      }),
    ).toThrow(RangeError);
  });
});
