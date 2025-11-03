import { Request } from 'express';

import { COOKIE_NAMES } from '@/common/constants/cookie-config';

/**
 * Extracts JWT access token from cookies for Passport JWT strategy.
 * Compatible with passport-jwt's custom extractor interface.
 *
 * @param req - Express request object
 * @returns JWT token string or null if not found
 */
export const cookieExtractor = (req: Request): null | string => {
  if (req && req.cookies) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
    return typeof token === 'string' ? token : null;
  }
  return null;
};
