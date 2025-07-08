import { Request, Response } from 'express';
import cloudinary from '../utils/cloudinary'
import { db } from '../firebase-admin';

export const createGalleryImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            throw new Error('No image file provided');
        }
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: 'auto',
                     folder: 'Gallery-nkym',
                 },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            if (req.file && req.file.buffer) {
                uploadStream.end(req.file.buffer);
            } else {
                reject(new Error('No image file buffer provided'));
            }
        });
        const imageDoc = {
            src: (result as any).secure_url,
            alt: req.body.alt || '',
            name: req.body.name || '',
            uploaded: new Date().toISOString(),
        };
        await db.collection('Gallery').add(imageDoc);
        res.status(201).json({ success: true, image: imageDoc });
    } catch (err) {
        res.status(500).json({ success: false, error: (err as Error).message });
    }
};

export const getAllGalleryImages = async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection('Gallery').get();
        const gallery = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ success: true, gallery });
    } catch (err) {
        res.status(500).json({ success: false, error: (err as Error).message });
    }
};

// Update gallery item metadata in Firestore only
export const updateGalleryImage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Gallery item ID is required' });
            return;
        }
        const { name, imageUrl, uploaded } = req.body;
        await db.collection('Gallery').doc(id).update({
            ...(name && { name }),
            ...(imageUrl && { imageUrl }),
            ...(uploaded && { uploaded }),
        });
        res.status(200).json({ success: true, message: 'Gallery item updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: (err as Error).message });
    }
};

// Delete gallery item metadata in Firestore only
export const deleteGalleryImage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Gallery item ID is required' });
            return;
        }
        await db.collection('Gallery').doc(id).delete();
        res.status(200).json({ success: true, message: 'Gallery item deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: (err as Error).message });
    }
};