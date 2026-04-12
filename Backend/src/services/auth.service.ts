import User from '../models/User';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken';
import logger from '../utils/logger';

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role?: string
) => {
  const existing = await User.findOne({ email });
  if (existing) throw Object.assign(new Error('Email already registered.'), { statusCode: 409 });

  const user = await User.create({ name, email, password, role });
  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  logger.info(`[Auth] New user registered: ${email} (${user.role})`);
  return { accessToken, refreshToken, user };
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user || !(await user.comparePassword(password))) {
    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
  }
  if (!user.isActive) {
    throw Object.assign(new Error('Account is deactivated.'), { statusCode: 401 });
  }

  user.lastLogin = new Date();
  const accessToken = generateAccessToken(user._id.toString());
  const refreshToken = generateRefreshToken(user._id.toString());
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  logger.info(`[Auth] Login: ${email}`);
  return { accessToken, refreshToken, user };
};

export const refreshUserToken = async (refreshToken: string) => {
  const jwt = await import('jsonwebtoken');
  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET as string
  ) as { id: string };

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw Object.assign(new Error('Invalid or expired refresh token.'), { statusCode: 401 });
  }

  const newAccessToken = generateAccessToken(user._id.toString());
  const newRefreshToken = generateRefreshToken(user._id.toString());
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const eraseUserGdpr = async (userId: string) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      name: 'GDPR_ERASED',
      email: `gdpr_erased_${userId}@erased.invalid`,
      deletedAt: new Date(),
      pii_masked: true,
      isActive: false,
      refreshToken: null,
      mfaSecret: undefined,
    },
    { new: true }
  );
  if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });
  logger.info(`[GDPR] User ${userId} PII erased per Right to be Forgotten request`);
  return user;
};
