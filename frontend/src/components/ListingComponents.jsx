import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Modal, SelectField, TextareaField } from './UI.jsx';

/**
 * Format ISO datetime string nicely
 * @param {string} dateString
 * @returns {string}
 */
export function formatListingDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
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
 * Single Listing Card Component
 */
export function ListingCard({
  listing,
  currentUserId,
  onEdit,
  onDelete,
  onRequestExchange,
}) {
  const isOwner = currentUserId && listing.owner_id === currentUserId;
  const isOffer = listing.direction === 'OFFER';

  return (
    <article
      className={`listing-card ${isOffer ? 'listing-card-offer' : 'listing-card-learn'}`}
      aria-labelledby={`listing-title-${listing.id}`}
    >
      <header className="listing-card-header">
        <div className="listing-badges">
          <Badge variant={isOffer ? 'offer' : 'learn'}>
            <span className="badge-glyph" aria-hidden="true">
              {isOffer ? '↑' : '↓'}
            </span>
            <span>{isOffer ? 'Offering to teach' : 'Seeking to learn'}</span>
          </Badge>
          {listing.skill?.category && (
            <Badge variant="category">{listing.skill.category}</Badge>
          )}
          {isOwner && <Badge variant="owner">Your listing</Badge>}
          {!listing.is_active && <Badge variant="inactive">Inactive</Badge>}
        </div>
        <div className="listing-date">
          {formatListingDate(listing.created_at)}
        </div>
      </header>

      <div className="listing-card-body">
        <h3 id={`listing-title-${listing.id}`} className="listing-title">
          {listing.skill?.name || 'Untitled Skill'}
        </h3>
        {listing.description ? (
          <p className="listing-description">{listing.description}</p>
        ) : listing.skill?.description ? (
          <p className="listing-description listing-skill-fallback">
            {listing.skill.description}
          </p>
        ) : (
          <p className="listing-description listing-empty-description">
            No additional details provided.
          </p>
        )}
      </div>

      <footer className="listing-card-footer">
        <div className="listing-meta">
          <span className="member-label">
            {isOwner ? 'Created by you' : `Member #${listing.owner_id}`}
          </span>
        </div>

        <div className="listing-actions">
          {isOwner ? (
            <>
              <Button
                variant="secondary"
                className="button-sm"
                onClick={() => onEdit(listing)}
                aria-label={`Edit listing for ${listing.skill?.name}`}
              >
                Edit
              </Button>
              <Button
                variant="quiet"
                className="button-sm button-danger"
                onClick={() => onDelete(listing)}
                aria-label={`Delete listing for ${listing.skill?.name}`}
              >
                Delete
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              className="button-sm"
              onClick={() => onRequestExchange?.(listing)}
            >
              {isOffer ? 'Request lesson' : 'Offer to teach'}
            </Button>
          )}
        </div>
      </footer>
    </article>
  );
}

/**
 * Modal form for creating and editing listings
 */
