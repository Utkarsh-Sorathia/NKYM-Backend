import express from 'express';
import multer from 'multer';
import { getAllGalleryImages, createGalleryImage, updateGalleryImage, deleteGalleryImage } from '../controllers/gallery.controller';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post('/upload', upload.single('image'), createGalleryImage);
router.get('/all', getAllGalleryImages);
router.put('/:id', upload.single('image'), updateGalleryImage);
router.delete('/:id', deleteGalleryImage)

export default router;
