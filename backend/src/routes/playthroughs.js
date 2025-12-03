const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Playthrough = require('../models/Playthrough');
const Game = require('../models/Game');
const { auth } = require('../middleware/auth');

// Get user's playthroughs
router.get('/user', auth, async (req, res, next) => {
	try {
		const { limit = 20, offset = 0 } = req.query;
		const playthroughs = await Playthrough.findByUser(
			req.user.userId,
			parseInt(limit),
			parseInt(offset)
		);
		res.json(playthroughs);
	} catch (error) {
		next(error);
	}
});

// Get playthrough statistics
router.get('/stats', auth, async (req, res, next) => {
	try {
		const stats = await Playthrough.getStats(req.user.userId);
		res.json(stats);
	} catch (error) {
		next(error);
	}
});

// Get specific playthrough
router.get('/:id', auth, async (req, res, next) => {
	try {
		const playthrough = await Playthrough.findById(req.params.id);
		if (!playthrough) {
			return res.status(404).json({ error: 'Playthrough not found' });
		}

		if (playthrough.user_id !== req.user.userId) {
			return res.status(403).json({ error: 'Not authorized' });
		}

		res.json(playthrough);
	} catch (error) {
		next(error);
	}
});

// Start new playthrough
router.post(
	'/',
	auth,
	[body('gameId').isInt()],
	async (req, res, next) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { gameId, gameState } = req.body;

			// Verify game exists
			const game = await Game.findById(gameId);
			if (!game) {
				return res.status(404).json({ error: 'Game not found' });
			}

			// Increment plays count
			await Game.incrementPlaysCount(gameId);

			const playthroughId = await Playthrough.create({
				gameId,
				userId: req.user.userId,
				gameState,
			});

			const playthrough = await Playthrough.findById(playthroughId);
			res.status(201).json({
				message: 'Playthrough started',
				playthrough,
			});
		} catch (error) {
			next(error);
		}
	}
);

// Update playthrough (save progress)
router.put(
	'/:id',
	auth,
	[
		body('gameState').optional().isObject(),
		body('status').optional().isIn(['in_progress', 'completed', 'abandoned']),
	],
	async (req, res, next) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const playthrough = await Playthrough.findById(req.params.id);
			if (!playthrough) {
				return res.status(404).json({ error: 'Playthrough not found' });
			}

			if (playthrough.user_id !== req.user.userId) {
				return res.status(403).json({ error: 'Not authorized' });
			}

			const { gameState, status } = req.body;
			await Playthrough.update(req.params.id, { gameState, status });

			const updated = await Playthrough.findById(req.params.id);
			res.json({ message: 'Playthrough updated', playthrough: updated });
		} catch (error) {
			next(error);
		}
	}
);

// Delete playthrough
router.delete('/:id', auth, async (req, res, next) => {
	try {
		const playthrough = await Playthrough.findById(req.params.id);
		if (!playthrough) {
			return res.status(404).json({ error: 'Playthrough not found' });
		}

		if (playthrough.user_id !== req.user.userId) {
			return res.status(403).json({ error: 'Not authorized' });
		}

		await Playthrough.delete(req.params.id);
		res.json({ message: 'Playthrough deleted' });
	} catch (error) {
		next(error);
	}
});

// Get or create playthrough for a game
router.post('/continue/:gameId', auth, async (req, res, next) => {
	try {
		let playthrough = await Playthrough.findByUserAndGame(
			req.user.userId,
			req.params.gameId
		);

		if (!playthrough) {
			const game = await Game.findById(req.params.gameId);
			if (!game) {
				return res.status(404).json({ error: 'Game not found' });
			}

			await Game.incrementPlaysCount(req.params.gameId);
			const playthroughId = await Playthrough.create({
				gameId: req.params.gameId,
				userId: req.user.userId,
			});
			playthrough = await Playthrough.findById(playthroughId);
		}

		res.json(playthrough);
	} catch (error) {
		next(error);
	}
});

module.exports = router;