import { Request, Response } from 'express';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase-admin';
import cloudinary from '../utils/cloudinary';

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
        const { mediaType, isEnabled } = req.body;

        if (!req.file) {
            res.status(400).json({ error: 'No media file provided' });
            return;
        }

        if (!mediaType || typeof isEnabled === 'undefined') {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        if (!['image', 'video'].includes(mediaType)) {
            res.status(400).json({ error: 'Invalid media type. Must be image or video.' });
            return;
        }

        const uploadResult: any = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: 'Popup-NKYM',
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            if (req.file && req.file.buffer) {
                uploadStream.end(req.file.buffer);
            } else {
                reject(new Error('No file buffer found'));
            }
        });

        const popupDoc = {
            mediaUrl: uploadResult.secure_url,
            mediaType,
            isEnabled: isEnabled === 'true' || isEnabled === true,
            createdAt: Timestamp.now(),
        };

        const added = await db.collection('popupContent').add(popupDoc);

        res.status(200).json({ id: added.id, url: popupDoc.mediaUrl });
    } catch (err) {
        console.error('Error adding popup content:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

