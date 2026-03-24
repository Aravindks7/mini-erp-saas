import jwt from 'jsonwebtoken';

export function generateToken(payload: { userId: string; organizationId: string; role: string }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!);
}
