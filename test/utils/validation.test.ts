import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  validateEmail,
  isStrongPassword,
  validatePassword,
} from '@/utils/validation';

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
});
