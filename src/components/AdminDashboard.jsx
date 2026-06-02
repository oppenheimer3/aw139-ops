import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { session, logout, users, addUser, deleteUser, roles, error, clearError } = useAuth();
  const [newUser, setNewUser] = useState({ username: '', password: '', role: roles[0] });
  const [showForm, setShowForm] = useState(false);

  const nonAdminUsers = users.filter((u) => u.role !== 'Admin');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;
    addUser(newUser);
    if (!error) {
      setNewUser({ username: '', password: '', role: roles[0] });
      setShowForm(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card admin-card">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <div className="header-right">
            <span className="admin-badge">Admin: {session.username}</span>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </div>

        <div className="dashboard-body">
          {error && (
            <div className="error" onClick={clearError}>{error}</div>
          )}

          <div className="section-header">
            <h2>Manage Users</h2>
            <button className="add-btn" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Add User'}
            </button>
          </div>

          {showForm && (
            <form className="add-user-form" onSubmit={handleAdd}>
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button type="submit" className="add-btn">Create User</button>
            </form>
          )}

          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {nonAdminUsers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty-state">No users yet</td>
                </tr>
              ) : (
                nonAdminUsers.map((u) => (
                  <tr key={u.username}>
                    <td>{u.username}</td>
                    <td><span className="role-badge">{u.role}</span></td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => deleteUser(u.username)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
