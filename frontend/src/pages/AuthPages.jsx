import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Alert, Button, TextField } from '../components/UI.jsx';

function AuthFrame({ eyebrow, title, description, children, footer }) {
  return (
    <section className="auth-card">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="auth-description">{description}</p>
      {children}
      <div className="auth-footer">{footer}</div>
    </section>
  );
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'We could not sign you in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="Welcome back"
      title="Sign in"
      description="Pick up where your next exchange begins."
      footer={<>New to SkillSwap? <Link to="/register">Create an account</Link></>}
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <Alert>{error}</Alert>
        <TextField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register({ ...form, email: form.email.trim() });
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'We could not create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="Make a start"
      title="Create your account"
      description="Bring a skill you can share. Leave room for one you can learn."
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <Alert>{error}</Alert>
        <div className="form-row">
          <TextField
            id="first_name"
            name="first_name"
            label="First name"
            autoComplete="given-name"
            maxLength={150}
            required
            value={form.first_name}
            onChange={updateField}
          />
          <TextField
            id="last_name"
            name="last_name"
            label="Last name"
            autoComplete="family-name"
            maxLength={150}
            required
            value={form.last_name}
            onChange={updateField}
          />
        </div>
        <TextField
          id="register-email"
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={updateField}
        />
        <TextField
          id="register-password"
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          hint="Use at least 8 characters."
          required
          value={form.password}
          onChange={updateField}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthFrame>
  );
}
