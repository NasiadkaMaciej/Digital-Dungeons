const express = require('express');
const router = express.Router();
const Like = require('../models/Like');
const { auth } = require('../middleware/auth');

// Like a game
router.post('/:gameId', auth, async (req, res, next) => {
    try {
        await Like.create(req.user.userId, req.params.gameId);
        res.status(201).json({ message: 'Game liked successfully' });
    } catch (error) {
        if (error.message === 'Game already liked') {
            return res.status(400).json({ error: 'Game already liked' });
        }
        next(error);
    }
});

// Unlike a game
router.delete('/:gameId', auth, async (req, res, next) => {
    try {
        const deleted = await Like.delete(req.user.userId, req.params.gameId);
        if (!deleted) {
            return res.status(404).json({ error: 'Like not found' });
        }
        res.json({ message: 'Game unliked successfully' });
    } catch (error) {
        next(error);
    }
});

// Get user's liked games
router.get('/user/:userId', async (req, res, next) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const likes = await Like.findByUser(
            req.params.userId,
            parseInt(limit),
            parseInt(offset)
        );
        res.json(likes);
    } catch (error) {
        next(error);
    }
});

// Check if user liked a game
router.get('/check/:gameId', auth, async (req, res, next) => {
    try {
        const liked = await Like.checkLike(req.user.userId, req.params.gameId);
        res.json({ liked });
    } catch (error) {
        next(error);
    }
});

module.exports = router;