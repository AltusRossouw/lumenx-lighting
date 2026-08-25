// Stateless JSON Web Tokens for the session cookie.
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// The token only carries identity; the user role is re-read from the database
// at request time so role changes apply instantly.
export const signToken = (payload) =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

// Returns the decoded payload or null. Never throws.
export const decodeToken = (token) => {
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
};

// Build the Set-Cookie options for the session cookie.
export const cookieOptions = () => ({
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
