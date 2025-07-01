import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

import galleryRouter from './routers/gallery.route'
import eventsRouter from './routers/events.route';

app.use(
  cors({
    origin: [
      'http://192.168.1.27:5173',
      'http://localhost:5173',
      'https://nkym.vercel.app/'
    ],
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.static('public'))
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the gms backend server!');
});

// POST endpoint for admin key verification
app.post('/api/verify-admin', (req:Request, res:Response) => {
  const { adminKey } = req.body;
  if (!adminKey) {
    res.status(400).json({ valid: false, error: "Admin key is required" });
  }
  if (adminKey === process.env.ADMIN_KEY) {
    res.json({ valid: true });
  } else {
    res.status(403).json({ valid: false, error: "Invalid admin key" });
  }
});


app.use('/gallery', galleryRouter);
app.use('/events', eventsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});