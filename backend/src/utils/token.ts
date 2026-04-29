import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT token for authenticated users.
 * SDD Section 7: Session timeout — token expires in 1 hour.
 */
export const generateToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '1h',
  });
};