-- Sélectionner la base de données
USE tch099_riskquest;

CREATE OR REPLACE TABLE User
(
    id            BIGINT              NOT NULL UNIQUE PRIMARY KEY CHECK ( id > 0 ),
    name          VARCHAR(30) UNIQUE  NOT NULL,
    password      VARCHAR(255) UNIQUE,
    join_date DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    guest         BOOLEAN             NOT NULL DEFAULT FALSE,
    CHECK (guest = TRUE OR password IS NOT NULL)
);

CREATE OR REPLACE TABLE Game
(
    id           BIGINT UNIQUE PRIMARY KEY,
    player_count TINYINT CHECK (player_count >= 1 AND player_count <= 6),
    start_date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    played_time  TIME     NOT NULL DEFAULT '00:00:00',
    finished     BOOLEAN  NOT NULL DEFAULT FALSE
);

CREATE OR REPLACE TABLE Move
(
    game_id   BIGINT NOT NULL,
    number    INT    NOT NULL,
    move_data JSON   NOT NULL CHECK ( JSON_VALID(move_data)),
    player TINYINT   NOT NULL,
    PRIMARY KEY (game_id, number),
    FOREIGN KEY (game_id) REFERENCES Game (id) ON DELETE CASCADE
);

CREATE OR REPLACE TABLE User_Game
(
    game_id   BIGINT NOT NULL,
    user_id   BIGINT NULL,
    player_name VARCHAR(30) NOT NULL,
    player_id TINYINT  NOT NULL CHECK (player_id >= 1 AND player_id <= 6),
    PRIMARY KEY (game_id, player_id),
    FOREIGN KEY (game_id) REFERENCES Game (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User (id) ON DELETE CASCADE
);


DELIMITER $$

CREATE OR REPLACE TRIGGER before_insert_User
    BEFORE INSERT
    ON User
    FOR EACH ROW
BEGIN
    DECLARE new_id BIGINT;
    DECLARE id_exists BOOLEAN DEFAULT TRUE;
    DECLARE max_attempts INT DEFAULT 10;
    DECLARE attempts INT DEFAULT 0;

    IF NEW.id IS NULL OR NEW.id = 0 THEN
        WHILE id_exists AND attempts < max_attempts DO
            SET new_id = 1 + FLOOR(RAND() * (9223372036854775806));
            SET id_exists = (SELECT COUNT(*) FROM User WHERE id = new_id) > 0;
            SET attempts = attempts + 1;
        END WHILE;

        IF id_exists THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Failed to generate a unique id after 10 attempts';
        ELSE
            SET NEW.id = new_id;
        END IF;
    END IF;
END$$

CREATE OR REPLACE TRIGGER before_update_User
    BEFORE UPDATE
    ON User
    FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot update the id field';
    END IF;
END$$

CREATE OR REPLACE TRIGGER before_insert_Game
    BEFORE INSERT
    ON Game
    FOR EACH ROW
BEGIN
    DECLARE new_id BIGINT;
    DECLARE id_exists BOOLEAN DEFAULT TRUE;
    DECLARE max_attempts INT DEFAULT 10;
    DECLARE attempts INT DEFAULT 0;

    IF NEW.id IS NULL OR NEW.id = 0 THEN
        WHILE id_exists AND attempts < max_attempts DO
            SET new_id = 1 + FLOOR(RAND() * (9223372036854775807));
            SET id_exists = (SELECT COUNT(*) FROM Game WHERE id = new_id) > 0;
            SET attempts = attempts + 1;
        END WHILE;

        IF id_exists THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Failed to generate a unique id after 10 attempts';
        ELSE
            SET NEW.id = new_id;
        END IF;
    END IF;
END$$


CREATE OR REPLACE TRIGGER before_update_Game
    BEFORE UPDATE
    ON Game
    FOR EACH ROW
BEGIN
    IF NEW.id <> OLD.id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot update the id field';
    END IF;
END$$

CREATE TRIGGER before_insert_Move
    BEFORE INSERT
    ON Move
    FOR EACH ROW
BEGIN
    DECLARE max_number INT;

    -- Find the maximum number for the given game_id
    SELECT IFNULL(MAX(number), 0)
    INTO max_number
    FROM Move
    WHERE game_id = NEW.game_id;

    -- Increment the number
    SET NEW.number = max_number + 1;
END$$

DELIMITER ;

INSERT INTO User (name, guest) VALUES('Guest01', TRUE);

SELECT *
FROM User;

