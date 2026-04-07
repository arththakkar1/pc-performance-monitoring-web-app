// Admin email — the only account with full dashboard access
export const ADMIN_EMAIL = 'abhithakkar466@gmail.com'

export function isAdmin(email: string | undefined | null): boolean {
  return email === ADMIN_EMAIL
}
