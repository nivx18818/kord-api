export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'kord_access_token',
  REFRESH_TOKEN: 'kord_refresh_token',
} as const;

export interface CookieConfig {
  domain?: string;
  httpOnly: boolean;
  maxAge: number;
  path: string;
  sameSite: 'lax' | 'none' | 'strict';
  secure: boolean;
}

export const getAccessTokenCookieOptions = (): CookieConfig => ({
  domain: process.env.COOKIE_DOMAIN,
  httpOnly: true,
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
});

export const getRefreshTokenCookieOptions = (): CookieConfig => ({
  domain: process.env.COOKIE_DOMAIN,
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth/refresh', // Restrict to refresh endpoint only
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
});

export const getClearCookieOptions = (): CookieConfig => ({
  domain: process.env.COOKIE_DOMAIN,
  httpOnly: true,
  maxAge: 0, // Expire immediately
  path: '/',
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
});
