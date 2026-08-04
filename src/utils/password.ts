import bcrypt from 'bcrypt';

/**
 * Hashes a plain text password using bcrypt.
 * 
 * @param password - The plain text password to be hashed.
 * @returns A Promise that resolves to the hashed password string.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // Recommended for production security/performance balance
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compares a plain text password with a hashed password to verify match.
 * 
 * @param password - The plain text password to check.
 * @param hashedPassword - The hashed password stored in the database.
 * @returns A Promise that resolves to a boolean (true if match, false otherwise).
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
