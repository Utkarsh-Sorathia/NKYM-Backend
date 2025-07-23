import { Request, Response } from 'express';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase-admin';

export const togglePopupContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isEnabled } = req.body;

    await db.collection('popupContent').doc(id).update({ isEnabled });
    res.status(200).json({ message: `Popup ${id} updated` });
  } catch (error) {
    console.error('Error updating popup content:', error);
    res.status(500).send('Server error');
  }
};

export const getEnabledPopupContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const snapshot = await db.collection('popupContent')
      .where('isEnabled', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching popup content:', err);
    res.status(500).send('Server error');
  }
};

export const addPopupContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mediaUrl, mediaType, isEnabled } = req.body;

    if (!mediaUrl || !mediaType || typeof isEnabled !== 'boolean') {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const doc = {
      mediaUrl,
      mediaType,
      isEnabled,
      createdAt: Timestamp.now()
    };

    const added = await db.collection('popupContent').add(doc);
    res.status(200).json({ id: added.id });
  } catch (err) {
    console.error('Error adding popup content:', err);
    res.status(500).send('Server error');
  }
};
