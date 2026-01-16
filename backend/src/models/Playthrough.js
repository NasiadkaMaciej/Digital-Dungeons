const db = require('../config/database');

class Playthrough {
	static async create({ gameId, userId, gameState }) {
		const [result] = await db.execute(
			'INSERT INTO playthroughs (game_id, user_id, game_state, status) VALUES (?, ?, ?, ?)',
			[gameId, userId, gameState ? JSON.stringify(gameState) : null, 'in_progress']
		);
		return result.insertId;
	}

	static async findById(id) {
		const [rows] = await db.execute(
			'SELECT * FROM playthroughs WHERE playthrough_id = ?',
			[id]
		);
		const row = rows[0];
		if (!row) return null;
		if (row.game_state && typeof row.game_state === 'string') {
			try { row.game_state = JSON.parse(row.game_state); } catch {}
		}
		return row;
	}

	static async findByUser(userId, limit = 20, offset = 0) {
		const [rows] = await db.execute(
			`SELECT p.*, g.title AS game_title
			 FROM playthroughs p
			 JOIN games g ON p.game_id = g.game_id
			 WHERE p.user_id = ?
			 ORDER BY p.last_active DESC
			 LIMIT ? OFFSET ?`,
			[userId, limit, offset]
		);
		return rows.map(row => {
			if (row.game_state && typeof row.game_state === 'string') {
				try { row.game_state = JSON.parse(row.game_state); } catch {}
			}
			return row;
		});
	}

	static async getStats(userId) {
		const [rows] = await db.execute(
			`SELECT 
				COUNT(*) AS total,
				SUM(status = 'in_progress') AS in_progress,
				SUM(status = 'completed') AS completed,
				SUM(status = 'abandoned') AS abandoned
			 FROM playthroughs
			 WHERE user_id = ?`,
			[userId]
		);
		return rows[0];
	}

	static async update(id, { gameState, status }) {
		const updates = [];
		const values = [];
		if (gameState !== undefined) {
			updates.push('game_state = ?');
			values.push(JSON.stringify(gameState));
		}
		if (status !== undefined) {
			updates.push('status = ?');
			values.push(status);
		}
		if (updates.length === 0) return false;
		values.push(id);
		const [result] = await db.execute(
			`UPDATE playthroughs SET ${updates.join(', ')} WHERE playthrough_id = ?`,
			values
		);
		return result.affectedRows > 0;
	}

	static async delete(id) {
		const [result] = await db.execute(
			'DELETE FROM playthroughs WHERE playthrough_id = ?',
			[id]
		);
		return result.affectedRows > 0;
	}

	static async findByUserAndGame(userId, gameId) {
		const [rows] = await db.execute(
			'SELECT * FROM playthroughs WHERE user_id = ? AND game_id = ? ORDER BY last_active DESC LIMIT 1',
			[userId, gameId]
		);
		const row = rows[0];
		if (!row) return null;
		if (row.game_state && typeof row.game_state === 'string') {
			try { row.game_state = JSON.parse(row.game_state); } catch {}
		}
		return row;
	}
}

module.exports = Playthrough;
