const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const JWT_ALGORITHMS = ['HS256'];

// Validation helper
const validateRequest = (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.status(400).json({ errors: errors.array() });
		return false;
	}
	return true;
};

const auth = (req, res, next) => {
	try {
		const token = req.cookies?.authToken;

		if (!token) {
			return res.status(401).json({ error: 'Access denied. No token provided.' });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET, {
			algorithms: JWT_ALGORITHMS,
		});
		req.user = decoded;
		next();
	} catch (error) {
		res.status(401).json({ error: 'Invalid token.' });
	}
};

const optionalAuth = (req, res, next) => {
	try {
		const token = req.cookies?.authToken;
		if (token) {
			const decoded = jwt.verify(token, process.env.JWT_SECRET, {
				algorithms: JWT_ALGORITHMS,
			});
			req.user = decoded;
		}
		next();
	} catch (error) {
		next();
	}
};

module.exports = { auth, optionalAuth, validateRequest };