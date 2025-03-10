
<?php

class DatabaseConnection extends PDO
{
    public function __construct()
    {
        $config = require dirname(__FILE__) . '/config.php';
        $db_config = $config["database"];

        // Options de connexion
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ];

        // Instancier la connexion
        $pdo = new PDO(
            "mysql:host={$db_config['host']};dbname={$db_config['dbname']};charset=utf8",
            $db_config['username'],
            $db_config['password'],
            $options
        );

        parent::__construct(
            "mysql:host={$db_config['host']};dbname={$db_config['dbname']};charset=utf8",
            $db_config['username'],
            $db_config['password'],
            $options
        );
    }

    public function safeQuery(string $query, array $params): bool|PDOStatement
    {
        // Préparer la requête
        $requete = parent::prepare($query);
        if ($requete === false) {
            return false;
        }

        // Envoyer les paramètres
        if ($requete->execute($params) === false) {
            return false;
        }

        return $requete;
    }
}
