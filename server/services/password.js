// Password hashing and verification (bcryptjs — pure JavaScript, no native build).
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPassword = (plainText) => bcrypt.hash(plainText, SALT_ROUNDS);

export const verifyPassword = (plainText, hash) => bcrypt.compare(plainText, hash);
