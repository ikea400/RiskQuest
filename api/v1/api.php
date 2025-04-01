<?php

// Déclaration des constantes
define("TOKEN_DURATION", 24 * 60 * 60); // Combien de seconds est ce que les tokens restent en vie. Présentement 24h

// Inclure le routeur
require_once './includes/Router.php';

// Inclure les vendors
require_once "../../vendor/autoload.php";

// Inclure le 
require_once "./includes/utility.php";
require_once "./includes/json_response.php";
require_once "./includes/middlewares.php";
require_once "./includes/database_connection.php";
require_once "./includes/token.php";

// Instancier le routeur
$router = new Router();

// Instancion des middleware
$jsonMiddleware = new JsonMiddleware();
$fallbackMiddleware = new FallbackMiddleware();
$authMiddleware = new AuthMiddleware();

$router->post("/register", function ($bodyArray): JsonResponse {

    if (
        empty($bodyArray["username"]) || empty($bodyArray["password"]) ||
        !is_string($bodyArray["username"]) || !is_string($bodyArray["password"])
    ) {
        return JsonResponse::badRequest();
    }
    $username = trim($bodyArray["username"]);
    $password = trim($bodyArray["password"]);

    $error = array_merge(validateUsername($username), verifyPassword($password));
    if (!empty($error)) {
        return JsonResponse::badRequest(["reason" => $error]);
    }

    // Instancier la connexion
    $pdo = new DatabaseConnection();

    // Generation de la requete
    $requete = $pdo->safeQuery(
        "SELECT 1 FROM user WHERE name = :username",
        ['username' => $username]
    );
    if (!$requete) {
        return JsonResponse::internalServerError();
    }

    // Récupérer tous les résultats
    if ($requete->fetch()) {
        return JsonResponse::error(409, "Nom d'utilisateur déja utiliser");
    }

    // hash le mot de passe
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Generation de la seconde requete
    $requete = $pdo->prepare("INSERT INTO user (name, password) VALUES (:username, :password);");
    if (!$requete->execute(
        [
            'username' => $username,
            'password' => $hashedPassword
        ]
    )) {
        return JsonResponse::internalServerError();
    }

    return JsonResponse::success();
}, $jsonMiddleware);

$router->post("/login", function ($bodyArray): JsonResponse {
    if (
        empty($bodyArray["username"]) || empty($bodyArray["password"]) ||
        !is_string($bodyArray["username"]) || !is_string($bodyArray["password"])
    ) {
        return JsonResponse::badRequest();
    }
    $username = trim($bodyArray["username"]);
    $password = trim($bodyArray["password"]);

    // Instancier la connexion
    $pdo = new DatabaseConnection();

    // Generation de la requete
    $requete = $pdo->safeQuery(
        "SELECT password, id FROM user WHERE name = :name AND guest = FALSE",
        ['name' => $username]
    );

    // Récupérer tous les résultats
    $resultat = $requete->fetchAll();
    if (count($resultat) != 1 || !password_verify($password,  $resultat[0]["password"])) {
        return JsonResponse::unauthorized([], "Identifiants invalides");
    }

    return JsonResponse::success([
        "token" => JWTToken::encode([
            "username" => $bodyArray["username"],
            "id" => $resultat[0]["id"]
        ]),
        "id" => $resultat[0]["id"]
    ]);
}, $jsonMiddleware);

$router->post("/guest", function (): JsonResponse {

    // Instancier la connexion
    $pdo = new DatabaseConnection();

    // Préparer la requête
    $requete = $pdo->prepare(
        "SELECT 1 FROM user WHERE name=:name;"
    );


    $remaningTries = 100;
    do {
        $guestName = randomGuestName();
        // Envoyer les paramètres
        $requete->execute(['name' => $guestName]);

        $result = $requete->fetch();
    } while (!$result && $remaningTries-- > 0);

    if ($result) {
        return JsonResponse::internalServerError();
    }

    // Insérer le nouveaux invité
    if (!$pdo->safeQuery(
        "INSERT INTO user (name, guest) VALUES (:username, TRUE);",
        ['username' => $guestName]
    )) {
        return JsonResponse::internalServerError();
    }

    $requete = $pdo->safeQuery(
        "SELECT id FROM user WHERE name=:name AND guest=TRUE;",
        ['name' => $guestName]
    );

    $result = $requete->fetch();

    return JsonResponse::success([
        'token' => JWTToken::encode([
            'name' => $guestName,
            'id' => $result['id'],
            'guest' => true
        ]),
        'name' => $guestName,
        'id' => $result['id']
    ]);
});

