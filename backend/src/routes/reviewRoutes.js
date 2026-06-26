import express from 'express';
import {
  createReview,
  getReviews,
  getReviewById,
  postReviewComment
} from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', createReview);
router.get('/', getReviews);
router.get('/:id', getReviewById);
router.post('/:id/comment', postReviewComment);

export default router;
