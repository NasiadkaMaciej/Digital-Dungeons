const db = require('../config/database');

class Like {
    static async create(userId, gameId) {
        try {
            await db.execute(
                'INSERT INTO likes (user_id, game_id) VALUES (?, ?)',
                [userId, gameId]
            );
            // Increment likes count on game
            await db.execute(
                'UPDATE games SET likes_count = likes_count + 1 WHERE game_id = ?',
                [gameId]
            );
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Game already liked');
            }
            throw error;
        }
    }

    static async delete(userId, gameId) {
        const [result] = await db.execute(
            'DELETE FROM likes WHERE user_id = ? AND game_id = ?',
            [userId, gameId]
        );
        
        if (result.affectedRows > 0) {
            // Decrement likes count on game
            await db.execute(
                'UPDATE games SET likes_count = GREATEST(0, likes_count - 1) WHERE game_id = ?',
                [gameId]
            );
        }
        
        return result.affectedRows > 0;
    }

    static async findByUser(userId, limit = 50, offset = 0) {
        const [rows] = await db.execute(
            `SELECT l.like_id, l.date_liked, g.game_id, g.title, g.description, 
                    g.likes_count, g.plays_count, u.username as author_name
             FROM likes l
             JOIN games g ON l.game_id = g.game_id
             JOIN users u ON g.author_id = u.user_id
             ORDER BY l.date_liked DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        return rows;
    }

    static async checkLike(userId, gameId) {
        const [rows] = await db.execute(
            'SELECT 1 FROM likes WHERE user_id = ? AND game_id = ?',
            [userId, gameId]
        );
        return rows.length > 0;
    }
}

module.exports = Like;
