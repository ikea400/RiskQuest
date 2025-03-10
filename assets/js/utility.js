export function verifyPassword(password) {
    const errors = [];
    
    // Check if password is at least 8 characters long
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long.');
    }
    
    // Check if password contains at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter.');
    }
    
    // Check if password contains at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter.');
    }
    
    // Check if password contains at least one number
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number.');
    }
    
    // Check if password contains at least one special character
    if (!/[\W_]/.test(password)) {
        errors.push('Password must contain at least one special character.');
    }
    
    return errors;
}

export function verifyUsername(username) {
    const errors = [];
    
    // Check if username length is between 3 and 30 characters
    const length = username.length;
    if (length < 3 || length > 30) {
        errors.push('Username length must be between 3 and 30 characters.');
    }
    
    return errors;
}