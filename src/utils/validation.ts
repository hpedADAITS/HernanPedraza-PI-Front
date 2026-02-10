/**
 * Validation utilities
 * Input validation helpers for forms and user input
 */

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email.length > 0 && emailRegex.test(email);
}

/**
 * Email validation with message
 */
export function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!email) {
    return { valid: false, message: "Email is required" };
  }

  if (!isValidEmail(email)) {
    return { valid: false, message: "Invalid email format" };
  }

  return { valid: true };
}

/**
 * Password strength check
 * Requirements: 8-128 characters, must include uppercase, lowercase, number
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8 || password.length > 128) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasUppercase && hasLowercase && hasNumber;
}

/**
 * Password validation with detailed message
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: "Password is required" };
  }

  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }

  if (password.length > 128) {
    return { valid: false, message: "Password must not exceed 128 characters" };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must include at least one uppercase letter",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must include at least one lowercase letter",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must include at least one number",
    };
  }

  return { valid: true };
}

/**
 * Display name validation (2-50 characters, alphanumeric + spaces)
 */
export function isValidDisplayName(name: string): boolean {
  if (name.length < 2 || name.length > 50) {
    return false;
  }

  return /^[a-zA-Z0-9\s]+$/.test(name);
}

/**
 * Display name validation with message
 */
export function validateDisplayName(name: string): { valid: boolean; message?: string } {
  if (!name) {
    return { valid: false, message: "Display name is required" };
  }

  if (name.length < 2) {
    return { valid: false, message: "Display name must be at least 2 characters" };
  }

  if (name.length > 50) {
    return { valid: false, message: "Display name must not exceed 50 characters" };
  }

  if (!isValidDisplayName(name)) {
    return {
      valid: false,
      message: "Display name can only contain letters, numbers, and spaces",
    };
  }

  return { valid: true };
}

/**
 * Nickname validation (alphanumeric + underscore, 2-30 chars)
 */
export function isValidNickname(nickname: string): boolean {
  if (nickname.length < 2 || nickname.length > 30) {
    return false;
  }

  return /^[a-zA-Z0-9_]+$/.test(nickname);
}

/**
 * Nickname validation with message
 */
export function validateNickname(nickname: string): { valid: boolean; message?: string } {
  if (!nickname) {
    return { valid: false, message: "Nickname is required" };
  }

  if (nickname.length < 2) {
    return { valid: false, message: "Nickname must be at least 2 characters" };
  }

  if (nickname.length > 30) {
    return { valid: false, message: "Nickname must not exceed 30 characters" };
  }

  if (!isValidNickname(nickname)) {
    return {
      valid: false,
      message: "Nickname can only contain letters, numbers, and underscores",
    };
  }

  return { valid: true };
}

/**
 * Event access code validation (alphanumeric, 6 characters)
 */
export function isValidAccessCode(code: string): boolean {
  return /^[a-zA-Z0-9]{6}$/.test(code);
}

/**
 * Event access code validation with message
 */
export function validateAccessCode(code: string): { valid: boolean; message?: string } {
  if (!code) {
    return { valid: false, message: "Access code is required" };
  }

  if (!isValidAccessCode(code)) {
    return {
      valid: false,
      message: "Access code must be 6 alphanumeric characters",
    };
  }

  return { valid: true };
}

/**
 * URL validation
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Non-empty string validation
 */
export function isNonEmptyString(value: any): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Positive number validation
 */
export function isPositiveNumber(value: any): boolean {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

/**
 * Required field validation
 */
export function isRequired(value: any): { valid: boolean; message?: string } {
  if (value === null || value === undefined || value === "") {
    return { valid: false, message: "This field is required" };
  }

  return { valid: true };
}

/**
 * Min length validation
 */
export function minLength(value: string, min: number): { valid: boolean; message?: string } {
  if (value.length < min) {
    return {
      valid: false,
      message: `Minimum length is ${min} characters`,
    };
  }

  return { valid: true };
}

/**
 * Max length validation
 */
export function maxLength(value: string, max: number): { valid: boolean; message?: string } {
  if (value.length > max) {
    return {
      valid: false,
      message: `Maximum length is ${max} characters`,
    };
  }

  return { valid: true };
}

/**
 * Range validation for numbers
 */
export function inRange(
  value: number,
  min: number,
  max: number
): { valid: boolean; message?: string } {
  if (value < min || value > max) {
    return {
      valid: false,
      message: `Value must be between ${min} and ${max}`,
    };
  }

  return { valid: true };
}

/**
 * Batch validation helper
 */
export function validateForm(
  data: Record<string, any>,
  validators: Record<string, (value: any) => { valid: boolean; message?: string }>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const [field, validator] of Object.entries(validators)) {
    const result = validator(data[field]);
    if (!result.valid && result.message) {
      errors[field] = result.message;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
