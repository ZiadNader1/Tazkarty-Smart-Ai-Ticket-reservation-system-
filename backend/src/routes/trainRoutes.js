import express from 'express';
import { getTrainsByDestination, getTrainAvailability, createTrainBooking, confirmTrainBooking } from '../controllers/trainController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/seats/:trainNumber', getTrainAvailability);
router.post('/book', protect, createTrainBooking);
router.post('/confirm', protect, confirmTrainBooking);
router.get('/:destination', getTrainsByDestination);

export default router;
