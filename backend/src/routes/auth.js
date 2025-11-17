const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Register
router.post('/register',
	[
		body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
		body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
		body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
	],
	async (req, res, next) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { username, email, password } = req.body;

			// Check if user exists
			const existingUser = await User.findByEmail(email);
			if (existingUser) {
				return res.status(400).json({ error: 'Email already registered' });
			}

			const existingUsername = await User.findByUsername(username);
			if (existingUsername) {
				return res.status(400).json({ error: 'Username already taken' });
			}

			// Create user
			const userId = await User.create({ username, email, password });

			// Generate token
			const token = jwt.sign(
				{ userId, username },
				process.env.JWT_SECRET,
				{ expiresIn: process.env.JWT_EXPIRE }
			);

			res.status(201).json({
				message: 'User registered successfully',
				token,
				user: { userId, username, email }
			});
		} catch (error) {
			next(error);
		}
	}
);

// Login
router.post('/login',
	[
		body('email').isEmail().normalizeEmail(),
		body('password').notEmpty()
	],
	async (req, res, next) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { email, password } = req.body;

			const user = await User.findByEmail(email);
			if (!user) {
				return res.status(401).json({ error: 'Invalid credentials' });
			}

			const isValidPassword = await User.comparePassword(password, user.password);
			if (!isValidPassword) {
				return res.status(401).json({ error: 'Invalid credentials' });
			}

			await User.updateLastLogin(user.user_id);

			const token = jwt.sign(
				{ userId: user.user_id, username: user.username },
				process.env.JWT_SECRET,
				{ expiresIn: process.env.JWT_EXPIRE }
			);

			res.json({
				message: 'Login successful',
				token,
				user: {
					userId: user.user_id,
					username: user.username,
					email: user.email
				}
			});
		} catch (error) {
			next(error);
		}
	}
);

// Get current user
router.get('/me', auth, async (req, res, next) => {
	try {
		const user = await User.findById(req.user.userId);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}
		
		// Return in same format as login/register
		res.json({
			userId: user.user_id,
			username: user.username,
			email: user.email,
			profile_bio: user.profile_bio,
			join_date: user.join_date,
			last_login: user.last_login
		});
	} catch (error) {
		next(error);
	}
});

module.exports = router;