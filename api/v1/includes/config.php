<?php
return [
    "database" => [
        "host" => '127.0.0.1',
        "dbname" => 'tch099_riskquest',
        "username" => 'root',
        "password" => ''
    ],
    "key" => [
        "private" => dirname(dirname(dirname(__DIR__))). '/keys/key.priv',
        "type" => "ES256"
    ]
];