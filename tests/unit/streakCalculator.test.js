/**
 * Unit tests for Streak Calculator
 */

import { describe, it, expect } from 'vitest';
import { calculateBestStreak } from '../../src/utils/streakCalculator.js';

describe('calculateBestStreak', () => {
  describe('edge cases', () => {
    it('should return 0 for empty array', () => {
      expect(calculateBestStreak([])).toBe(0);
    });

    it('should return 0 for null input', () => {
      expect(calculateBestStreak(null)).toBe(0);
    });

    it('should return 0 for undefined input', () => {
      expect(calculateBestStreak(undefined)).toBe(0);
    });
  });

  describe('single meal', () => {
    it('should return 1 for single on-diet meal', () => {
      const meals = [{ is_on_diet: true }];
      expect(calculateBestStreak(meals)).toBe(1);
    });

    it('should return 0 for single off-diet meal', () => {
      const meals = [{ is_on_diet: false }];
      expect(calculateBestStreak(meals)).toBe(0);
    });
  });

  describe('all on-diet', () => {
    it('should return count of meals when all are on-diet', () => {
      const meals = [
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: true },
      ];
      expect(calculateBestStreak(meals)).toBe(4);
    });
  });

  describe('all off-diet', () => {
    it('should return 0 when all meals are off-diet', () => {
      const meals = [
        { is_on_diet: false },
        { is_on_diet: false },
        { is_on_diet: false },
      ];
      expect(calculateBestStreak(meals)).toBe(0);
    });
  });

  describe('streak broken', () => {
    it('should return best streak when broken by off-diet meal', () => {
      // on, on, on, OFF, on, on -> best = 3
      const meals = [
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: false },
        { is_on_diet: true },
        { is_on_diet: true },
      ];
      expect(calculateBestStreak(meals)).toBe(3);
    });
  });

  describe('best streak at end', () => {
    it('should find best streak even if at the end', () => {
      // on, OFF, on, on, on, on -> best = 4
      const meals = [
        { is_on_diet: true },
        { is_on_diet: false },
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: true },
      ];
      expect(calculateBestStreak(meals)).toBe(4);
    });
  });

  describe('tie - first sequence wins', () => {
    it('should return first sequence when there is a tie', () => {
      // on, on, on, OFF, on, on, on -> both sequences are 3, should return 3
      const meals = [
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: false },
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: true },
      ];
      expect(calculateBestStreak(meals)).toBe(3);
    });
  });

  describe('alternating', () => {
    it('should return 1 for alternating pattern', () => {
      // on, OFF, on, OFF, on, OFF -> best = 1
      const meals = [
        { is_on_diet: true },
        { is_on_diet: false },
        { is_on_diet: true },
        { is_on_diet: false },
        { is_on_diet: true },
        { is_on_diet: false },
      ];
      expect(calculateBestStreak(meals)).toBe(1);
    });
  });

  describe('complex patterns', () => {
    it('should handle complex pattern correctly', () => {
      // OFF, on, on, OFF, on, on, on, on, OFF, on -> best = 4
      const meals = [
        { is_on_diet: false },
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: false },
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: false },
        { is_on_diet: true },
      ];
      expect(calculateBestStreak(meals)).toBe(4);
    });

    it('should handle starting with off-diet meals', () => {
      // OFF, OFF, on, on, on -> best = 3
      const meals = [
        { is_on_diet: false },
        { is_on_diet: false },
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: true },
      ];
      expect(calculateBestStreak(meals)).toBe(3);
    });

    it('should handle ending with off-diet meal', () => {
      // on, on, on, OFF -> best = 3
      const meals = [
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: true },
        { is_on_diet: false },
      ];
      expect(calculateBestStreak(meals)).toBe(3);
    });
  });

  describe('long streaks', () => {
    it('should handle long streak correctly', () => {
      const meals = Array(100).fill({ is_on_diet: true });
      expect(calculateBestStreak(meals)).toBe(100);
    });

    it('should handle long streak with break in middle', () => {
      const first50 = Array(50).fill({ is_on_diet: true });
      const breakMeal = { is_on_diet: false };
      const last49 = Array(49).fill({ is_on_diet: true });
      const meals = [...first50, breakMeal, ...last49];
      expect(calculateBestStreak(meals)).toBe(50);
    });
  });
});
