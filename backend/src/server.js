const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const gamesRoutes = require('./routes/games');
const usersRoutes = require('./routes/users');
const likesRoutes = require('./routes/likes');
const commentsRoutes = require('./routes/comments');
const playthroughsRoutes = require('./routes/playthroughs');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet());

// CORS – credentials required for httpOnly cookies
app.use(cors({
	origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
	credentials: true
}));

// Cookie parser (must come before auth middleware)
app.use(cookieParser());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Content-Type enforcement for mutating requests
app.use((req, res, next) => {
	if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
		const contentLength = req.headers['content-length'];
		const hasBody = contentLength && parseInt(contentLength) > 0;
		if (hasBody && !req.is('application/json')) {
			return res.status(415).json({ error: 'Unsupported Media Type. Use application/json.' });
		}
	}
	next();
});

// Routes (rate limiting applied per-route in auth.js)
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/playthroughs', playthroughsRoutes);

// Health check
app.get('/api/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});