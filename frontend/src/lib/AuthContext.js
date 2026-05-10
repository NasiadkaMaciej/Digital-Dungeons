'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// On mount, attempt to restore session via the httpOnly cookie.
	// The cookie is sent automatically by the browser – no localStorage needed.
	useEffect(() => {
		loadUser();
	}, []);

	const loadUser = async () => {
		try {
			const userData = await authApi.getCurrentUser();
			setUser(userData);
			setError(null);
		} catch {
			// 401 = not logged in; any other error is also treated as logged-out
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	const login = async (email, password) => {
		try {
			setError(null);
			const response = await authApi.login(email, password);
			// Cookie is set server-side; just store the user object in state
			setUser(response.user);
			return { success: true };
		} catch (err) {
			const errorMessage = err.message || 'Login failed';
			setError(errorMessage);
			return { success: false, error: errorMessage };
		}
	};

	const register = async (username, email, password) => {
		try {
			setError(null);
			const response = await authApi.register(username, email, password);
			setUser(response.user);
			return { success: true };
		} catch (err) {
			const errorMessage = err.message || 'Registration failed';
			setError(errorMessage);
			return { success: false, error: errorMessage };
		}
	};

	const logout = async () => {
		try {
			// Ask the server to clear the httpOnly cookie
			await authApi.logout();
		} catch {
			// Best-effort – clear local state regardless
		} finally {
			setUser(null);
			setError(null);
		}
	};

	const value = {
		user,
		loading,
		error,
		login,
		register,
		logout,
		isAuthenticated: !!user,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within AuthProvider');
	}
	return context;
}
