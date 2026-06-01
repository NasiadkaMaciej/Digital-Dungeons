const db = require('../config/database');

// Helper to safely parse JSON
const parseJSON = (str) => {
	try {
		return typeof str === 'string' ? JSON.parse(str) : str;
	} catch {
		return null;
	}
};

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
			rows[0].game_content = parseJSON(rows[0].game_content);
			rows[0].tags = rows[0].game_content?.globalMeta?.tags || [];
		}
		return rows[0];
	}

	static async findAll({ published = true, tags = [] }) {
		let query = `SELECT g.game_id, g.title, g.description, g.create_date, g.likes_count, g.plays_count,
              u.username as author_name,
              JSON_EXTRACT(g.game_content, '$.globalMeta.tags') as tags_json
       FROM games g
       JOIN users u ON g.author_id = u.user_id
       WHERE g.is_published = ?`;

		const params = [published];

		if (tags.length > 0) {
			const tagConditions = tags.map(() =>
				`JSON_CONTAINS(JSON_EXTRACT(g.game_content, '$.globalMeta.tags'), JSON_QUOTE(?))`
			);
			query += ` AND ${tagConditions.join(' AND ')}`;
			params.push(...tags);
		}

		query += ` ORDER BY g.create_date DESC`;

		const [rows] = await db.execute(query, params);
		return rows.map(({ tags_json, ...row }) => ({
			...row,
			tags: parseJSON(tags_json) || []
		}));
	}

	static async findByAuthor(authorId, onlyPublished = false) {
		let query = `SELECT game_id, title, description, create_date, update_date, is_published, likes_count, plays_count, game_content
       FROM games
       WHERE author_id = ?`;
		if (onlyPublished) query += ` AND is_published = TRUE`;
		query += ` ORDER BY update_date DESC`;

		const [rows] = await db.execute(query, [authorId]);
		return rows.map(row => {
			const content = parseJSON(row.game_content);
			return {
				...row,
				game_content: content,
				tags: content?.globalMeta?.tags || []
			};
		});
	}

	static async getAuthorStats(authorId) {
		const [rows] = await db.execute(
			`SELECT COUNT(*) as game_count,
			        COALESCE(SUM(likes_count), 0) as total_likes,
			        COALESCE(SUM(plays_count), 0) as total_plays
			 FROM games WHERE author_id = ?`,
			[authorId]
		);
		return rows[0];
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