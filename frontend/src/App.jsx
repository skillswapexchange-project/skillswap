import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import { AppLayout, PublicLayout } from './components/AppLayout.jsx';
import { Alert, Button, LoadingState } from './components/UI.jsx';
import { ExchangesPlaceholder } from './pages/FeaturePlaceholder.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { LoginPage, RegisterPage } from './pages/AuthPages.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { SkillsPage } from './pages/SkillsPage.jsx';

function SessionGate({ children }) {
  const { isLoading, sessionError, retrySession, logout, user } = useAuth();

  if (isLoading) return <LoadingState label="Restoring your session…" />;
  if (sessionError) {
    return (
      <div className="session-error">
        <Alert>{sessionError}</Alert>
        <div className="session-error-actions">
          <Button onClick={retrySession}>Try again</Button>
          <Button variant="secondary" onClick={logout}>Sign out</Button>
        </div>
      </div>
    );
  }
  return children(user);
}

function WorkspaceRoutes() {
  const location = useLocation();

  return (
    <SessionGate>
      {(user) => user ? (
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="skills" element={<SkillsPage />} />
            <Route path="exchanges" element={<ExchangesPlaceholder />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      ) : (
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="skills" element={<SkillsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/login" replace state={{ from: location }} />} />
          </Route>
        </Routes>
      )}
    </SessionGate>
  );
}

function LandingPage() {
  return (
    <section className="landing">
      <p className="eyebrow">Knowledge is better shared</p>
      <h1>Trade what you know for what you’d love to learn.</h1>
      <p className="landing-description">
        SkillSwap brings people together to teach, learn, and make something of the skills they already have.
      </p>
      <div className="landing-actions">
        <Link className="button button-primary" to="/register">Get started <span aria-hidden="true">↗</span></Link>
        <Link className="text-link" to="/login">I already have an account <span aria-hidden="true">→</span></Link>
      </div>
      <div className="landing-rule"><span /> Learn by sharing</div>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<WorkspaceRoutes />} />
    </Routes>
  );
}
