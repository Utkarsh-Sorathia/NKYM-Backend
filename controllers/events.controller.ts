import { Request, Response } from 'express';
import { db } from '../firebase-admin';

export const createEvent = async (req: Request, res: Response) => {
    try {
        const { title, date, time, description, location } = req.body;
        if (!title || !date || !time || !description) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        const eventDoc = { title, date, time, description, location: location || '' };
        await db.collection('Events').add(eventDoc);
        res.status(201).json({ success: true, event: eventDoc });
    } catch (err) {
        res.status(500).json({ success: false, error: (err as Error).message });
    }
};

export const getAllEvents = async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection('Events').get();
        const events = snapshot.docs.map(doc => ({
            id: doc.id, // This is the Firebase document ID
            ...doc.data()
        }));
        res.status(200).json({ events });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Event ID is required' });
            return;
        }
        await db.collection('Events').doc(id).delete();
        res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: (err as Error).message });
    }
};

export const updateEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Event ID is required' });
            return;
        }
        const { title, date, time, description, location } = req.body;
        await db.collection('Events').doc(id).update({ title, date, time, description, location });
        res.status(200).json({ success: true, message: 'Event updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: (err as Error).message });
    }
};

