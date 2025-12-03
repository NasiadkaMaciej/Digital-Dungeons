const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db'); // Assume a database connection module exists
const { isValidEmail, isValidPassword, isValidUsername, isStrongPassword } = require('../utils/validation');

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
	const { email, password } = req.body;

	if (!isValidEmail(email) || !isValidPassword(password)) {
		return res.status(400).json({ error: 'Invalid email or password format.' });
	}

	try {
		const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
		if (!user || !(await bcrypt.compare(password, user.password))) {
			return res.status(401).json({ error: 'Invalid credentials.' });
		}

		// Simulate a session token (replace with real token generation)
		res.json({ message: 'Login successful', user: { id: user.user_id, username: user.username } });
	} catch (err) {
		res.status(500).json({ error: 'Internal server error.' });
	}
});

// Registration route
router.post('/register', async (req, res) => {
	const { username, email, password } = req.body;

	// Validate username
	if (!isValidUsername(username)) {
		return res.status(400).json({ error: 'Invalid username. Must be 3-20 characters long and contain only letters, numbers, or underscores.' });
	}

	// Validate email
	if (!isValidEmail(email)) {
		return res.status(400).json({ error: 'Invalid email format.' });
	}

	// Validate password
	if (!isStrongPassword(password)) {
		return res.status(400).json({ error: 'Weak password. Must be at least 8 characters long and include at least one letter and one number.' });
	}

	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		await db.query(
			'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
			[username, email, hashedPassword]
		);
		res.status(201).json({ message: 'User registered successfully.' });
	} catch (err) {
		if (err.code === 'ER_DUP_ENTRY') {
			res.status(409).json({ error: 'Username or email already exists.' });
		} else {
			res.status(500).json({ error: 'Internal server error.' });
		}
	}
});

// Fetch games route
router.get('/games', async (req, res) => {
	try {
		const games = await db.query('SELECT * FROM games WHERE is_published = TRUE');
		res.json(games);
	} catch (err) {
		res.status(500).json({ error: 'Internal server error.' });
	}
});

module.exports = router;
