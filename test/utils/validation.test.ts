import { describe, it, expect } from 'vitest';
import { isValidEmail, validateEmail, isStrongPassword, validatePassword, isValidNickname, validateNickname, isValidAccessCode, validateAccessCode, isNonEmptyString, isPositiveNumber, isRequired, minLength } from '@/utils/validation';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('first+last@email.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
    });

    it('should reject empty email', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should return valid for correct email', () => {
      const result = validateEmail('test@example.com');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return error for empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Email is required');
    });

    it('should return error for invalid email format', () => {
      const result = validateEmail('notanemail');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid email format');
    });

    it('should return error for email without domain', () => {
      const result = validateEmail('test@');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid email format');
    });
  });

  describe('isStrongPassword', () => {
    it('should validate strong passwords', () => {
      expect(isStrongPassword('StrongPass123')).toBe(true);
      expect(isStrongPassword('MyPassword456')).toBe(true);
      expect(isStrongPassword('Test@1234')).toBe(true);
    });

    it('should reject passwords without uppercase', () => {
      expect(isStrongPassword('strongpass123')).toBe(false);
    });

    it('should reject passwords without lowercase', () => {
      expect(isStrongPassword('STRONGPASS123')).toBe(false);
    });

    it('should reject passwords without number', () => {
      expect(isStrongPassword('StrongPass')).toBe(false);
    });

    it('should reject passwords shorter than 8 characters', () => {
      expect(isStrongPassword('Pass123')).toBe(false);
      expect(isStrongPassword('P1a')).toBe(false);
    });

    it('should reject passwords longer than 128 characters', () => {
      expect(isStrongPassword('A' + 'a1' + 'b'.repeat(127))).toBe(false);
    });

    it('should accept passwords at boundary lengths', () => {
      expect(isStrongPassword('Passw0rd')).toBe(true); // 8 characters
      const longPassword = 'P' + 'a'.repeat(126) + '1'; // 128 characters
      expect(isStrongPassword(longPassword)).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should return valid for strong password', () => {
      const result = validatePassword('StrongPass123');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should return error for empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Password is required');
    });

    it('should return error for short password', () => {
      const result = validatePassword('Pass1');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('8');
    });

    it('should return error for password without uppercase', () => {
      const result = validatePassword('strongpass123');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('uppercase');
    });

    it('should return error for password without lowercase', () => {
      const result = validatePassword('STRONGPASS123');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('lowercase');
    });

    it('should return error for password without number', () => {
      const result = validatePassword('StrongPassword');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('number');
    });

    it('should return error for too long password', () => {
      const longPassword = 'A' + 'a1' + 'b'.repeat(127);
      const result = validatePassword(longPassword);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('128');
    });
  });

  describe('nickname validation', () => {
    it('should accept valid nicknames used when joining events', () => {
      expect(isValidNickname('Ada')).toBe(true);
      expect(isValidNickname('Ada_123')).toBe(true);
      expect(validateNickname('John')).toEqual({ valid: true });
      expect(validateNickname('ABC123')).toEqual({ valid: true });
      expect(validateNickname('Ada_123')).toEqual({ valid: true });
    });

    it('should reject nicknames that the backend will reject', () => {
      expect(validateNickname('A')).toEqual({
        valid: false,
        message: 'Nickname must be at least 2 characters',
      });
      expect(validateNickname('Ada Lovelace')).toEqual({
        valid: false,
        message: 'Nickname can only contain letters, numbers, and underscores',
      });
      expect(validateNickname('a'.repeat(31))).toEqual({
        valid: false,
        message: 'Nickname must not exceed 30 characters',
      });
    });
  });

  describe('event access code validation', () => {
    it('should accept exactly six alphanumeric characters', () => {
      expect(isValidAccessCode('ABC123')).toBe(true);
      expect(validateAccessCode('abc123')).toEqual({ valid: true });
    });

    it('should reject missing, short, long, or symbolic access codes', () => {
      expect(validateAccessCode('')).toEqual({
        valid: false,
        message: 'Access code is required',
      });
      expect(validateAccessCode('ABC12')).toEqual({
        valid: false,
        message: 'Access code must be 6 alphanumeric characters',
      });
      expect(validateAccessCode('ABC1234')).toEqual({
        valid: false,
        message: 'Access code must be 6 alphanumeric characters',
      });
      expect(validateAccessCode('ABC-12')).toEqual({
        valid: false,
        message: 'Access code must be 6 alphanumeric characters',
      });
    });
  });

  describe('generic field validation', () => {
    it('should validate non-empty strings after trimming whitespace', () => {
      expect(isNonEmptyString(' request ')).toBe(true);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
    });

    it('should validate positive numeric input', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber('2')).toBe(true);
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber('not-a-number')).toBe(false);
    });

    it('should validate required values and minimum lengths', () => {
      expect(isRequired('value')).toEqual({ valid: true });
      expect(isRequired('')).toEqual({
        valid: false,
        message: 'This field is required',
      });
      expect(minLength('abc', 3)).toEqual({ valid: true });
      expect(minLength('ab', 3)).toEqual({
        valid: false,
        message: 'Minimum length is 3 characters',
      });
    });
  });
});