export function ListingFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  skills = [],
  isLoading = false,
  apiError = '',
}) {
  const isEditing = Boolean(initialData?.id);
  const [skillSlug, setSkillSlug] = useState('');
  const [direction, setDirection] = useState('OFFER');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (initialData) {
      setSkillSlug(initialData.skill?.slug || initialData.skill_slug || '');
      setDirection(initialData.direction || 'OFFER');
      setDescription(initialData.description || '');
      setIsActive(initialData.is_active !== undefined ? initialData.is_active : true);
    } else {
      setSkillSlug(skills.length > 0 ? skills[0].slug : '');
      setDirection('OFFER');
      setDescription('');
      setIsActive(true);
    }
    setValidationError('');
  }, [initialData, isOpen, skills]);

  function handleSubmit(event) {
    event.preventDefault();
    setValidationError('');

    if (!skillSlug) {
      setValidationError('Please select a skill for this listing.');
      return;
    }

    if (!direction || (direction !== 'OFFER' && direction !== 'LEARN')) {
      setValidationError('Please select whether you want to teach (OFFER) or learn (LEARN).');
      return;
    }

    if (description.length > 2000) {
      setValidationError('Description cannot exceed 2000 characters.');
      return;
    }

    const payload = {
      skill_slug: skillSlug,
      direction,
      description: description.trim(),
    };

    if (isEditing) {
      payload.is_active = isActive;
    }

    onSubmit(payload);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit your listing' : 'Create a skill listing'}
      className="listing-modal"
    >
      {apiError && <Alert variant="error">{apiError}</Alert>}
      {validationError && <Alert variant="error">{validationError}</Alert>}

      <form onSubmit={handleSubmit} className="listing-form">
        <SelectField
          id="listing-skill"
          label="Select Skill"
          value={skillSlug}
          onChange={(e) => setSkillSlug(e.target.value)}
          required
          hint="Choose from the verified skills catalog."
        >
          {skills.length === 0 ? (
            <option value="">No skills available in catalog</option>
          ) : (
            skills.map((skill) => (
              <option key={skill.slug} value={skill.slug}>
                {skill.name} {skill.category ? `(${skill.category})` : ''}
              </option>
            ))
          )}
        </SelectField>

        <div className="field">
          <label>Listing Direction</label>
          <div className="direction-toggle" role="radiogroup" aria-label="Listing Direction">
            <button
              type="button"
              role="radio"
              aria-checked={direction === 'OFFER'}
              className={`direction-pill direction-pill-offer ${direction === 'OFFER' ? 'is-selected' : ''}`}
              onClick={() => setDirection('OFFER')}
            >
              <span className="pill-glyph">↑</span>
              <span className="pill-text">
                <strong>OFFER</strong>
                <small>I want to teach this skill</small>
              </span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={direction === 'LEARN'}
              className={`direction-pill direction-pill-learn ${direction === 'LEARN' ? 'is-selected' : ''}`}
              onClick={() => setDirection('LEARN')}
            >
              <span className="pill-glyph">↓</span>
              <span className="pill-text">
                <strong>LEARN</strong>
                <small>I want to learn this skill</small>
              </span>
            </button>
          </div>
          <small className="field-hint">
            SkillSwap lets you list as a teacher, a learner, or both for different skills.
          </small>
        </div>

        <TextareaField
          id="listing-description"
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Describe your experience level, goals, preferred exchange format, or schedule availability…"
          hint={`${description.length} / 2000 characters`}
        />

        {isEditing && (
          <div className="field active-toggle-field">
            <label className="checkbox-label" htmlFor="listing-is-active">
              <input
                id="listing-is-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span>Listing is active and discoverable on the marketplace</span>
            </label>
            <small className="field-hint">
              Deactivating hides this listing from public searches.
            </small>
          </div>
        )}

        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || skills.length === 0}
          >
            {isLoading
              ? isEditing
                ? 'Saving changes…'
                : 'Creating listing…'
              : isEditing
                ? 'Save changes'
                : 'Publish listing'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Modal dialog for confirming listing deletion
 */
export function DeleteListingDialog({
  isOpen,
  onClose,
  onConfirm,
  listing,
  isLoading = false,
  apiError = '',
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Listing"
      className="delete-modal"
    >
      {apiError && <Alert variant="error">{apiError}</Alert>}
      <p className="delete-warning-text">
        Are you sure you want to delete your {listing?.direction === 'OFFER' ? 'OFFER' : 'LEARN'} listing for{' '}
        <strong>{listing?.skill?.name || 'this skill'}</strong>?
      </p>
      <p className="field-hint">
        This action cannot be undone. Any ongoing discussions or exchanges will no longer reference this listing.
      </p>
      <div className="modal-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          className="button-danger"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Deleting…' : 'Yes, delete listing'}
        </Button>
      </div>
    </Modal>
  );
}

/**
 * Accessible Pagination Control Component
 */
export function PaginationControl({
  total = 0,
  limit = 20,
  offset = 0,
  onPageChange,
  onLimitChange,
}) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : offset + 1;
  const endItem = Math.min(offset + limit, total);

  if (total === 0) return null;

  return (
    <nav className="pagination-bar" aria-label="Listings pagination">
      <div className="pagination-info">
        Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of{' '}
        <strong>{total}</strong> listings
      </div>

      <div className="pagination-controls">
        <Button
          variant="secondary"
          className="button-sm"
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          disabled={offset === 0}
          aria-label="Previous page"
        >
          ← Previous
        </Button>

        <span className="pagination-pages" aria-current="page">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="secondary"
          className="button-sm"
          onClick={() => onPageChange(offset + limit)}
          disabled={offset + limit >= total}
          aria-label="Next page"
        >
          Next →
        </Button>

        {onLimitChange && (
          <label className="pagination-limit-label">
            <span>Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="pagination-limit-select"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        )}
      </div>
    </nav>
  );
}

