import express from 'express';
import { createEvent, deleteEvent, getAllEvents, updateEvent } from '../controllers/events.controller';

const router = express.Router();

router.post('/create', createEvent);
router.get('/all', getAllEvents);
router.put('/:id', updateEvent); 
router.delete('/:id', deleteEvent)

export default router;
