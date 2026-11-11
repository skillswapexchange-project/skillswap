import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Avatar, Brand, Button } from './UI.jsx';

const navigation = [
  { to: '/', label: 'Overview', end: true },
  { to: '/skills', label: 'Explore skills' },
  { to: '/exchanges', label: 'My exchanges' },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Brand />
        <p className="nav-caption">Workspace</p>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
            >
              <span className="nav-dot" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-line" />
          <p>Good things grow when knowledge is shared.</p>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="mobile-brand"><Brand /></div>
          <p className="topbar-context" aria-live="polite">
            {location.pathname === '/profile' ? 'Your account' : 'A little learning goes a long way'}
          </p>
          <div className="topbar-user">
            <NavLink className="user-chip" to="/profile">
              <Avatar user={user} size="small" />
              <span className="user-chip-name">{user?.first_name || 'Your profile'}</span>
            </NavLink>
            <Button variant="quiet" onClick={logout}>Sign out</Button>
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `mobile-nav-link${isActive ? ' is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="content">
          <Outlet />
        </main>
        <footer className="app-footer">SkillSwap <span>·</span> Learn by sharing</footer>
      </div>
    </div>
  );
}

export function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="public-frame">
      <header className="public-header">
        <Brand />
        <nav aria-label="Account navigation">
          {user ? (
            <NavLink className="button button-secondary" to="/">Go to your workspace</NavLink>
          ) : (
            <NavLink className="button button-quiet" to="/login">Sign in</NavLink>
          )}
        </nav>
      </header>
      <main className="public-content"><Outlet /></main>
      <footer className="public-footer">A more generous way to learn.</footer>
    </div>
  );
}
