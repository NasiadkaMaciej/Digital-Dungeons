const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const User = require('../models/User');
const { auth, validateRequest } = require('../middleware/auth');

// Rate limiter for login/register – 20 attempts per 15 minutes per IP
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	message: { error: 'Too many attempts, please try again later.' },
	standardHeaders: true,
	legacyHeaders: false,
});

// httpOnly cookie options
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'strict',
	maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
	path: '/',
};

function signToken(payload) {
	return jwt.sign(payload, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRE || '7d',
		algorithm: 'HS256',
	});
}

// Register
router.post('/register',
	authLimiter,
	[
		body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
		body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
		body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
	],
	async (req, res, next) => {
		try {
			if (!validateRequest(req, res)) return;

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

			// Create user and set auth cookie
			const userId = await User.create({ username, email, password });
			const token = signToken({ userId, username });

			res.cookie('authToken', token, COOKIE_OPTIONS);
			res.status(201).json({
				message: 'User registered successfully',
				user: { userId, username, email }
			});
		} catch (error) {
			next(error);
		}
	}
);

// Login
router.post('/login',
	authLimiter,
	[
		body('email').isEmail().normalizeEmail(),
		body('password').notEmpty()
	],
	async (req, res, next) => {
		try {
			if (!validateRequest(req, res)) return;

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

			const token = signToken({ userId: user.user_id, username: user.username });

			res.cookie('authToken', token, COOKIE_OPTIONS);
			res.json({
				message: 'Login successful',
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

// Logout – clears the auth cookie
router.post('/logout', (req, res) => {
	res.clearCookie('authToken', { path: '/' });
	res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', auth, async (req, res, next) => {
	try {
		const user = await User.findById(req.user.userId);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

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