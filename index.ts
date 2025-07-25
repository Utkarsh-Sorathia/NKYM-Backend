import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.set('view engine', 'ejs');

import galleryRouter from './routers/gallery.route'
import eventsRouter from './routers/events.route';
import notificationRouter from './routers/notfication.route';
import adminRoutes from './routers/login.route';
import popupRoutes from './routers/popup.route';

app.use(
  cors({
    origin: [
      'http://192.168.1.27:5173',
      'http://localhost:5173',
      'https://nkym.vercel.app',
      'https://cautious-invention-4r4qv5prww7f579g-5173.app.github.dev'
    ],
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.static('public'))
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
  const now = new Date();

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  };
  const formattedDate = now.toLocaleDateString('en-GB', options);

  res.render('index', { date: formattedDate });
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


app.use('/admin', adminRoutes);
app.use('/gallery', galleryRouter);
app.use('/events', eventsRouter);
app.use('/notifications', notificationRouter)
app.use('/api', popupRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});