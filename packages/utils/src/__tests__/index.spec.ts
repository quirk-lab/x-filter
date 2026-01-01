import { isDefined, isNil } from '../index';

describe('utils', () => {
  describe('isNil', () => {
    it('should return true for null', () => {
      expect(isNil(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isNil(undefined)).toBe(true);
    });

    it('should return false for other values', () => {
      expect(isNil(0)).toBe(false);
      expect(isNil('')).toBe(false);
      expect(isNil(false)).toBe(false);
    });
  });

  describe('isDefined', () => {
    it('should return false for null', () => {
      expect(isDefined(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isDefined(undefined)).toBe(false);
    });

    it('should return true for other values', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
    });
  });
});
