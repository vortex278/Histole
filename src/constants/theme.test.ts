/// <reference types="jest" />

import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';

describe('theme constants', () => {
  it('provides the shared color themes', () => {
    expect(Colors.light.background).toBe('#2f3234');
    expect(Colors.dark.background).toBe('#2f3234');
  });

  it('keeps spacing and layout values stable', () => {
    expect(Spacing.three).toBe(16);
    expect(Spacing.six).toBe(64);
    expect(MaxContentWidth).toBe(800);
    expect(typeof BottomTabInset).toBe('number');
  });
});