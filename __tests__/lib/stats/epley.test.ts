import { calculateEpley1RM } from '../../../src/lib/stats/epley';

describe('calculateEpley1RM', () => {
  it('returns correct 1RM for standard input', () => {
    // 135 × (1 + 8/30) = 135 × 1.2667 = 171.0
    expect(calculateEpley1RM(135, 8)).toBeCloseTo(171.0, 0);
  });

  it('returns correct 1RM for single rep (weight = 1RM)', () => {
    // 200 × (1 + 1/30) = 200 × 1.0333 = 206.67
    expect(calculateEpley1RM(200, 1)).toBeCloseTo(206.67, 1);
  });

  it('returns 0 when weight is 0', () => {
    expect(calculateEpley1RM(0, 10)).toBe(0);
  });

  it('returns 0 when weight is negative', () => {
    expect(calculateEpley1RM(-10, 10)).toBe(0);
  });

  it('returns 0 when reps is 0', () => {
    expect(calculateEpley1RM(135, 0)).toBe(0);
  });

  it('returns 0 when reps is negative', () => {
    expect(calculateEpley1RM(135, -1)).toBe(0);
  });

  it('scales linearly with weight at same reps', () => {
    const at100 = calculateEpley1RM(100, 5);
    const at200 = calculateEpley1RM(200, 5);
    expect(at200).toBeCloseTo(at100 * 2, 5);
  });

  // Stubs — behaviors worth testing but not yet implemented
  it.todo('handles very high rep counts (e.g. 100 reps) without overflow');
  it.todo('returns a higher 1RM estimate when reps increase for same weight');
});
