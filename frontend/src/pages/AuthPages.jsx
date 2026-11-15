import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Alert, Button, TextField } from '../components/UI.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';
const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';

function GoogleSignInButton({ onCredential, disabled }) {
  const buttonContainer = useRef(null);
  const callbacks = useRef({ onCredential, disabled });
  const [scriptError, setScriptError] = useState('');
  callbacks.current = { onCredential, disabled };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;

    let active = true;
    let script = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`);
    const showLoadError = () => {
      if (active) setScriptError('Google sign-in could not be loaded. Please try again later.');
    };
    const renderGoogleButton = () => {
      if (!active || !window.google?.accounts?.id || !buttonContainer.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (callbacks.current.disabled) return;
          if (!response.credential) {
            setScriptError('Google sign-in did not return a credential. Please try again.');
            return;
          }
          callbacks.current.onCredential(response.credential);
        },
        auto_select: false,
      });
      window.google.accounts.id.renderButton(buttonContainer.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: Math.min(buttonContainer.current.clientWidth, 360),
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else if (script) {
      script.addEventListener('load', renderGoogleButton, { once: true });
      script.addEventListener('error', showLoadError, { once: true });
    } else {
      script = document.createElement('script');
      script.src = GOOGLE_IDENTITY_SCRIPT;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', renderGoogleButton, { once: true });
      script.addEventListener('error', showLoadError, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      active = false;
      script?.removeEventListener('load', renderGoogleButton);
      script?.removeEventListener('error', showLoadError);
      buttonContainer.current?.replaceChildren();
    };
  }, []);

  return (
    <div className="google-signin">
      <div className="auth-divider"><span>or</span></div>
      {GOOGLE_CLIENT_ID ? (
        <div
          ref={buttonContainer}
          className={`google-signin-button${disabled ? ' is-disabled' : ''}`}
          aria-disabled={disabled}
        />
      ) : (
        <button className="google-signin-placeholder" type="button" disabled>
          <span aria-hidden="true">G</span>
          Continue with Google
        </button>
      )}
      {!GOOGLE_CLIENT_ID && (
        <small className="field-hint">
          Add GOOGLE_CLIENT_ID to the repository-root .env to enable Google sign-in.
        </small>
      )}
      {scriptError && <p className="alert alert-error" role="alert">{scriptError}</p>}
    </div>
  );
}

function PasswordField({ id, label, hint, ...inputProps }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrap">
        <input
          id={id}
          className="input password-input"
          type={isVisible ? 'text' : 'password'}
          aria-describedby={hint ? `${id}-hint` : undefined}
          {...inputProps}
        />
        <button
          className="password-toggle"
          type="button"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          aria-controls={id}
          onClick={() => setIsVisible((visible) => !visible)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            {isVisible ? (
              <path d="m3 3 18 18" />
            ) : (
              <circle cx="12" cy="12" r="3" />
            )}
          </svg>
        </button>
      </div>
      {hint && <small className="field-hint" id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}

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
  const { user, login, googleLogin } = useAuth();
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

  async function handleGoogleCredential(credential) {
    setError('');
    setIsSubmitting(true);
    try {
      await googleLogin(credential);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'We could not sign you in with Google. Please try again.');
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
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
        <GoogleSignInButton onCredential={handleGoogleCredential} disabled={isSubmitting} />
      </form>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const { user, register, googleLogin } = useAuth();
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

  async function handleGoogleCredential(credential) {
    setError('');
    setIsSubmitting(true);
    try {
      await googleLogin(credential);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'We could not create your account with Google. Please try again.');
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
        <PasswordField
          id="register-password"
          name="password"
          label="Password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          hint="Use 8+ characters; avoid common passwords, names, and all-numeric passwords."
          required
          value={form.password}
          onChange={updateField}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
        <GoogleSignInButton onCredential={handleGoogleCredential} disabled={isSubmitting} />
      </form>
    </AuthFrame>
  );
}
