<?php

// credits https://stackoverflow.com/a/40582472 pour getAuthorizationHeader et getBearerToken
/** 
 * Get header Authorization
 * */
function getAuthorizationHeader()
{
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { //Nginx or fast CGI
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } else if ($requestHeaders = getallheaders()){
        // Server-side fix for bug in old Android versions (a nice side-effect of this fix means we don't care about capitalization for Authorization)
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    return $headers;
}

/**
 * get access token from header
 * */
function getBearerToken(): ?string
{
    $headers = getAuthorizationHeader();
    // HEADER: Get the access token from the header
    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

/**
 * Validates a password based on several criteria.
 *
 * The function checks the following criteria:
 * - Password must be at least 8 characters long.
 * - Password must contain at least one uppercase letter.
 * - Password must contain at least one lowercase letter.
 * - Password must contain at least one numeric digit.
 * - Password must contain at least one special character.
 *
 * @param string $password The password to be validated.
 * @return array<string> An array of error messages if the password does not meet the requirements, an empty array if the password is valid.
 */
function verifyPassword($password) : array {
    $errors = [];
    
    // Check if password is at least 8 characters long
    if (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters long.';
    }
    
    // Check if password contains at least one uppercase letter
    if (!preg_match('/[A-Z]/', $password)) {
        $errors[] = 'Password must contain at least one uppercase letter.';
    }
    
    // Check if password contains at least one lowercase letter
    if (!preg_match('/[a-z]/', $password)) {
        $errors[] = 'Password must contain at least one lowercase letter.';
    }
    
    // Check if password contains at least one number
    if (!preg_match('/[0-9]/', $password)) {
        $errors[] = 'Password must contain at least one number.';
    }
    
    // Check if password contains at least one special character
    if (!preg_match('/[\W_]/', $password)) {
        $errors[] = 'Password must contain at least one special character.';
    }
    
    return $errors;
}

/**
 * Validates a username based on length criteria.
 *
 * The function checks the following criteria:
 * - Username length (after trimming) must be between 3 and 30 characters.
 *
 * @param string $username The username to be validated.
 * @return array<string> An array of error messages if the username does not meet the requirements, an empty array if the username is valid.
 */
function validateUsername($username) : array {
    $errors = [];
    
    // Check if username length is between 3 and 30 characters
    $length = strlen($username);
    if ($length < 3 || $length > 30) {
        $errors[] = 'Username length must be between 3 and 30 characters.';
    }
    
    return $errors;
}

function randomGuestName() {
    return "Guest".rand(100, 5000000);
}


