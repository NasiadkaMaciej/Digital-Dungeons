-- Create Database
CREATE DATABASE IF NOT EXISTS digital_dungeons;
USE digital_dungeons;

-- Users Table
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    profile_bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_join_date (join_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Games Table
CREATE TABLE games (
    game_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    author_id INT NOT NULL,
    create_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    game_content JSON NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    likes_count INT DEFAULT 0,
    plays_count INT DEFAULT 0,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_author (author_id),
    INDEX idx_create_date (create_date),
    INDEX idx_title (title),
    INDEX idx_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Playthroughs Table
CREATE TABLE playthroughs (
    playthrough_id INT PRIMARY KEY AUTO_INCREMENT,
    game_id INT NOT NULL,
    user_id INT NOT NULL,
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    game_state JSON,
    status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_game (game_id),
    INDEX idx_user (user_id),
    INDEX idx_user_game (user_id, game_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Likes Table
CREATE TABLE likes (
    like_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    date_liked DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_game_like (user_id, game_id),
    INDEX idx_game (game_id),
    INDEX idx_date (date_liked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comments Table
CREATE TABLE comments (
    comment_id INT PRIMARY KEY AUTO_INCREMENT,
    game_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    date_posted DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_game (game_id),
    INDEX idx_user (user_id),
    INDEX idx_date (date_posted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- password: hashedpassword1
INSERT INTO users (username, email, password, profile_bio)
VALUES 
('tester1', 'tester1@example.com', '$2b$10$P8RGLvOVHajIKK8osTL3ueAivFP482vpPJfzwen1RypR2N3WPmAaO', 'Bio for tester1'),
('test', 'test@test.test', 'test', 'Test bio');

-- Sample Games
INSERT INTO games (title, description, author_id, game_content, is_published)
VALUES
('Town Square Tutorial', 'A guided intro showcasing conversations and branching.', 1,
        '{
            "rooms": [
                {"id":"0,0","gx":0,"gy":0,"meta":{"description":"Town square with a helpful Guide.","entities":["guide"],"conversationId":"intro_talk","conversationRepeatable":false,
                    "conversationState": {"nodes": [
                        {"id":"0,0","gx":0,"gy":0,"parentId":null,"meta":{"label":"Welcome to Digital Dungeons!"}},
                        {"id":"1,0","gx":1,"gy":0,"parentId":"0,0","meta":{"label":"Tell me about movement"}},
                        {"id":"1,1","gx":1,"gy":1,"parentId":"0,0","meta":{"label":"How do I fight?"}},
                        {"id":"2,0","gx":2,"gy":0,"parentId":"1,0","meta":{"label":"Use WASD/Arrows to move."}},
                        {"id":"2,1","gx":2,"gy":1,"parentId":"1,1","meta":{"label":"Click or press Space to attack."}}
                    ], "selected": "0,0" } }},
                {"id":"1,0","gx":1,"gy":0,"meta":{"hasChest":true,"description":"Supply stall with basic loot.","entities":["merchant"],"conversationId":"shop_chat","conversationRepeatable":true,
                    "conversationState": {"nodes": [
                        {"id":"0,0","gx":0,"gy":0,"parentId":null,"meta":{"label":"Welcome! Want to browse goods?"}},
                        {"id":"1,0","gx":1,"gy":0,"parentId":"0,0","meta":{"label":"Show me potions"}},
                        {"id":"1,1","gx":1,"gy":1,"parentId":"0,0","meta":{"label":"Any weapons?"}},
                        {"id":"2,0","gx":2,"gy":0,"parentId":"1,0","meta":{"label":"We have Health and Mana potions."}},
                        {"id":"2,1","gx":2,"gy":1,"parentId":"1,1","meta":{"label":"A Rusty Sword and a Wooden Bow."}}
                    ], "selected": "0,0" } }},
                {"id":"0,1","gx":0,"gy":1,"meta":{"description":"Training dummy area.","entities":["trainer"]}}
            ],
            "selected": null,
            "globalMeta": {
                "gameName": "Town Square Tutorial",
                "gameDescription": "A guided intro showcasing conversations and branching.",
                "tags": ["tutorial","conversations","starter"],
                "entities": [
                    {"id":"guide","type":"person","name":"Town Guide"},
                    {"id":"merchant","type":"person","name":"Market Merchant"},
                    {"id":"trainer","type":"person","name":"Combat Trainer"}
                ],
                "items": [
                    {"id":"health_potion","name":"Health Potion","description":"Restores 50 HP"},
                    {"id":"rusty_sword","name":"Rusty Sword","description":"A basic melee weapon"},
                    {"id":"gold_coin","name":"Gold Coin","description":"Currency for trading"}
                ]
            }
        }', TRUE),
('Goblin Caves', 'Explore winding caves inhabited by goblins.', 2,
        '{
            "rooms": [
                {"id":"0,0","gx":0,"gy":0,"meta":{"description":"Cave entrance","entities":["scout"]}},
                {"id":"1,0","gx":1,"gy":0,"meta":{"hasChest":true,"description":"Treasure nook","entities":["scout","goblin_chief"]}},
                {"id":"1,1","gx":1,"gy":1,"meta":{"conversationId":"chief_dialog","conversationRepeatable":true,"description":"Chief\u2019s den","entities":["goblin_chief"]}}
            ],
            "selected": null,
            "globalMeta": {
                "gameName": "Goblin Caves",
                "gameDescription": "Explore winding caves inhabited by goblins.",
                "tags": ["cave","goblins","loot"],
                "entities": [
                    {"id":"scout","type":"monster","name":"Goblin Scout"},
                    {"id":"goblin_chief","type":"boss","name":"Goblin Chief"}
                ],
                "items": [
                    {"id":"torch","name":"Torch","description":"Lights dark tunnels"},
                    {"id":"lockpick","name":"Lockpick","description":"Opens simple locks"}
                ]
            }
        }', TRUE),
('Ruined Keep', 'A larger sample with multiple NPCs and branching quests.', 1,
        '{
            "rooms": [
                {"id":"0,0","gx":0,"gy":0,"meta":{"description":"Broken gate into the keep.","entities":["sentry"]}},
                {"id":"1,0","gx":1,"gy":0,"meta":{"description":"Courtyard littered with debris.","entities":["sentry","villager"]}},
                {"id":"2,0","gx":2,"gy":0,"meta":{"hasChest":true,"description":"Supply cache under the stairs.","entities":["villager"]}},
                {"id":"0,1","gx":0,"gy":1,"meta":{"description":"Collapsed library.","entities":["scholar"],"conversationId":"lore_intro","conversationRepeatable":false,
                    "conversationState": {"nodes": [
                        {"id":"0,0","gx":0,"gy":0,"parentId":null,"meta":{"label":"These ruins hold ancient secrets."}},
                        {"id":"1,0","gx":1,"gy":0,"parentId":"0,0","meta":{"label":"Ask about the keep"}},
                        {"id":"1,1","gx":1,"gy":1,"parentId":"0,0","meta":{"label":"Request a clue"}},
                        {"id":"2,0","gx":2,"gy":0,"parentId":"1,0","meta":{"label":"Built by the Starfall Order."}},
                        {"id":"2,1","gx":2,"gy":1,"parentId":"1,1","meta":{"label":"Seek the crest in the chapel."}}
                    ], "selected": "0,0" } }},
                {"id":"1,1","gx":1,"gy":1,"meta":{"description":"Chapel of the fallen crest.","entities":["priest"],"conversationId":"chapel_choice","conversationRepeatable":true,
                    "conversationState": {"nodes": [
                        {"id":"0,0","gx":0,"gy":0,"parentId":null,"meta":{"label":"You bear the scholars request?"}},
                        {"id":"1,0","gx":1,"gy":0,"parentId":"0,0","meta":{"label":"Yes, I seek the crest"}},
                        {"id":"1,1","gx":1,"gy":1,"parentId":"0,0","meta":{"label":"I need guidance"}},
                        {"id":"2,0","gx":2,"gy":0,"parentId":"1,0","meta":{"label":"Take this crest fragment."}},
                        {"id":"2,1","gx":2,"gy":1,"parentId":"1,1","meta":{"label":"Pray and reflect upon your path."}}
                    ], "selected": "0,0" } }},
                {"id":"2,1","gx":2,"gy":1,"meta":{"description":"Armory with damaged weapons.","entities":["blacksmith"],"conversationId":"forge_help","conversationRepeatable":true,
                    "conversationState": {"nodes": [
                        {"id":"0,0","gx":0,"gy":0,"parentId":null,"meta":{"label":"Need something fixed or forged?"}},
                        {"id":"1,0","gx":1,"gy":0,"parentId":"0,0","meta":{"label":"Repair my sword"}},
                        {"id":"1,1","gx":1,"gy":1,"parentId":"0,0","meta":{"label":"Forge a new blade"}},
                        {"id":"2,0","gx":2,"gy":0,"parentId":"1,0","meta":{"label":"Done. It should hold for now."}},
                        {"id":"2,1","gx":2,"gy":1,"parentId":"1,1","meta":{"label":"A fine steel saber for you."}}
                    ], "selected": "0,0" } }}
            ],
            "selected": null,
            "globalMeta": {
                "gameName": "Ruined Keep",
                "gameDescription": "A larger sample with multiple NPCs and branching quests.",
                "tags": ["keep","ruins","quests","conversations"],
                "entities": [
                    {"id":"sentry","type":"person","name":"Gate Sentry"},
                    {"id":"villager","type":"person","name":"Displaced Villager"},
                    {"id":"scholar","type":"person","name":"Wandering Scholar"},
                    {"id":"priest","type":"person","name":"Chaplain of the Keep"},
                    {"id":"blacksmith","type":"person","name":"Keep Blacksmith"}
                ],
                "items": [
                    {"id":"crest_fragment","name":"Crest Fragment","description":"Piece of the chapel crest"},
                    {"id":"steel_saber","name":"Steel Saber","description":"Reliable newly forged blade"},
                    {"id":"repair_kit","name":"Repair Kit","description":"Restores durability of equipment"}
                ]
            }
        }', TRUE);

-- Sample Playthroughs
INSERT INTO playthroughs (game_id, user_id, game_state, status)
VALUES
(1, 1, '{"currentRoom":1,"inventory":[]}', 'in_progress'),
(2, 2, '{"currentRoom":2,"inventory":["sword"]}', 'completed');

-- Sample Likes
INSERT INTO likes (user_id, game_id)
VALUES
(1, 2),
(2, 1);

-- Sample Comments
INSERT INTO comments (game_id, user_id, content)
VALUES
(1, 2, 'Great game!'),
(2, 1, 'Loved the story!');