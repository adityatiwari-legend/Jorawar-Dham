import { hash, verify } from "@node-rs/argon2";

// Argon2id configuration per RFC 9106 recommended production baseline
// Algorithm 2 = Argon2id in @node-rs/argon2
const ARGON2_CONFIG = {
  algorithm: 2,
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  parallelism: 4,    // 4 threads
  outputLen: 32,
};

/**
 * Hashes a plaintext password using Argon2id.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword || plainPassword.length < 8) {
    throw new Error("Password does not meet minimum length requirements");
  }
  return hash(plainPassword, ARGON2_CONFIG);
}

/**
 * Securely verifies a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  if (!plainPassword || !passwordHash) {
    return false;
  }
  try {
    return await verify(passwordHash, plainPassword, ARGON2_CONFIG);
  } catch {
    return false;
  }
}
