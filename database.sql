-- Sélectionner la base de données
USE tch099_riskquest;

CREATE OR REPLACE TABLE User
(
    id            BIGINT              NOT NULL UNIQUE PRIMARY KEY CHECK ( id > 0 ),
    name          VARCHAR(30) UNIQUE  NOT NULL,
    password      VARCHAR(255) UNIQUE,
    join_date DATETIME            NOT NULL DEFAULT NOW(),
    guest         BOOLEAN             NOT NULL DEFAULT FALSE,
    CHECK (guest = TRUE OR password IS NOT NULL)
);

CREATE OR REPLACE TABLE Game
(
    id           BIGINT UNIQUE PRIMARY KEY,
    player_count INT1 CHECK (player_count >= 1 AND player_count <= 6),
    start_date   DATETIME NOT NULL DEFAULT NOW(),
    played_time  TIME     NOT NULL DEFAULT 0,
    finished     BOOLEAN  NOT NULL DEFAULT FALSE
);

CREATE OR REPLACE TABLE Move
(
    game_id   BIGINT NOT NULL REFERENCES Game (id),
    number    INT    NOT NULL,
    data      JSON   NOT NULL CHECK ( JSON_VALID(data) ),
    player_id INT1   NOT NULL
);

CREATE OR REPLACE TABLE User_Game
(
    game_id   BIGINT NOT NULL REFERENCES Game (id),
    user_id   BIGINT NOT NULL REFERENCES User (id),
    player_id INT1   NOT NULL CHECK (player_id >= 1 AND player_id <= 6)
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

