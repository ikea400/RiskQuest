<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTToken
{
    public static function encode(array $payload)
    {
        // set payload default value for payload if not set already.
        $payload['iat'] ??= time();
        $payload['ext'] ??= time() + TOKEN_DURATION;

        [$privateKey, $type] = self::getPrivateKey();
        return JWT::encode($payload, $privateKey, $type);
    }

    public static function decode(string $token, ?stdClass &$headers = null)
    {
        [$publicKey, $type] = self::getPublicKey();
        if (!$publicKey || !$type) {
            return null;
        }

        try {
            //JWT::decode throw si il y a une erreur ou le token est mauvais
            return (array)JWT::decode($token,  new Key($publicKey, $type), $headers);
        } catch (Exception) {
            return null;
        }
    }

    private static function getKeys()
    {
        $config = require dirname(__FILE__) . '/config.php';
        $key_config = $config['key'];

        $privateKey = openssl_pkey_get_private(
            file_get_contents($key_config["private"])
        );
        $publicKey = openssl_pkey_get_details($privateKey)['key'];
        return [$privateKey, $publicKey, $key_config["type"]];
    }

    private static function getPublicKey()
    {
        [$privateKey, $publicKey, $type] = self::getKeys();
        return [$publicKey, $type];
    }

    private static function getPrivateKey()
    {
        [$privateKey, $publicKey, $type] = self::getKeys();
        return [$privateKey, $type];
    }
}
