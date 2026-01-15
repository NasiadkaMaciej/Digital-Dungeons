const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function resetDatabase() {
    let connection;
    try {
        // First connect without specifying database to drop/create it
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('✓ Connected to MySQL server');

        // Read the SQL file
        const sqlPath = path.join(__dirname, 'init-db.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('✓ Read init-db.sql');
        
        // Drop database if exists
        console.log('⚙ Dropping existing database...');
        await connection.query('DROP DATABASE IF EXISTS digital_dungeons');
        console.log('✓ Database dropped');
        
        console.log('⚙ Executing SQL script...');

        // Execute the entire SQL script
        await connection.query(sql);

        console.log('✓ Database reset complete!');
        console.log('✓ All tables created and sample data inserted');

    } catch (error) {
        console.error('✗ Error resetting database:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('✓ Connection closed');
        }
    }
}

resetDatabase();
