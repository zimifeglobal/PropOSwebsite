import { Request, Response, NextFunction } from 'express';
import Portfolio from '../models/Portfolio';

/**
 * Attaches the authenticated user's portfolio IDs to req.portfolioIds.
 * Use on any route that needs to scope data access to the user's portfolios.
 */
export const attachPortfolios = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) return next();
    const portfolios = await Portfolio.find({ owner_id: req.user._id }).select('_id');
    req.portfolioIds = portfolios.map((p) => p._id);
    next();
  } catch {
    next();
  }
};

/**
 * Verifies that a portfolio_id in req.body or req.params belongs to the authenticated user.
 */
export const scopeToPortfolio = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const portfolioId = req.params.portfolioId || req.body.portfolio_id;
  if (!portfolioId) return next();

  const belongs = req.portfolioIds?.some((id) => id.toString() === portfolioId);
  if (!belongs) {
    res.status(403).json({
      success: false,
      message: 'Access denied. This portfolio does not belong to your account.',
    });
    return;
  }
  next();
};
