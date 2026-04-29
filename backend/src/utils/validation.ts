/**
 * SRS FR-03: Validates that the email is a valid academic (.edu) email.
 * Accepts patterns like:
 *   user@university.edu
 *   user@cs.university.edu
 *   user@university.edu.tr
 * Rejects all non-academic emails (gmail.com, hotmail.com, etc.)
 */
export const isValidEduEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;

  // Strict academic email regex:
  // - Standard characters before @
  // - Domain must contain .edu either as TLD or as part of subdomain (e.g., .edu.tr)
  const eduRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu(\.[a-zA-Z]{2,})?$/i;
  return eduRegex.test(email.trim());
};

/**
 * Validates that the role is one of the allowed registration roles.
 * ADMIN role cannot be self-selected during registration.
 */
export const isValidRegistrationRole = (role: string): boolean => {
  const allowedRoles = ['ENGINEER', 'HEALTHCARE'];
  return allowedRoles.includes(role?.toUpperCase());
};