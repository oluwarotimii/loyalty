import { sql } from '@vercel/postgres';
import crypto from 'crypto';

// Hash password using bcrypt-like algorithm (Node.js built-in)
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
    });
  });
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    const saltBuffer = Buffer.from(salt, 'hex');
    crypto.pbkdf2(password, saltBuffer, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

// Generate session token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Admin login
export async function adminLogin(
  username: string,
  password: string
): Promise<{ admin_id: string; session_id: string } | null> {
  try {
    const result = await sql`
      SELECT id, password_hash FROM admin_users WHERE username = ${username} AND is_active = true
    `;

    if (result.rows.length === 0) return null;

    const admin = result.rows[0];
    const passwordMatch = await verifyPassword(password, admin.password_hash);

    if (!passwordMatch) return null;

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await sql`
      INSERT INTO admin_sessions (admin_user_id, token, expires_at) VALUES (${admin.id}, ${sessionToken}, ${expiresAt})
    `;

    return { admin_id: admin.id, session_id: sessionToken };
  } catch (error) {
    console.error('Admin login error:', error);
    return null;
  }
}

// Verify admin session
export async function verifyAdminSession(
  sessionToken: string
): Promise<{ admin_id: string; username: string } | null> {
  try {
    const result = await sql`
      SELECT au.id, au.username
       FROM admin_users au
       JOIN admin_sessions asess ON au.id = asess.admin_user_id
       WHERE asess.token = ${sessionToken} AND asess.expires_at > NOW() AND au.is_active = true
    `;

    if (result.rows.length === 0) return null;
    return result.rows[0];
  } catch (error) {
    console.error('Verify admin session error:', error);
    return null;
  }
}

// Customer phone login
export async function customerPhoneLogin(
  phoneNumber: string
): Promise<{ customer_id: string; session_id: string } | null> {
  try {
    const result = await sql`
      SELECT id FROM customers WHERE phone = ${phoneNumber}
    `;

    if (result.rows.length === 0) return null;

    const customer = result.rows[0];
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await sql`
      INSERT INTO customer_sessions (customer_id, session_token, expires_at) VALUES (${customer.id}, ${sessionToken}, ${expiresAt})
    `;

    return { customer_id: customer.id, session_id: sessionToken };
  } catch (error) {
    console.error('Customer phone login error:', error);
    return null;
  }
}

// Verify customer session
export async function verifyCustomerSession(
  sessionToken: string
): Promise<{ customer_id: string; phone: string } | null> {
  try {
    const result = await sql`
      SELECT c.id, c.phone
       FROM customers c
       JOIN customer_sessions cs ON c.id = cs.customer_id
       WHERE cs.session_token = ${sessionToken} AND cs.expires_at > NOW()
    `;

    if (result.rows.length === 0) return null;
    return result.rows[0];
  } catch (error) {
    console.error('Verify customer session error:', error);
    return null;
  }
}

// Get admin info
export async function getAdminInfo(adminId: string) {
  try {
    const result = await sql`
      SELECT id, username, email, created_at FROM admin_users WHERE id = ${adminId}
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Get admin info error:', error);
    return null;
  }
}

// Create new admin user
export async function createAdminUser(
  username: string,
  email: string,
  password: string
): Promise<{ id: string } | null> {
  try {
    const passwordHash = await hashPassword(password);
    const result = await sql`
      INSERT INTO admin_users (username, email, password_hash, is_active) VALUES (${username}, ${email}, ${passwordHash}, true) RETURNING id
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Create admin user error:', error);
    return null;
  }
}

// Update admin password
export async function updateAdminPassword(
  adminId: string,
  newPassword: string
): Promise<boolean> {
  try {
    const passwordHash = await hashPassword(newPassword);
    const result = await sql`
      UPDATE admin_users SET password_hash = ${passwordHash} WHERE id = ${adminId} RETURNING id
    `;
    return result.rows.length > 0;
  } catch (error) {
    console.error('Update admin password error:', error);
    return false;
  }
}

// Logout
export async function logout(sessionToken: string, isAdmin: boolean): Promise<boolean> {
  try {
    const table = isAdmin ? 'admin_sessions' : 'customer_sessions';
    await sql`DELETE FROM ${table} WHERE token = ${sessionToken}`;
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}
