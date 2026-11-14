import { useEffect, useId, useMemo, useState } from 'react';
import { exchangesApi, formatApiError, reviewsApi } from '../api/client.js';
import { Alert, Badge, Button, Modal, TextField, TextareaField } from './UI.jsx';

/**
 * Format timestamp nicely with timezone awareness
 * @param {string | null | undefined} dateString
 * @returns {string}
 */
export function formatScheduledTime(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format relative or short date
 * @param {string} dateString
 * @returns {string}
 */
export function formatExchangeDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Determines exact allowed transitions based on backend service rules and participant role
 *
 * Backend transition matrix from services.exchanges.transition_exchange_request:
 * - PENDING -> ACCEPTED (only owner)
 * - PENDING -> DECLINED (only owner)
 * - PENDING -> CANCELLED (only learner)
 * - ACCEPTED -> COMPLETED (only owner)
 * - ACCEPTED -> CANCELLED (learner or owner)
 * - DECLINED, CANCELLED, COMPLETED: terminal (no transitions)
 *
 * @param {import('../api/client.js').Exchange} exchange
 * @param {number} currentUserId
 * @returns {Array<{ status: import('../api/client.js').ExchangeStatus, label: string, variant: 'primary' | 'secondary' | 'danger', description: string, requiresConfirm: boolean }>}
 */
export function getAvailableExchangeActions(exchange, currentUserId) {
  if (!exchange || !currentUserId) return [];

  const isLearner = exchange.learner_id === currentUserId;
  const isOwner = exchange.owner_id === currentUserId;

  if (!isLearner && !isOwner) return [];

  const actions = [];

  if (exchange.status === 'PENDING') {
    if (isOwner) {
      actions.push({
        status: 'ACCEPTED',
        label: 'Accept request',
        variant: 'primary',
        description: 'Accept this exchange and proceed with scheduling or coordinating the skill session.',
        requiresConfirm: false,
      });
      actions.push({
        status: 'DECLINED',
        label: 'Decline request',
        variant: 'danger',
        description: 'Decline this exchange request. This action is final and cannot be undone.',
        requiresConfirm: true,
      });
    } else if (isLearner) {
      actions.push({
        status: 'CANCELLED',
        label: 'Cancel request',
        variant: 'danger',
        description: 'Withdraw this exchange request before the teacher accepts it.',
        requiresConfirm: true,
      });
    }
  } else if (exchange.status === 'ACCEPTED') {
    if (isOwner) {
      actions.push({
        status: 'COMPLETED',
        label: 'Mark completed',
        variant: 'primary',
        description: 'Confirm that the exchange session has concluded successfully. This unlocks review submissions for both participants.',
        requiresConfirm: true,
      });
      actions.push({
        status: 'CANCELLED',
        label: 'Cancel exchange',
        variant: 'danger',
        description: 'Cancel this accepted exchange session.',
        requiresConfirm: true,
      });
    } else if (isLearner) {
      actions.push({
        status: 'CANCELLED',
        label: 'Cancel exchange',
        variant: 'danger',
        description: 'Cancel this accepted exchange session.',
        requiresConfirm: true,
      });
    }
  }

  return actions;
}

/**
 * Status badge with distinctive semantic styling
 */
export function ExchangeStatusBadge({ status }) {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="pending" className="badge-status-pending">
          <span className="badge-glyph" aria-hidden="true">⏳</span>
          Pending
        </Badge>
      );
    case 'ACCEPTED':
      return (
        <Badge variant="accepted" className="badge-status-accepted">
          <span className="badge-glyph" aria-hidden="true">✓</span>
          Accepted
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="completed" className="badge-status-completed">
          <span className="badge-glyph" aria-hidden="true">★</span>
          Completed
        </Badge>
      );
    case 'DECLINED':
      return (
        <Badge variant="declined" className="badge-status-declined">
          <span className="badge-glyph" aria-hidden="true">✕</span>
          Declined
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="cancelled" className="badge-status-cancelled">
          <span className="badge-glyph" aria-hidden="true">⊘</span>
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

/**
 * Modal to request an exchange on a skill listing
 */
export function ExchangeRequestModal({
  isOpen,
  onClose,
  listing,
  token,
  currentUserId,
  onSuccess,
}) {
  const [includeSchedule, setIncludeSchedule] = useState(false);
  const [localDateTime, setLocalDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const scheduleInputId = useId();
  const checkboxId = useId();

  // Detect local timezone name for transparency
  const userTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    } catch {
      return 'Local';
    }
  }, []);

  // Compute minimum date-time string (now formatted as YYYY-MM-DDTHH:mm)
  const minDateTime = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIncludeSchedule(false);
      setLocalDateTime('');
      setIsSubmitting(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !listing) return null;

  const isSelf = currentUserId && listing.owner_id === currentUserId;
  const isNotOffer = listing.direction !== 'OFFER';
  const isInactive = !listing.is_active;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (isSelf) {
      setError('You cannot request an exchange with yourself.');
      return;
    }
    if (isNotOffer) {
      setError('Exchange requests can only be initiated on skills offered for teaching.');
      return;
    }
    if (isInactive) {
      setError('This skill listing is currently inactive.');
      return;
    }

    let scheduled_at = null;
    if (includeSchedule) {
      if (!localDateTime) {
        setError('Please select a date and time, or uncheck proposed schedule.');
        return;
      }
      const parsedDate = new Date(localDateTime);
      if (Number.isNaN(parsedDate.getTime())) {
        setError('Please enter a valid date and time.');
        return;
      }
      // Convert to UTC ISO string with "Z" timezone specifier (guaranteed timezone-aware)
      scheduled_at = parsedDate.toISOString();
    }

    setIsSubmitting(true);
    try {
      const created = await exchangesApi.create(token, {
        listing_id: listing.id,
        scheduled_at,
      });
      onSuccess?.(created);
      onClose();
    } catch (err) {
      setError(formatApiError(err.detail) || err.message || 'Failed to submit exchange request.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Skill Exchange"
      className="exchange-request-modal"
    >
      <form onSubmit={handleSubmit} className="exchange-modal-form">
        <div className="exchange-target-summary">
          <p className="eyebrow">Skill to learn</p>
          <div className="exchange-target-header">
            <h3>{listing.skill?.name || 'Untitled Skill'}</h3>
            {listing.skill?.category && (
              <Badge variant="category">{listing.skill.category}</Badge>
            )}
          </div>
          <p className="exchange-target-owner">
            Offered by <strong>Member #{listing.owner_id}</strong>
          </p>
          {listing.description && (
            <p className="exchange-target-description">{listing.description}</p>
          )}
        </div>

        {isSelf && (
          <Alert variant="error">
            You cannot request an exchange with yourself because you own this listing.
          </Alert>
        )}

        {isNotOffer && (
          <Alert variant="error">
            This listing is seeking a teacher rather than offering one. Exchanges must be requested from an offered skill.
          </Alert>
        )}

        {isInactive && (
          <Alert variant="error">
            This skill listing is currently deactivated by the teacher.
          </Alert>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        <fieldset className="exchange-schedule-fieldset">
          <legend className="exchange-schedule-legend">Scheduling (optional)</legend>
          <div className="checkbox-row">
            <input
              type="checkbox"
              id={checkboxId}
              checked={includeSchedule}
              onChange={(e) => setIncludeSchedule(e.target.checked)}
              className="checkbox-input"
            />
            <label htmlFor={checkboxId} className="checkbox-label">
              Propose an initial session date and time
            </label>
          </div>

          {includeSchedule && (
            <div className="schedule-input-container">
              <label htmlFor={scheduleInputId} className="field-label">
                Proposed session time ({userTimezone} timezone)
              </label>
              <input
                id={scheduleInputId}
                type="datetime-local"
                min={minDateTime}
                value={localDateTime}
                onChange={(e) => setLocalDateTime(e.target.value)}
                className="input datetime-input"
                required={includeSchedule}
              />
              <p className="field-hint">
                Timestamp will be sent with your timezone offset (<code>{userTimezone}</code>) to satisfy backend scheduling requirements.
              </p>
            </div>
          )}
        </fieldset>

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || isSelf || isNotOffer || isInactive}
          >
            {isSubmitting ? 'Sending request…' : 'Send exchange request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Confirmation dialog for irreversible lifecycle transitions
 */
export function ExchangeConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  exchange,
  isLoading,
  error,
}) {
  if (!isOpen || !action) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={action.label}
      className="exchange-confirm-modal"
    >
      <div className="confirm-modal-body">
        <p className="confirm-modal-desc">{action.description}</p>
        <div className="confirm-modal-meta">
          <p>
            <strong>Exchange #{exchange?.id}</strong>: {exchange?.listing?.skill?.name || 'Skill Exchange'}
          </p>
          <p className="field-hint">
            Current status: <code>{exchange?.status}</code> → Target status: <code>{action.status}</code>
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={action.variant === 'danger' ? 'quiet' : action.variant}
            className={action.variant === 'danger' ? 'button-danger' : ''}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Updating…' : `Confirm: ${action.label}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Accessible Star Rating Input (1–5)
 */
export function StarRatingInput({ value, onChange, disabled = false, id }) {
  const ratingLabels = [
    '',
    '1 star — Needs improvement',
    '2 stars — Fair',
    '3 stars — Good',
    '4 stars — Very good',
    '5 stars — Excellent',
  ];

  return (
    <div className="star-rating-control" role="group" aria-labelledby={id}>
      <span id={id} className="star-rating-label">
        Rating (1 to 5 stars) <span aria-hidden="true">*</span>
      </span>
      <div className="star-buttons-row">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= value;
          return (
            <button
              key={star}
              type="button"
              className={`star-button ${isFilled ? 'is-filled' : ''}`}
              onClick={() => onChange(star)}
              disabled={disabled}
              aria-label={ratingLabels[star]}
              aria-pressed={value === star}
            >
              <span aria-hidden="true">{isFilled ? '★' : '☆'}</span>
            </button>
          );
        })}
        {value > 0 && (
          <span className="star-selected-text" aria-live="polite">
            {ratingLabels[value]}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Review Submission Form Modal for Completed Exchanges
 */
export function ReviewFormModal({
  isOpen,
  onClose,
  exchange,
  token,
  currentUserId,
  onSuccess,
}) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const ratingId = useId();
  const feedbackId = useId();

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setFeedback('');
      setIsSubmitting(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !exchange) return null;

  // Reviewee is strictly the counterpart participant
  const revieweeId = exchange.learner_id === currentUserId
    ? exchange.owner_id
    : exchange.learner_id;

  const roleAsReviewer = exchange.learner_id === currentUserId ? 'Learner' : 'Teacher';
  const roleAsReviewee = exchange.learner_id === currentUserId ? 'Teacher' : 'Learner';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (rating < 1 || rating > 5) {
      setError('Please choose a rating between 1 and 5 stars.');
      return;
    }

    setIsSubmitting(true);
    try {
      const review = await reviewsApi.create(token, {
        exchange_id: exchange.id,
        reviewee_id: revieweeId,
        rating,
        feedback: feedback.trim(),
      });
      onSuccess?.(review);
      onClose();
    } catch (err) {
      setError(
        formatApiError(err.detail) ||
        err.message ||
        'Could not submit review. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Skill Exchange"
      className="review-form-modal"
    >
      <form onSubmit={handleSubmit} className="review-modal-form">
        <div className="review-target-header">
          <p className="eyebrow">Completed exchange #{exchange.id}</p>
          <h3>{exchange.listing?.skill?.name || 'Skill Exchange'}</h3>
          <p className="review-counterpart-note">
            Reviewing <strong>Member #{revieweeId}</strong> ({roleAsReviewee}) from your perspective as the {roleAsReviewer}.
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <StarRatingInput
          id={ratingId}
          value={rating}
          onChange={setRating}
          disabled={isSubmitting}
        />

        <div className="field">
          <label htmlFor={feedbackId}>Written feedback (optional)</label>
          <textarea
            id={feedbackId}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            maxLength={2000}
            rows={4}
            className="input textarea-input"
            placeholder="Share how the lesson went, what was helpful, and suggestions for future sessions…"
            disabled={isSubmitting}
          />
          <small className="field-hint">
            {feedback.length} / 2000 characters
          </small>
        </div>

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting review…' : 'Submit review'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Reviews section displayed within a completed exchange card
 */
export function ExchangeReviewSection({
  exchange,
  token,
  currentUserId,
  onOpenReviewModal,
  refreshTrigger,
}) {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || exchange.status !== 'COMPLETED') return;

    let active = true;
    setIsLoading(true);
    setError('');

    reviewsApi
      .list(token, { exchange_id: exchange.id })
      .then((data) => {
        if (active) setReviews(data.items || []);
      })
      .catch((err) => {
        if (active) {
          setError(formatApiError(err.detail) || 'Could not load reviews.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, exchange.id, exchange.status, refreshTrigger]);

  const hasUserReviewed = useMemo(() => {
    return reviews.some((r) => r.reviewer_id === currentUserId);
  }, [reviews, currentUserId]);

  const userReview = useMemo(() => {
    return reviews.find((r) => r.reviewer_id === currentUserId);
  }, [reviews, currentUserId]);

  const counterpartReview = useMemo(() => {
    return reviews.find((r) => r.reviewer_id !== currentUserId);
  }, [reviews, currentUserId]);

  if (exchange.status !== 'COMPLETED') return null;

  return (
    <div className="exchange-reviews-container">
      <div className="exchange-reviews-header">
        <h4 className="reviews-section-title">
          <span aria-hidden="true">★</span> Exchange Reviews
        </h4>
        {!hasUserReviewed && (
          <Button
            variant="secondary"
            className="button-sm"
            onClick={onOpenReviewModal}
          >
            + Leave a review
          </Button>
        )}
      </div>

      {isLoading && <p className="field-hint">Loading reviews…</p>}
      {error && <Alert variant="error">{error}</Alert>}

      {reviews.length === 0 && !isLoading && !error && (
        <div className="no-reviews-box">
          <p className="no-reviews-text">
            No reviews submitted yet for this completed exchange.
          </p>
          {!hasUserReviewed && (
            <p className="field-hint">
              Be the first to share your experience with Member #{exchange.learner_id === currentUserId ? exchange.owner_id : exchange.learner_id}.
            </p>
          )}
        </div>
      )}

      {reviews.length > 0 && (
        <div className="reviews-list">
          {userReview && (
            <article className="review-card user-review-card">
              <header className="review-card-header">
                <span className="review-author">
                  Your review
                  <Badge variant="owner" className="review-self-badge">Submitted by you</Badge>
                </span>
                <span className="review-rating" aria-label={`${userReview.rating} out of 5 stars`}>
                  {'★'.repeat(userReview.rating)}{'☆'.repeat(5 - userReview.rating)}
                </span>
              </header>
              {userReview.feedback && (
                <p className="review-feedback">"{userReview.feedback}"</p>
              )}
              <footer className="review-card-footer">
                <span className="review-date">{formatExchangeDate(userReview.created_at)}</span>
              </footer>
            </article>
          )}

          {counterpartReview && (
            <article className="review-card counterpart-review-card">
              <header className="review-card-header">
                <span className="review-author">
                  {counterpartReview.reviewer?.first_name
                    ? `${counterpartReview.reviewer.first_name} ${counterpartReview.reviewer.last_name}`
                    : `Member #${counterpartReview.reviewer_id}`}
                  <span className="review-role-note">
                    ({counterpartReview.reviewer_id === exchange.learner_id ? 'Learner' : 'Teacher'})
                  </span>
                </span>
                <span className="review-rating" aria-label={`${counterpartReview.rating} out of 5 stars`}>
                  {'★'.repeat(counterpartReview.rating)}{'☆'.repeat(5 - counterpartReview.rating)}
                </span>
              </header>
              {counterpartReview.feedback && (
                <p className="review-feedback">"{counterpartReview.feedback}"</p>
              )}
              <footer className="review-card-footer">
                <span className="review-date">{formatExchangeDate(counterpartReview.created_at)}</span>
              </footer>
            </article>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Exchange Card Item Component
 */
export function ExchangeCard({
  exchange,
  currentUserId,
  onTransition,
  isTransitioning = false,
  transitionError = '',
  onReviewSubmitted,
  token,
}) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);

  const isLearner = exchange.learner_id === currentUserId;
  const isOwner = exchange.owner_id === currentUserId;

  const availableActions = useMemo(() => {
    return getAvailableExchangeActions(exchange, currentUserId);
  }, [exchange, currentUserId]);

  function handleActionClick(action) {
    if (action.requiresConfirm) {
      setConfirmAction(action);
    } else {
      onTransition(exchange.id, action.status);
    }
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    const targetStatus = confirmAction.status;
    const success = await onTransition(exchange.id, targetStatus);
    if (success) {
      setConfirmAction(null);
    }
  }

  function handleReviewSuccess(review) {
    setReviewRefreshTrigger((prev) => prev + 1);
    onReviewSubmitted?.(exchange.id, review);
  }

  return (
    <article className={`exchange-card exchange-card-${exchange.status.toLowerCase()}`}>
      <header className="exchange-card-header">
        <div className="exchange-status-group">
          <ExchangeStatusBadge status={exchange.status} />
          {isLearner && (
            <span className="exchange-role-tag learner">You are the Learner</span>
          )}
          {isOwner && (
            <span className="exchange-role-tag owner">You are the Teacher</span>
          )}
        </div>
        <div className="exchange-meta-date">
          Requested {formatExchangeDate(exchange.created_at)}
        </div>
      </header>

      <div className="exchange-card-body">
        <div className="exchange-skill-info">
          <h3 className="exchange-skill-name">
            {exchange.listing?.skill?.name || 'Skill Exchange'}
          </h3>
          <div className="exchange-listing-tags">
            {exchange.listing?.skill?.category && (
              <Badge variant="category">{exchange.listing.skill.category}</Badge>
            )}
            <Badge variant="neutral">Exchange #{exchange.id}</Badge>
            {exchange.listing?.id && (
              <Badge variant="neutral">Listing #{exchange.listing.id}</Badge>
            )}
          </div>
        </div>

        <div className="exchange-participants-grid">
          <div className={`participant-box ${isLearner ? 'participant-is-you' : ''}`}>
            <span className="participant-role">Learner</span>
            <span className="participant-id">
              Member #{exchange.learner_id}
              {isLearner && <span className="you-indicator"> (You)</span>}
            </span>
          </div>

          <div className="participant-arrow" aria-hidden="true">⇄</div>

          <div className={`participant-box ${isOwner ? 'participant-is-you' : ''}`}>
            <span className="participant-role">Teacher / Owner</span>
            <span className="participant-id">
              Member #{exchange.owner_id}
              {isOwner && <span className="you-indicator"> (You)</span>}
            </span>
          </div>
        </div>

        <div className="exchange-schedule-box">
          <span className="schedule-icon" aria-hidden="true">📅</span>
          <div className="schedule-content">
            <span className="schedule-label">Scheduled session:</span>
            {exchange.scheduled_at ? (
              <span className="schedule-value" title={exchange.scheduled_at}>
                {formatScheduledTime(exchange.scheduled_at)}
              </span>
            ) : (
              <span className="schedule-none">Flexible (No specific date set)</span>
            )}
          </div>
        </div>

        {exchange.listing?.description && (
          <p className="exchange-listing-desc-snippet">
            "{exchange.listing.description}"
          </p>
        )}

        {transitionError && (
          <Alert variant="error" className="exchange-error-banner">
            {transitionError}
          </Alert>
        )}
      </div>

      <footer className="exchange-card-footer">
        <div className="exchange-actions">
          {availableActions.map((action) => (
            <Button
              key={action.status}
              variant={action.variant === 'danger' ? 'quiet' : action.variant}
              className={`button-sm ${action.variant === 'danger' ? 'button-danger' : ''}`}
              onClick={() => handleActionClick(action)}
              disabled={isTransitioning}
            >
              {action.label}
            </Button>
          ))}

          {exchange.status === 'COMPLETED' && (
            <Button
              variant="secondary"
              className="button-sm"
              onClick={() => setIsReviewModalOpen(true)}
            >
              ★ Review exchange
            </Button>
          )}
        </div>
      </footer>

      {exchange.status === 'COMPLETED' && (
        <ExchangeReviewSection
          exchange={exchange}
          token={token}
          currentUserId={currentUserId}
          onOpenReviewModal={() => setIsReviewModalOpen(true)}
          refreshTrigger={reviewRefreshTrigger}
        />
      )}

      {/* Confirmation modal for state transitions */}
      <ExchangeConfirmModal
        isOpen={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        action={confirmAction}
        exchange={exchange}
        isLoading={isTransitioning}
        error={transitionError}
      />

      {/* Review submission modal */}
      <ReviewFormModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        exchange={exchange}
        token={token}
        currentUserId={currentUserId}
        onSuccess={handleReviewSuccess}
      />
    </article>
  );
}

