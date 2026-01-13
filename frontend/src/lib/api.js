/**
 * API client for Digital Dungeons backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
	constructor(message, status, errors = null) {
		super(message);
		this.status = status;
		this.errors = errors;
		this.name = 'ApiError';
	}
}

/**
 * Make HTTP request to backend API
 */
async function apiRequest(endpoint, options = {}) {
	const url = `${API_BASE_URL}${endpoint}`;

	const config = {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	};

	// Add auth token if available
	if (typeof window !== 'undefined') {
		const token = localStorage.getItem('authToken');
		if (token) {
			config.headers['Authorization'] = `Bearer ${token}`;
		}
	}

	try {
		const response = await fetch(url, config);
		const data = await response.json();

		if (!response.ok) {
			throw new ApiError(
				data.error || 'Request failed',
				response.status,
				data.errors
			);
		}

		return data;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError('Network error', 0);
	}
}

// Auth API
export const authApi = {
	async register(username, email, password) {
		return apiRequest('/auth/register', {
			method: 'POST',
			body: JSON.stringify({ username, email, password }),
		});
	},

	async login(email, password) {
		return apiRequest('/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email, password }),
		});
	},

	async getCurrentUser() {
		return apiRequest('/auth/me');
	},
};

// Users API
export const usersApi = {
	async updateProfile(profile_bio) {
		return apiRequest('/users/profile', {
			method: 'PUT',
			body: JSON.stringify({ profile_bio }),
		});
	},

	async getUserById(userId) {
		return apiRequest(`/users/${userId}`);
	},

	async getUserGames(userId) {
		return apiRequest(`/users/${userId}/games`);
	},

	async getUserStats(userId) {
		return apiRequest(`/users/${userId}/stats`);
	},
};

// Helper function for common REST operations
const createRestApi = (basePath) => ({
	getAll: () => apiRequest(basePath),
	getById: (id) => apiRequest(`${basePath}/${id}`),
	create: (data) => apiRequest(basePath, {
		method: 'POST',
		body: JSON.stringify(data),
	}),
	update: (id, data) => apiRequest(`${basePath}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(data),
	}),
	delete: (id) => apiRequest(`${basePath}/${id}`, {
		method: 'DELETE',
	}),
});

// Games API
export const gamesApi = {
	getAllGames: () => apiRequest('/games'),
	getGameById: (id) => apiRequest(`/games/${id}`),
	createGame: (gameData) => apiRequest('/games', {
		method: 'POST',
		body: JSON.stringify(gameData),
	}),
	updateGame: (id, gameData) => apiRequest(`/games/${id}`, {
		method: 'PUT',
		body: JSON.stringify(gameData),
	}),
	deleteGame: (id) => apiRequest(`/games/${id}`, { method: 'DELETE' }),
	getUserGames: (userId) => apiRequest(`/games/user/${userId}`),
};

// Likes API
export const likesApi = {
	likeGame: (gameId) => apiRequest(`/likes/${gameId}`, { method: 'POST' }),
	unlikeGame: (gameId) => apiRequest(`/likes/${gameId}`, { method: 'DELETE' }),
	checkLike: (gameId) => apiRequest(`/likes/check/${gameId}`),
	getUserLikes: (userId, limit = 50, offset = 0) =>
		apiRequest(`/likes/user/${userId}?limit=${limit}&offset=${offset}`),
};

// Comments API
export const commentsApi = {
	getGameComments: (gameId, limit = 50, offset = 0) =>
		apiRequest(`/comments/game/${gameId}?limit=${limit}&offset=${offset}`),
	createComment: (gameId, content) => apiRequest(`/comments/${gameId}`, {
		method: 'POST',
		body: JSON.stringify({ content }),
	}),
	updateComment: (commentId, content) => apiRequest(`/comments/${commentId}`, {
		method: 'PUT',
		body: JSON.stringify({ content }),
	}),
	deleteComment: (commentId) => apiRequest(`/comments/${commentId}`, { method: 'DELETE' }),
};

export { ApiError };
