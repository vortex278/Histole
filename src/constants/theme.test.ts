/// <reference types="jest" />

import { BottomTabInset, GameCardColors, MaxContentWidth, Palette, Spacing } from '@/constants/theme';

describe('theme constants', () => {
  it('provides the shared color themes', () => {
    expect(Palette.cream).toBe('#fbf1e9');
    expect(Palette.brown).toBe('#7d6048');
    expect(Palette.green).toBe('#477d4b');
    expect(GameCardColors.correct).toBe('#4caf50');
    expect(GameCardColors.close).toBe('#f2c94c');
    expect(GameCardColors.incorrect).toBe(Palette.cream);
  });

  it('keeps spacing and layout values stable', () => {
    expect(Spacing.three).toBe(16);
    expect(Spacing.six).toBe(64);
    expect(MaxContentWidth).toBe(800);
    expect(typeof BottomTabInset).toBe('number');
  });
});