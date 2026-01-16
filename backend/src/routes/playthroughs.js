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

// Get current user's playthrough for a specific game
router.get('/by-game/:gameId', auth, async (req, res, next) => {
	try {
		const playthrough = await Playthrough.findByUserAndGame(
			req.user.userId,
			req.params.gameId
		);
		if (!playthrough) {
			return res.status(404).json({ error: 'Playthrough not found' });
		}
		res.json(playthrough);
	} catch (error) {
		next(error);
	}
});

// Get specific playthrough by id
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

// Start new playthrough (deprecated: prefer /continue/:gameId)
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
			const game = await Game.findById(gameId);
			if (!game) {
				return res.status(404).json({ error: 'Game not found' });
			}

			const playthroughId = await Playthrough.create({
				gameId,
				userId: req.user.userId,
				gameState,
			});
			const playthrough = await Playthrough.findById(playthroughId);
			res.status(201).json({ message: 'Playthrough created', playthrough });
		} catch (error) {
			next(error);
		}
	}
);

// Update playthrough
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

// Get or create playthrough for a game (increments plays only on first creation)
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

			try {
				await Game.incrementPlaysCount(req.params.gameId);
				const playthroughId = await Playthrough.create({
					gameId: req.params.gameId,
					userId: req.user.userId,
				});
				playthrough = await Playthrough.findById(playthroughId);
			} catch (createError) {
				if (createError.code === 'ER_DUP_ENTRY') {
					playthrough = await Playthrough.findByUserAndGame(
						req.user.userId,
						req.params.gameId
					);
					if (!playthrough) throw createError;
				} else {
					throw createError;
				}
			}
		}

		res.json(playthrough);
	} catch (error) {
		next(error);
	}
});

// Reset playthrough for a game (clears saved state, keeps play count)
router.post('/reset/:gameId', auth, async (req, res, next) => {
	try {
		let playthrough = await Playthrough.findByUserAndGame(
			req.user.userId,
			req.params.gameId
		);

		if (playthrough) {
			const id = playthrough.playthrough_id ?? playthrough.id;
			await Playthrough.update(id, { gameState: null, status: 'in_progress' });
			const updated = await Playthrough.findById(id);
			return res.json({ message: 'Playthrough reset', playthrough: updated });
		}

		const game = await Game.findById(req.params.gameId);
		if (!game) {
			return res.status(404).json({ error: 'Game not found' });
		}

		try {
			await Game.incrementPlaysCount(req.params.gameId);
			const playthroughId = await Playthrough.create({
				gameId: req.params.gameId,
				userId: req.user.userId,
			});
			playthrough = await Playthrough.findById(playthroughId);
			return res.status(201).json({ message: 'Playthrough created', playthrough });
		} catch (createError) {
			if (createError.code === 'ER_DUP_ENTRY') {
				const existing = await Playthrough.findByUserAndGame(
					req.user.userId,
					req.params.gameId
				);
				if (!existing) throw createError;
				const id = existing.playthrough_id ?? existing.id;
				await Playthrough.update(id, { gameState: null, status: 'in_progress' });
				const updated = await Playthrough.findById(id);
				return res.json({ message: 'Playthrough reset', playthrough: updated });
			}
			throw createError;
		}
	} catch (error) {
		next(error);
	}
});

module.exports = router;
