/**
 * Authentication and input validation utilities
 */

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  strength: "weak" | "fair" | "good" | "strong";
  feedback: string[];
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

/**
 * Validates whether an email string follows standard RFC format.
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Analyzes password strength against complexity heuristics.
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  if (!password) {
    return {
      score: 0,
      strength: "weak",
      feedback: ["Password is required"],
      hasMinLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false,
    };
  }

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score += 1;
  if (hasUppercase && hasLowercase) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecialChar) score += 1;

  if (!hasMinLength) feedback.push("Must be at least 8 characters long");
  if (!hasUppercase) feedback.push("Include an uppercase letter");
  if (!hasLowercase) feedback.push("Include a lowercase letter");
  if (!hasNumber) feedback.push("Include at least one digit");
  if (!hasSpecialChar) feedback.push("Include a special character");

  let strength: PasswordStrengthResult["strength"] = "weak";
  if (score >= 4) strength = "strong";
  else if (score === 3) strength = "good";
  else if (score === 2) strength = "fair";

  return {
    score,
    strength,
    feedback,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  };
}

/**
 * Validates a username according to alphanumeric and hyphen/underscore guidelines.
 */
export function validateUsername(username: string): { isValid: boolean; message?: string } {
  if (!username) {
    return { isValid: false, message: "Username cannot be empty" };
  }
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return { isValid: false, message: "Username must be at least 3 characters" };
  }
  if (trimmed.length > 30) {
    return { isValid: false, message: "Username cannot exceed 30 characters" };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { isValid: false, message: "Username can only contain letters, numbers, underscores, and hyphens" };
  }
  return { isValid: true };
}

/**
 * Normalizes error messages from API calls or network exceptions.
 */
export function formatAuthError(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;

  const errObj = error as Record<string, any>;
  if (errObj.detail && typeof errObj.detail === "string") {
    return errObj.detail;
  }
  if (errObj.message && typeof errObj.message === "string") {
    return errObj.message;
  }
  if (errObj.error && typeof errObj.error === "string") {
    return errObj.error;
  }
  return "Authentication failed. Please check your credentials and try again.";
}

/**
 * Safely strips tags and leading/trailing whitespace.
 */
export function sanitizeAuthInput(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input.replace(/[<>]/g, "").trim();
}
