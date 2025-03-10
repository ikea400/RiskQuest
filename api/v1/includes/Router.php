<?php

/**
 * Interface Middleware
 * Définit une interface pour tous les middlewares.
 */
interface Middleware
{
    public function handle(callable $next, ...$args) : JsonResponse;
}


/**
 * Classe Router
 * 
 * Une classe de routeur simple pour gérer les requêtes HTTP et les acheminer vers les fonctions de rappel appropriées.
 * 
 * Une limitation connue est que les requêtes dynamiques ne gèrent qu'un seul paramètre ce qui signifie que les routes 
 * comme /user/{id}/post/{postId} ne sont pas prises en charge.
 * 
 */
class Router
{

    /**
     * @var array $routes Tableau pour stocker les routes.
     */
    private $routes = [];

    /**
     * Ajouter une route au routeur.
     * 
     * @param string $methode Méthode HTTP (GET, POST, PUT, DELETE).
     * @param string $route Modèle de route avec des paramètres optionnels entre accolades (par exemple, /user/{id}).
     * @param callable $callback Fonction de rappel pour gérer la route.
     * @param array $middlewares List des middlewares optionnels.
     */
    public function addRoute(string $methode, string $route, callable $callback, Middleware ...$middlewares)
    {
        $this->routes[] = [
            'methode' => strtoupper($methode),
            'route' => $this->route2Regex($route),
            'callback' => $callback,
            'middlewares' =>  $middlewares
        ];
    }

    /**
     * Distribuer la requête à la fonction de rappel de route appropriée.
     * 
     * @param string $requestUri L'URI de la requête.
     * @param string $methode La méthode de la requête (GET, POST, PUT, DELETE).
     * @return mixed Le résultat de la fonction de rappel ou une réponse 404.
     */
    public function dispatch($requestUri, $methode)
    {

        // Obtenir le chemin du script (p. ex., /nom_dossier/index.php)
        $scriptName = dirname($_SERVER['SCRIPT_NAME']);

        // Retirer le chemin du script du chemin de l'URI
        $requestUri = str_replace($scriptName, '', $requestUri);

        // Retirer les paramètres de la requête (p. ex., ?id=1)
        $requestUri = parse_url($requestUri, PHP_URL_PATH);

        // Parcourir les routes et vérifier si l'une correspond à l'URI
        foreach ($this->routes as $route) {

            // Quitter rapidement si la méthode HTTP ne correspond pas
            if ($route['methode'] !== strtoupper($methode)) {
                continue;
            }

            // Convertir la route en expression régulière
            $pattern = $route['route'];

            // Vérifier si la route correspond à l'URI
            if (preg_match($pattern, $requestUri, $matches)) {

                // Retirer le premier élément qui correspond à l'URI complète
                $params = array_slice($matches, 1);

                // Appeler la fonction de rappel ou le premier middleware et passer les paramètres    
                ($this->executeWithMiddleware($route['callback'], $route['middlewares'], $params)
                    ?? JsonResponse::internalServerError())->send();
                return;
            }
        }

        // Si aucune route n'est trouvée, retourner une réponse 404
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Route non trouvée']);
    }

    /**
     * Exécuter la route avec les middlewares en chaîne.
     */
    private function executeWithMiddleware(callable $callback, array $middlewares, array $params): ?JsonResponse
    {
        // Create the initial $next function that will call the callback with the arguments
        $next = function (...$args) use ($callback): ?JsonResponse {
            return call_user_func($callback, ...$args);
        };

        // Loop over the middlewares and wrap each one to call the next one
        while ($middleware = array_pop($middlewares)) {
            // Wrap the next function, appending any new arguments
            $next = function (...$args) use ($middleware, $next): ?JsonResponse {
                // The middleware can now append to the arguments or modify them as needed
                return call_user_func([$middleware, 'handle'], $next, ...$args);
            };
        }

        // Finally, call $next with the initial parameters, which will be passed through each middleware
        return $next(...$params);
    }



    /**
     * Convertir une route en expression régulière.
     * 
     * @param string $route La route à convertir.
     * @return string L'expression régulière correspondante.
     */
    private function route2Regex($route)
    {
        return '/^' . preg_replace('/\{[^\}]+\}/', '([^\/]+)', str_replace('/', '\/', $route)) . '$/';
    }

    /**
     * Méthode utilitaire pour l'ajout d'une route GET.
     * 
     * @param string $route Modèle de route.
     * @param callable $callback Fonction de rappel pour gérer la route.
     * @param array $middlewares List des middlewares optionnels.
     */
    public function get(string $route, callable $callback, Middleware ...$middlewares)
    {
        $this->addRoute('GET', $route, $callback, ...$middlewares);
    }

    /**
     * Méthode utilitaire pour l'ajout d'une route POST.
     * 
     * @param string $route Modèle de route.
     * @param callable $callback Fonction de rappel pour gérer la route.
     * @param array $middlewares List des middlewares optionnels.
     */
    public function post(string $route, callable $callback, Middleware ...$middlewares)
    {
        $this->addRoute('POST', $route, $callback, ...$middlewares);
    }

    /**
     * Méthode utilitaire pour l'ajout d'une route PUT.
     * 
     * @param string $route Modèle de route.
     * @param callable $callback Fonction de rappel pour gérer la route.
     * @param array $middlewares List des middlewares optionnels.
     */
    public function put(string $route, callable $callback, Middleware ...$middlewares)
    {
        $this->addRoute('PUT', $route, $callback, ...$middlewares);
    }

    /**
     * Méthode utilitaire pour l'ajout d'une route DELETE.
     * 
     * @param string $route Modèle de route.
     * @param callable $callback Fonction de rappel pour gérer la route.
     * @param array $middlewares List des middlewares optionnels.
     */
    public function delete(string $route, callable $callback, Middleware ...$middlewares)
    {
        $this->addRoute('DELETE', $route, $callback, ...$middlewares);
    }
}
