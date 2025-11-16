const errorHandler = (err, req, res, next) => {
	console.error('Error:', err);

	if (err.code === 'ER_DUP_ENTRY') {
		return res.status(400).json({ error: 'Duplicate entry. Resource already exists.' });
	}

	if (err.name === 'JsonWebTokenError') {
		return res.status(401).json({ error: 'Invalid token' });
	}

	if (err.name === 'TokenExpiredError') {
		return res.status(401).json({ error: 'Token expired' });
	}

	res.status(err.status || 500).json({
		error: err.message || 'Internal server error',
		...(process.env.NODE_ENV === 'development' && { stack: err.stack })
	});
};

module.exports = errorHandler;