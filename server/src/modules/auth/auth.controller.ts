import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { registerUser, loginUser } from './auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerUser(req.body);

  res.json({
    success: true,
    data: result,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await loginUser(email, password);

  res.json({
    success: true,
    data: result,
  });
});
