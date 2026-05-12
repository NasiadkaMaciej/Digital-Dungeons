const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Game = require('../models/Game');
const Like = require('../models/Like');
const Playthrough = require('../models/Playthrough');
const { auth, optionalAuth } = require('../middleware/auth');

// Get user profile by ID – email only returned to the owner (IDOR fix)
router.get('/:userId', optionalAuth, async (req, res, next) => {
	try {
		const user = await User.findById(req.params.userId);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		const isOwner = req.user && parseInt(req.user.userId) === parseInt(req.params.userId);

		// Public profile – never expose email or last_login to strangers
		const profile = {
			user_id: user.user_id,
			username: user.username,
			profile_bio: user.profile_bio,
			join_date: user.join_date,
			...(isOwner && {
				email: user.email,
				last_login: user.last_login,
			}),
		};

		res.json(profile);
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
	],
	async (req, res, next) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { profile_bio } = req.body;

			if (profile_bio === undefined) {
				return res.status(400).json({ error: 'No updates provided' });
			}

			const user = await User.updateProfile(req.user.userId, { profile_bio });
			res.json({ message: 'Profile updated', user });
		} catch (error) {
			next(error);
		}
	}
);

// Get user's created games (drafts only visible to owner)
router.get('/:userId/games', optionalAuth, async (req, res, next) => {
	try {
		const isOwner = req.user && parseInt(req.user.userId) === parseInt(req.params.userId);
		const games = await Game.findByAuthor(req.params.userId, !isOwner);
		res.json(games);
	} catch (error) {
		next(error);
	}
});

// Get user's liked games
router.get('/:userId/likes', async (req, res, next) => {
	try {
		const safeLimit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
		const safeOffset = Math.max(parseInt(req.query.offset) || 0, 0);
		const likes = await Like.findByUser(req.params.userId, safeLimit, safeOffset);
		res.json(likes);
	} catch (error) {
		next(error);
	}
});

// Get user's playthroughs (own only)
router.get('/:userId/playthroughs', auth, async (req, res, next) => {
	try {
		// Only allow users to see their own playthroughs
		if (parseInt(req.user.userId) !== parseInt(req.params.userId)) {
			return res.status(403).json({ error: 'Not authorized' });
		}

		const safeLimit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
		const safeOffset = Math.max(parseInt(req.query.offset) || 0, 0);
		const playthroughs = await Playthrough.findByUser(req.params.userId, safeLimit, safeOffset);
		res.json(playthroughs);
	} catch (error) {
		next(error);
	}
});

// Get user statistics
router.get('/:userId/stats', async (req, res, next) => {
	try {
		const [user, gameStats] = await Promise.all([
			User.findById(req.params.userId),
			Game.getAuthorStats(req.params.userId),
		]);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		res.json({
			created_games: gameStats.game_count,
			completed_games: user.completed_games_count || 0,
			total_likes_received: gameStats.total_likes,
			total_plays: gameStats.total_plays,
			member_since: user.join_date,
		});
	} catch (error) {
		next(error);
	}
});

module.exports = router;