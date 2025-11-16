const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Game = require('../models/Game');
const Like = require('../models/Like');
const Playthrough = require('../models/Playthrough');
const { auth } = require('../middleware/auth');

// Get user profile by ID
router.get('/:userId', async (req, res, next) => {
	try {
		const user = await User.findById(req.params.userId);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		// Remove sensitive data
		delete user.password;
		res.json(user);
	} catch (error) {
		next(error);
	}
});

// Update current user profile
router.put(
	'/profile',
	auth,
	[
		body('profile_bio').optional().trim().isLength({ max: 500 }),
		body('avatar_url').optional().trim().isURL(),
	],
	async (req, res, next) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { profile_bio, avatar_url } = req.body;

			// Note: You'll need to add this method to User model
			const updates = [];
			const values = [];

			if (profile_bio !== undefined) {
				updates.push('profile_bio = ?');
				values.push(profile_bio);
			}
			if (avatar_url !== undefined) {
				updates.push('avatar_url = ?');
				values.push(avatar_url);
			}

			if (updates.length === 0) {
				return res.status(400).json({ error: 'No updates provided' });
			}

			values.push(req.user.userId);
			await db.execute(
				`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
				values
			);

			const user = await User.findById(req.user.userId);
			delete user.password;
			res.json({ message: 'Profile updated', user });
		} catch (error) {
			next(error);
		}
	}
);

// Get user's created games
router.get('/:userId/games', async (req, res, next) => {
	try {
		const games = await Game.findByAuthor(req.params.userId);
		res.json(games);
	} catch (error) {
		next(error);
	}
});

// Get user's liked games
router.get('/:userId/likes', async (req, res, next) => {
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

// Get user's playthroughs
router.get('/:userId/playthroughs', auth, async (req, res, next) => {
	try {
		// Only allow users to see their own playthroughs
		if (req.user.userId !== parseInt(req.params.userId)) {
			return res.status(403).json({ error: 'Not authorized' });
		}

		const { limit = 20, offset = 0 } = req.query;
		const playthroughs = await Playthrough.findByUser(
			req.params.userId,
			parseInt(limit),
			parseInt(offset)
		);
		res.json(playthroughs);
	} catch (error) {
		next(error);
	}
});

// Get user statistics
router.get('/:userId/stats', async (req, res, next) => {
	try {
		const user = await User.findById(req.params.userId);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		const games = await Game.findByAuthor(req.params.userId);
		const totalLikes = games.reduce((sum, game) => sum + game.likes_count, 0);
		const totalPlays = games.reduce((sum, game) => sum + game.plays_count, 0);

		res.json({
			created_games: user.created_games_count || games.length,
			completed_games: user.completed_games_count || 0,
			total_likes_received: totalLikes,
			total_plays: totalPlays,
			member_since: user.join_date,
		});
	} catch (error) {
		next(error);
	}
});

module.exports = router;