const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Game = require('../models/Game');
const { auth, optionalAuth, validateRequest } = require('../middleware/auth');

// Helper to check ownership
const checkGameOwnership = async (gameId, userId, res) => {
	const game = await Game.findById(gameId);
	if (!game) {
		res.status(404).json({ error: 'Game not found' });
		return null;
	}
	if (game.author_id !== userId) {
		res.status(403).json({ error: 'Not authorized' });
		return null;
	}
	return game;
};

// Get all published games
router.get('/', optionalAuth, async (req, res, next) => {
	try {
		const { limit = 20, offset = 0 } = req.query;
		const games = await Game.findAll({
			limit: parseInt(limit),
			offset: parseInt(offset),
			published: true
		});
		res.json(games);
	} catch (error) {
		next(error);
	}
});

// Get game by ID
router.get('/:id', optionalAuth, async (req, res, next) => {
	try {
		const game = await Game.findById(req.params.id);
		if (!game) {
			return res.status(404).json({ error: 'Game not found' });
		}
		res.json(game);
	} catch (error) {
		next(error);
	}
});

// Create new game
router.post('/',
	auth,
	[
		body('title').trim().isLength({ min: 1, max: 100 }),
		body('description').optional().trim(),
		body('gameContent').isObject()
	],
	async (req, res, next) => {
		try {
			if (!validateRequest(req, res)) return;

			const { title, description, gameContent } = req.body;
			const gameId = await Game.create({
				title,
				description,
				authorId: req.user.userId,
				gameContent
			});

			res.status(201).json({
				message: 'Game created successfully',
				gameId
			});
		} catch (error) {
			next(error);
		}
	}
);

// Update game
router.put('/:id', auth, async (req, res, next) => {
	try {
		const game = await checkGameOwnership(req.params.id, req.user.userId, res);
		if (!game) return;

		const updated = await Game.update(req.params.id, req.body);
		if (!updated) {
			return res.status(400).json({ error: 'No fields to update' });
		}

		res.json({ message: 'Game updated successfully' });
	} catch (error) {
		next(error);
	}
});

// Delete game
router.delete('/:id', auth, async (req, res, next) => {
	try {
		const game = await checkGameOwnership(req.params.id, req.user.userId, res);
		if (!game) return;

		await Game.delete(req.params.id);
		res.json({ message: 'Game deleted successfully' });
	} catch (error) {
		next(error);
	}
});

// Get user's games
router.get('/user/:userId', async (req, res, next) => {
	try {
		const games = await Game.findByAuthor(req.params.userId);
		res.json(games);
	} catch (error) {
		next(error);
	}
});

module.exports = router;