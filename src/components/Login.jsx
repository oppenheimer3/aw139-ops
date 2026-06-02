import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-logo-wrap">
          <img src="/GAPC.png" alt="GAPC" className="login-logo" />
        </div>
        <h1>AW139 Operations</h1>
        <h2>Sign In</h2>
        {error && (
          <div className="error" onClick={clearError}>
            {error}
          </div>
        )}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
