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
        "SELECT 1 FROM User WHERE name = :username",
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
    $requete = $pdo->prepare("INSERT INTO User (name, password) VALUES (:username, :password);");
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
        "SELECT password, id FROM User WHERE name = :name AND guest = FALSE",
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
        "SELECT 1 FROM User WHERE name=:name;"
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
        "INSERT INTO User (name, guest) VALUES (:username, TRUE);",
        ['username' => $guestName]
    )) {
        return JsonResponse::internalServerError();
    }

    $requete = $pdo->safeQuery(
        "SELECT id FROM User WHERE name=:name AND guest=TRUE;",
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

$router->get("/user/{userId}", function ($userId): JsonResponse {
    // Instancier la connexion
    $pdo = new DatabaseConnection();

    // Préparer la requête
    $requete = $pdo->prepare("SELECT name, join_date, guest FROM User WHERE id = :id");

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

    if (empty($bodyArray['old-password']) || empty($bodyArray['new-password']) ||
    !is_string($bodyArray['old-password']) || !is_string($bodyArray['new-password'])) {
        return JsonResponse::badRequest();
    }

    

    return JsonResponse::success(['id' => $userId, 'payload' => $tokenPayload, 'body' => $bodyArray]);
}, $authMiddleware, $jsonMiddleware);

// Acheminer la requête
$router->dispatch($_SERVER['REQUEST_URI'], $_SERVER['REQUEST_METHOD']);
