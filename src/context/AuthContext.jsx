import { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'aw139_users';
const SESSION_KEY = 'aw139_session';

const ROLES = ['Flight Operations', 'Maintenance', 'Pilot'];

function getStoredUsers() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return [{ username: 'admin', password: 'admin', role: 'Admin' }];
}

function getStoredSession() {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return null;
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN': {
      const user = state.users.find(
        (u) => u.username === action.username && u.password === action.password
      );
      if (!user) return { ...state, error: 'Invalid credentials' };
      const session = { username: user.username, role: user.role };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { ...state, session, error: null };
    }
    case 'LOGOUT': {
      localStorage.removeItem(SESSION_KEY);
      return { ...state, session: null, error: null };
    }
    case 'ADD_USER': {
      if (state.users.find((u) => u.username === action.user.username)) {
        return { ...state, error: 'User already exists' };
      }
      const updated = [...state.users, action.user];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { ...state, users: updated, error: null };
    }
    case 'DELETE_USER': {
      const filtered = state.users.filter((u) => u.username !== action.username);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return { ...state, users: filtered, error: null };
    }
    case 'CLEAR_ERROR': {
      return { ...state, error: null };
    }
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    users: getStoredUsers(),
    session: getStoredSession(),
    error: null,
  });

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        dispatch({ type: 'SYNC_USERS', users: getStoredUsers() });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = (username, password) => dispatch({ type: 'LOGIN', username, password });
  const logout = () => dispatch({ type: 'LOGOUT' });
  const addUser = (user) => dispatch({ type: 'ADD_USER', user });
  const deleteUser = (username) => dispatch({ type: 'DELETE_USER', username });
  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  return (
    <AuthContext.Provider value={{ ...state, login, logout, addUser, deleteUser, clearError, roles: ROLES }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
