const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const { auth, optionalAuth } = require('../middleware/auth');

// Get comments for a game
router.get('/game/:gameId', optionalAuth, async (req, res, next) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const comments = await Comment.findByGame(
            req.params.gameId,
            parseInt(limit),
            parseInt(offset)
        );
        const count = await Comment.countByGame(req.params.gameId);
        res.json({ comments, total: count });
    } catch (error) {
        next(error);
    }
});

// Create comment
router.post(
    '/:gameId',
    auth,
    [body('content').trim().isLength({ min: 1, max: 1000 })],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const commentId = await Comment.create({
                gameId: req.params.gameId,
                userId: req.user.userId,
                content: req.body.content,
            });

            const comment = await Comment.findById(commentId);
            res.status(201).json({ message: 'Comment created', comment });
        } catch (error) {
            next(error);
        }
    }
);

// Update comment
router.put(
    '/:commentId',
    auth,
    [body('content').trim().isLength({ min: 1, max: 1000 })],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const comment = await Comment.findById(req.params.commentId);
            if (!comment) {
                return res.status(404).json({ error: 'Comment not found' });
            }

            if (comment.user_id !== req.user.userId) {
                return res.status(403).json({ error: 'Not authorized' });
            }

            await Comment.update(req.params.commentId, req.body.content);
            const updated = await Comment.findById(req.params.commentId);
            res.json({ message: 'Comment updated', comment: updated });
        } catch (error) {
            next(error);
        }
    }
);

// Delete comment
router.delete('/:commentId', auth, async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.user_id !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await Comment.delete(req.params.commentId);
        res.json({ message: 'Comment deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;