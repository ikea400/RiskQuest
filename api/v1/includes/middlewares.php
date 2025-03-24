<?php

use Firebase\JWT\JWT;

require_once dirname(__FILE__) . "/token.php";
require_once dirname(__FILE__) . "/utility.php";

class Filter1 implements Middleware
{
    public function handle(callable $next, ...$args): JsonResponse
    {
        echo "Filter1 -> ";
        $args[] = "from Filter1"; // Modify arguments
        return $next(...$args);
    }
}

class Filter2 implements Middleware
{
    public function handle(callable $next, ...$args): JsonResponse
    {
        echo "Filter2 -> ";
        $args[] = "from Filter2"; // Modify arguments
        return $next(...$args);
    }
}

class Filter3 implements Middleware
{
    public function handle(callable $next, ...$args): JsonResponse
    {
        return JsonResponse::unauthorized();
    }
}

class AuthMiddleware implements Middleware
{
    public function handle(callable $next, ...$args): JsonResponse
    {
        $token = getBearerToken();
        $tokenPayload = null;
        if (!$token || !($tokenPayload = JWTToken::decode($token))) {
            return JsonResponse::forbidden();
        }

        $args[] = $tokenPayload;
        return $next(...$args);
    }
}

class JsonMiddleware implements Middleware
{
    public function handle(callable $next, ...$args): JsonResponse
    {
        if (!isset($_SERVER['CONTENT_TYPE']) || strpos($_SERVER['CONTENT_TYPE'], 'application/json') === false) {
            return JsonResponse::badRequest([], "Invalid JSON format");
        }

        // Extraire une chaîne JSON du corps de la requête
        $contenu = file_get_contents("php://input");
        // Transformer la chaîne JSON en tableau associatif
        if (!$contenu || !($jsonBody = json_decode($contenu, true))) {
            return JsonResponse::badRequest([], "Invalid JSON format");
        }
        $args[] = $jsonBody;
        return $next(...$args);
    }
}

class FallbackMiddleware implements Middleware
{
    public function handle(callable $next, ...$args): JsonResponse
    {
        $response = null;
        try {
            $response = $next(...$args);
        } finally {
            // code executer si il y a une exception ou aucune réponse à été envoyer
            return $response ?? JsonResponse::internalServerError();
        }
    }
}
