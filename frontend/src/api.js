const API_BASE_URL = 'http://localhost:3000/api'; // Adjust as needed

export async function login(email, password) {
	const response = await fetch(`${API_BASE_URL}/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	});

	if (!response.ok) {
		throw new Error('Failed to log in');
	}

	return response.json();
}

export async function fetchGames() {
	const response = await fetch(`${API_BASE_URL}/games`);

	if (!response.ok) {
		throw new Error('Failed to fetch games');
	}

	return response.json();
}

export async function register(username, email, password) {
	const response = await fetch(`${API_BASE_URL}/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, email, password }),
	});

	if (!response.ok) {
		throw new Error('Failed to register');
	}

	return response.json();
}
