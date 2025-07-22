import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const adminLogin = (req: Request, res: Response) => {
  const { username, password } = req.body;
  const { ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET } = process.env;
  let role = "admin";

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ isAdmin: true, role }, JWT_SECRET as string, { expiresIn: '2h' });
    res.json({ role, message:"Admin logged in successfully", token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};
