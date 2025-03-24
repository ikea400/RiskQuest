<?php
class JsonResponse
{
    private function __construct(array $jsonBody, int $responseCode)
    {
        $this->jsonBody = $jsonBody;
        $this->responseCode = $responseCode;
    }

    public static function success($jsonArray = []): JsonResponse
    {
        $jsonArray["success"] = true;
        return self::makeResponse($jsonArray, 200);
    }

    public static function error(int $statusCode, $error, $jsonArray = []): JsonResponse
    {
        $jsonArray["success"] = false;
        $jsonArray["error"] = $error;
        return self::makeResponse($jsonArray, $statusCode);
    }

    public static function badRequest($jsonArray = [], $error = "400 bad request"): JsonResponse
    {
        return self::error(400, $error, $jsonArray);
    }

    public static function internalServerError($jsonArray = [], $error = "500 internal server error"): JsonResponse
    {
        return self::error(500, $error, $jsonArray);
    }

    public static function forbidden($jsonArray = [], $error = "403 forbidden"): JsonResponse
    {
        return self::error(403, $error, $jsonArray);
    }

    public static function unauthorized($jsonArray = [], $error = "401 unauthorized"): JsonResponse
    {
        return self::error(401, $error, $jsonArray);
    }

    public static function notFound($jsonArray = [], $error = "404 not found"): JsonResponse
    {
        return self::error(404, $error, $jsonArray);
    }

    private static function makeResponse($data, int $statusCode): JsonResponse
    {
        return new JsonResponse($data, $statusCode);
    }

    public function send()
    {
        header('Content-Type: application/json');
        http_response_code($this->responseCode);
        echo json_encode($this->jsonBody);
    }

    private array $jsonBody;
    private int $responseCode;
}
