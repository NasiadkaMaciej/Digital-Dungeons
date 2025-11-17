const db = require('../config/database');

class Comment {
    static async create({ gameId, userId, content }) {
        const [result] = await db.execute(
            'INSERT INTO comments (game_id, user_id, content) VALUES (?, ?, ?)',
            [gameId, userId, content]
        );
        return result.insertId;
    }

    static async findById(commentId) {
        const [rows] = await db.execute(
            `SELECT c.*, u.username as author_name
             FROM comments c
             JOIN users u ON c.user_id = u.user_id
             WHERE c.comment_id = ?`,
            [commentId]
        );
        return rows[0];
    }

    static async findByGame(gameId, limit = 50, offset = 0) {
        const [rows] = await db.execute(
            `SELECT c.*, u.username as author_name
             FROM comments c
             JOIN users u ON c.user_id = u.user_id
             WHERE c.game_id = ?
             ORDER BY c.date_posted DESC
             LIMIT ? OFFSET ?`,
            [gameId, limit, offset]
        );
        return rows;
    }

    static async countByGame(gameId) {
        const [rows] = await db.execute(
            'SELECT COUNT(*) as count FROM comments WHERE game_id = ?',
            [gameId]
        );
        return rows[0].count;
    }

    static async update(commentId, content) {
        await db.execute(
            'UPDATE comments SET content = ?, is_edited = TRUE WHERE comment_id = ?',
            [content, commentId]
        );
    }

    static async delete(commentId) {
        const [result] = await db.execute(
            'DELETE FROM comments WHERE comment_id = ?',
            [commentId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Comment;
