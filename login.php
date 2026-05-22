<?php
/**
 * Login Page for Portfolio Admin
 * Authenticates against the user table in the database
 */

session_start();

// If already logged in, redirect to admin
if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    header('Location: admin.php');
    exit;
}

require_once 'config.php';

$error = '';

// Handle login form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        $error = 'Please enter both username and password';
    } else {
        try {
            $pdo = getDBConnection();
            
            // Query user from database
            $stmt = $pdo->prepare("
                SELECT id, username, password, active_flag, login_count, contact_id
                FROM user 
                WHERE username = ? AND active_flag = 1
            ");
            
            $stmt->execute([$username]);
            $user = $stmt->fetch();
            
            if ($user) {
                // Check password
                // Note: The database stores passwords in plain text (not secure)
                // In production, you should use password_hash() and password_verify()
                if ($user['password'] === $password) {
                    // Successful login
                    $_SESSION['admin_logged_in'] = true;
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['login_time'] = time();
                    
                    // Update login count and last login date
                    $updateStmt = $pdo->prepare("
                        UPDATE user 
                        SET login_count = login_count + 1, 
                            last_login = CURDATE() 
                        WHERE id = ?
                    ");
                    $updateStmt->execute([$user['id']]);
                    
                    // Redirect to admin page
                    header('Location: admin.php');
                    exit;
                } else {
                    $error = 'Invalid username or password';
                }
            } else {
                $error = 'Invalid username or password';
            }
        } catch (PDOException $e) {
            $error = 'Database error. Please try again later.';
            error_log('Login error: ' . $e->getMessage());
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login - Jeff Donovan Photography</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    
    .login-container {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.5rem;
      padding: 2.5rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .login-header svg {
      color: #2563eb;
      margin-bottom: 1rem;
    }
    
    .login-header h1 {
      color: #f1f5f9;
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .login-header p {
      color: #94a3b8;
      font-size: 0.875rem;
    }
    
    .form-group {
      margin-bottom: 1.5rem;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #f1f5f9;
    }
    
    .form-group input {
      width: 100%;
      padding: 0.75rem;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 0.375rem;
      color: #f1f5f9;
      font-size: 0.875rem;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    
    .form-group input:focus {
      outline: none;
      border-color: #2563eb;
    }
    
    .error-message {
      background: #7f1d1d;
      border: 1px solid #991b1b;
      border-radius: 0.375rem;
      padding: 0.75rem;
      margin-bottom: 1.5rem;
      color: #fecaca;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .error-icon {
      flex-shrink: 0;
    }
    
    .btn {
      width: 100%;
      padding: 0.75rem;
      background: #2563eb;
      border: none;
      border-radius: 0.375rem;
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .btn:hover {
      background: #1e40af;
    }
    
    .btn:disabled {
      background: #334155;
      cursor: not-allowed;
    }
    
    .login-footer {
      margin-top: 1.5rem;
      text-align: center;
      padding-top: 1.5rem;
      border-top: 1px solid #334155;
    }
    
    .login-footer a {
      color: #60a5fa;
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s;
    }
    
    .login-footer a:hover {
      color: #93c5fd;
    }
    
    .info-box {
      background: #1e3a5f;
      border: 1px solid #2563eb;
      border-radius: 0.375rem;
      padding: 1rem;
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: #bfdbfe;
    }
    
    .info-box strong {
      color: #FFFACD;
    }
    
    code {
      background: #0f172a;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-family: 'Courier New', monospace;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-header">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
        <circle cx="12" cy="13" r="3"/>
      </svg>
      <h1>Portfolio Admin</h1>
      <p>Sign in to manage your portfolios</p>
    </div>
    
    <?php if (!empty($error)): ?>
      <div class="error-message">
        <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span><?php echo htmlspecialchars($error); ?></span>
      </div>
    <?php endif; ?>
    
    <form method="POST" action="">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required autofocus value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>">
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required>
      </div>
      
      <button type="submit" class="btn">Sign In</button>
    </form>
    
    <div class="login-footer">
      <a href="index.html">← Back to Website</a>
    </div>
    
  </div>
</body>
</html>
