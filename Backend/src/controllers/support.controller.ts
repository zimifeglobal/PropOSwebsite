import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/apiResponse';
import SupportMessage from '../models/SupportMessage';

export const createSupportMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject, body } = req.body;
    const u = req.user!;
    const doc = await SupportMessage.create({
      user: u._id,
      subject: subject.trim(),
      body: body.trim(),
      emailSnapshot: u.email,
      nameSnapshot: u.name,
    });
    sendResponse(res, {
      success: true,
      message: 'Your message was delivered to the support team.',
      data: { id: doc._id.toString(), createdAt: doc.createdAt },
      statusCode: 201,
    });
  } catch (e) {
    next(e);
  }
};