$router->get("/games/{userId}", function ($userId, $tokenPayload): JsonResponse {
    if (!$userId || !is_numeric($userId) || $userId != $tokenPayload["id"]) {
        return JsonResponse::unauthorized();
    }

    $pdo = new DatabaseConnection();

    $requete = $pdo->safeQuery(
        "SELECT game_id FROM User_Game WHERE user_id=:userId;",
        ['userId' => $userId]
    );

    if (!$requete) {
        return JsonResponse::internalServerError();
    }

    return JsonResponse::success(["games" => $requete->fetchAll()]);
}, $authMiddleware);

$router->get("/game/{gameId}", function ($gameId, $tokenPayload): JsonResponse {
    if (!is_numeric($gameId) && is_null($gameId)) {
        return JsonResponse::badRequest();
    }

    $pdo = new DatabaseConnection();

    $result = $pdo->safeQuery(
        "SELECT * FROM Game JOIN Move ON Game.id = Move.game_id WHERE Game.id = :gameId;",
        ['gameId' => $gameId]
    );
    return JsonResponse::success($result->fetch());
}, $authMiddleware, $jsonMiddleware);

$router->post("/saveMove", function ($tokenPayload, $bodyArray): JsonResponse {

    if (empty($bodyArray)) {
        return JsonResponse::badRequest();
    }

    $pdo = new DatabaseConnection();
    //retrieve game id to identify the move 
    $playerList = $bodyArray["players"];
    $game_id = $playerList[7];
    $move = $bodyArray["move"];
    $currentPlayer = $move["player"];
    $moveJson = json_encode($bodyArray, true);
    if (!$pdo->safeQuery(
        "INSERT INTO Move (game_id, move_data, player) VALUES (:game_id, :move_data, :player);",
        [
            "game_id" => $game_id,
            "move_data" => $moveJson,
            "player" => $currentPlayer
        ]
    )) {
        return JsonResponse::badRequest();
    }

    return JsonResponse::success();
}, $authMiddleware, $jsonMiddleware);



$router->post("/initializegame", function ($tokenPayload, $bodyArray): JsonResponse {

    if (empty($bodyArray)) {
        return JsonResponse::badRequest();
    }

    $pdo = new DatabaseConnection();

    $pdo->beginTransaction();

    if (!$pdo->safeQuery(
        "INSERT INTO Game (player_count, start_date) VALUES (:player_count, NOW());",
        ['player_count' => $bodyArray["playerCount"]]
    )) {
        $pdo->rollBack();
        return JsonResponse::internalServerError();
    }

    $game_id = $pdo->lastInsertId();
    $counter = 0;
    foreach ($bodyArray["players"] as $index => $player) {
        //dans players, le premier element est null
        if ($counter++ ==  0) continue;

        $playerName = $player["name"];
        if (!$pdo->safeQuery(
            "INSERT INTO User_Game (game_id, player_name, player_id) 
             VALUES (:game_id, :player_name, :player_id);",
            [
                'game_id'     => $game_id,
                'player_name' => $playerName,
                'player_id'   => $index
            ]

        )) {
            $pdo->rollBack();
            return JsonResponse::internalServerError();
        }
    }

    $pdo->commit();
    //need the game_id to add it to game data, and to save move
    return JsonResponse::success(['gameId' => $game_id]);
}, $authMiddleware, $jsonMiddleware);


$router->get("/user/{userId}", function ($userId): JsonResponse {
    // Instancier la connexion
    $pdo = new DatabaseConnection();

    // Préparer la requête
    $requete = $pdo->prepare("SELECT name, join_date, guest FROM user WHERE id = :id");

    // Envoyer les paramètres
    $requete->execute(['id' => $userId]);

    // Récupérer le premier résultat
    $result = $requete->fetch();
    if (!$result) {
        return JsonResponse::notFound();
    }

    return JsonResponse::success([
        "username" => $result["name"],
        "join_date" => $result["join_date"],
        'guest' => (bool)$result["guest"]
    ]);
}, $authMiddleware);

$router->post("/user/password/{userId}", function ($userId, $tokenPayload, $bodyArray): JsonResponse {
    if (!is_numeric($userId) || $userId != $tokenPayload["id"] || ($tokenPayload['guest'] ?? false)) {
        return JsonResponse::unauthorized();
    }

    if (
        empty($bodyArray['old-password']) || empty($bodyArray['new-password']) ||
        !is_string($bodyArray['old-password']) || !is_string($bodyArray['new-password'])
    ) {
        return JsonResponse::badRequest();
    }



    return JsonResponse::success(['id' => $userId, 'payload' => $tokenPayload, 'body' => $bodyArray]);
}, $authMiddleware, $jsonMiddleware);

// Acheminer la requête
$router->dispatch($_SERVER['REQUEST_URI'], $_SERVER['REQUEST_METHOD']);
