const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
	static async create({ username, email, password }) {
		const hashedPassword = await bcrypt.hash(password, 10);
		const [result] = await db.execute(
			'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
			[username, email, hashedPassword]
		);
		return result.insertId;
	}

	static async findById(userId) {
		const [rows] = await db.execute(
			'SELECT user_id, username, email, join_date, last_login, profile_bio FROM users WHERE user_id = ? AND is_active = TRUE',
			[userId]
		);
		return rows[0];
	}

	static async findByEmail(email) {
		const [rows] = await db.execute(
			'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
			[email]
		);
		return rows[0];
	}

	static async findByUsername(username) {
		const [rows] = await db.execute(
			'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
			[username]
		);
		return rows[0];
	}

	static async updateLastLogin(userId) {
		await db.execute(
			'UPDATE users SET last_login = NOW() WHERE user_id = ?',
			[userId]
		);
	}

	static async comparePassword(plainPassword, hashedPassword) {
		return await bcrypt.compare(plainPassword, hashedPassword);
	}
}

module.exports = User;