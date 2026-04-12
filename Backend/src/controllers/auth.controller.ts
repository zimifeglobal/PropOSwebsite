import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/apiResponse';
import * as authService from '../services/auth.service';
import User from '../models/User';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    const { accessToken, refreshToken, user } = await authService.registerUser(name, email, password, role);
    sendResponse(res, {
      success: true, message: 'Account created successfully.',
      data: { accessToken, refreshToken, user: user.toPublicJSON() }, statusCode: 201,
    });
  } catch (e) { next(e); }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.loginUser(email, password);
    // MFA hook — if mfaEnabled, return mfa_required flag
    if (user.mfaEnabled) {
      sendResponse(res, {
        success: true, message: 'MFA verification required.',
        data: { mfa_required: true, user_id: user._id }, statusCode: 200,
      });
      return;
    }
    sendResponse(res, {
      success: true, message: 'Login successful.',
      data: { accessToken, refreshToken, user: user.toPublicJSON() }, statusCode: 200,
    });
  } catch (e) { next(e); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshUserToken(refreshToken);
    sendResponse(res, { success: true, message: 'Token refreshed.', data: tokens });
  } catch (e) { next(e); }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    sendResponse(res, { success: true, message: 'Logged out successfully.' });
  } catch (e) { next(e); }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
    sendResponse(res, { success: true, message: 'Profile fetched.', data: { user: user.toPublicJSON() } });
  } catch (e) { next(e); }
};

export const gdprErase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.eraseUserGdpr(req.user!._id.toString());
    sendResponse(res, { success: true, message: 'User data erased per GDPR Right to be Forgotten.', statusCode: 200 });
  } catch (e) { next(e); }
};
