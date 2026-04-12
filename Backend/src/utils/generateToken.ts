import jwt, { SignOptions } from 'jsonwebtoken';

export const generateAccessToken = (id: string): string => {
  const opts: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'] };
  return jwt.sign({ id }, process.env.JWT_SECRET as string, opts);
};

export const generateRefreshToken = (id: string): string => {
  const opts: SignOptions = { expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as SignOptions['expiresIn'] };
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET as string, opts);
};
