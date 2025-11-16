const db = require('../config/database');

class Game {
	static async create({ title, description, authorId, gameContent }) {
		const [result] = await db.execute(
			'INSERT INTO games (title, description, author_id, game_content) VALUES (?, ?, ?, ?)',
			[title, description, authorId, JSON.stringify(gameContent)]
		);
		return result.insertId;
	}

	static async findById(gameId) {
		const [rows] = await db.execute(
			`SELECT g.*, u.username as author_name 
       FROM games g 
       JOIN users u ON g.author_id = u.user_id 
       WHERE g.game_id = ?`,
			[gameId]
		);
		if (rows[0]) {
			rows[0].game_content = JSON.parse(rows[0].game_content);
		}
		return rows[0];
	}

	static async findAll({ limit = 20, offset = 0, published = true }) {
		const [rows] = await db.execute(
			`SELECT g.game_id, g.title, g.description, g.create_date, g.likes_count, g.plays_count,
              u.username as author_name
       FROM games g
       JOIN users u ON g.author_id = u.user_id
       WHERE g.is_published = ?
       ORDER BY g.create_date DESC
       LIMIT ? OFFSET ?`,
			[published, limit, offset]
		);
		return rows;
	}

	static async findByAuthor(authorId) {
		const [rows] = await db.execute(
			`SELECT game_id, title, description, create_date, update_date, is_published, likes_count, plays_count
       FROM games
       WHERE author_id = ?
       ORDER BY update_date DESC`,
			[authorId]
		);
		return rows;
	}

	static async update(gameId, { title, description, gameContent, isPublished }) {
		const updates = [];
		const values = [];

		if (title !== undefined) {
			updates.push('title = ?');
			values.push(title);
		}
		if (description !== undefined) {
			updates.push('description = ?');
			values.push(description);
		}
		if (gameContent !== undefined) {
			updates.push('game_content = ?');
			values.push(JSON.stringify(gameContent));
		}
		if (isPublished !== undefined) {
			updates.push('is_published = ?');
			values.push(isPublished);
		}

		if (updates.length === 0) return false;

		values.push(gameId);
		const [result] = await db.execute(
			`UPDATE games SET ${updates.join(', ')} WHERE game_id = ?`,
			values
		);
		return result.affectedRows > 0;
	}

	static async delete(gameId) {
		const [result] = await db.execute('DELETE FROM games WHERE game_id = ?', [gameId]);
		return result.affectedRows > 0;
	}

	static async incrementPlaysCount(gameId) {
		await db.execute('UPDATE games SET plays_count = plays_count + 1 WHERE game_id = ?', [gameId]);
	}
}

module.exports = Game;