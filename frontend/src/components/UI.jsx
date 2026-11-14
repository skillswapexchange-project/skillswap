import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function Button({ as: Element = 'button', children, className = '', variant = 'primary', ...props }) {
  return (
    <Element className={`button button-${variant} ${className}`.trim()} {...props}>
      {children}
    </Element>
  );
}

export function TextField({
  id,
  label,
  hint,
  as: Element = 'input',
  className = '',
  ...props
}) {
  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      <Element
        id={id}
        className="input"
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...props}
      />
      {hint && (
        <small className="field-hint" id={`${id}-hint`}>
          {hint}
        </small>
      )}
    </div>
  );
}

export function SelectField({
  id,
  label,
  hint,
  children,
  className = '',
  ...props
}) {
  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className="input select-input"
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...props}
      >
        {children}
      </select>
      {hint && (
        <small className="field-hint" id={`${id}-hint`}>
          {hint}
        </small>
      )}
    </div>
  );
}

export function TextareaField({
  id,
  label,
  hint,
  className = '',
  ...props
}) {
  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        className="input textarea-input"
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...props}
      />
      {hint && (
        <small className="field-hint" id={`${id}-hint`}>
          {hint}
        </small>
      )}
    </div>
  );
}

export function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      {children}
    </span>
  );
}

export function Modal({ isOpen, onClose, title, children, className = '' }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`modal-dialog ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Alert({ children, variant = 'error', ...props }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${variant}`} role="alert" {...props}>
      {children}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-mark" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Brand({ className = '' }) {
  return (
    <Link className={`brand ${className}`.trim()} to="/" aria-label="SkillSwap home">
      <span className="brand-mark" aria-hidden="true">s</span>
      <span>skillswap</span>
    </Link>
  );
}

export function Avatar({ user, size = 'normal' }) {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
  const initials = name
    ? name
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'S';

  return user?.profile_image ? (
    <img className={`avatar avatar-${size}`} src={user.profile_image} alt={name || 'Profile'} />
  ) : (
    <span className={`avatar avatar-${size} avatar-fallback`} aria-label={name || 'Profile'}>
      {initials}
    </span>
  );
}
