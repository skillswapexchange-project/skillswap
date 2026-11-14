import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { exchangesApi, formatApiError } from '../api/client.js';
import {
  Alert,
  Badge,
  Button,
  LoadingState,
  PageHeader,
  SelectField,
} from '../components/UI.jsx';
import { PaginationControl } from '../components/ListingComponents.jsx';
import {
  ExchangeCard,
} from '../components/ExchangeComponents.jsx';

export function ExchangesPage() {
  const { user, token } = useAuth();

  // Exchange items from backend
  const [exchanges, setExchanges] = useState([]);
  const [totalExchanges, setTotalExchanges] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');

  // Status and Role Filters
  const [statusTab, setStatusTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'ARCHIVED'
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'LEARNER' | 'OWNER'

  // Pagination
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(20);

  // Transition state tracking per exchange ID
  const [transitioningIds, setTransitioningIds] = useState(new Set());
  const [transitionErrors, setTransitionErrors] = useState({});

  // Fetch exchanges from backend API
  const fetchExchanges = useCallback(() => {
    if (!token) return;

    const controller = new AbortController();
    setIsLoading(true);
    setLoadError('');

    exchangesApi
      .list(token, { limit, offset }, { signal: controller.signal })
      .then((data) => {
        setExchanges(data.items || []);
        setTotalExchanges(data.total || 0);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setLoadError(
            formatApiError(err.detail) ||
            err.message ||
            'Could not load your exchanges. Please try again.'
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [token, limit, offset]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  // Handle lifecycle status transition (PATCH /api/v1/exchanges/{id}/status)
  async function handleTransition(exchangeId, newStatus) {
    if (!token) return false;

    // Mark specific exchange as transitioning
    setTransitioningIds((prev) => new Set(prev).add(exchangeId));
    setTransitionErrors((prev) => {
      const next = { ...prev };
      delete next[exchangeId];
      return next;
    });
    setNotice('');

    try {
      const updated = await exchangesApi.updateStatus(token, exchangeId, newStatus);
      // Update local state smoothly
      setExchanges((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setNotice(`Exchange #${exchangeId} updated to ${updated.status}.`);
      return true;
    } catch (err) {
      const errorMsg =
        formatApiError(err.detail) ||
        err.message ||
        `Could not transition exchange to ${newStatus}.`;
      setTransitionErrors((prev) => ({
        ...prev,
        [exchangeId]: errorMsg,
      }));
      return false;
    } finally {
      setTransitioningIds((prev) => {
        const next = new Set(prev);
        next.delete(exchangeId);
        return next;
      });
    }
  }

  // Filter items in the view
  const filteredExchanges = useMemo(() => {
    return exchanges.filter((item) => {
      // Role filter
      if (roleFilter === 'LEARNER' && item.learner_id !== user?.id) {
        return false;
      }
      if (roleFilter === 'OWNER' && item.owner_id !== user?.id) {
        return false;
      }

      // Status tab filter
      if (statusTab === 'ALL') return true;
      if (statusTab === 'PENDING') return item.status === 'PENDING';
      if (statusTab === 'ACCEPTED') return item.status === 'ACCEPTED';
      if (statusTab === 'COMPLETED') return item.status === 'COMPLETED';
      if (statusTab === 'ARCHIVED') {
        return item.status === 'DECLINED' || item.status === 'CANCELLED';
      }
      return true;
    });
  }, [exchanges, statusTab, roleFilter, user?.id]);

  // Summary counts for tabs
  const counts = useMemo(() => {
    return {
      all: exchanges.length,
      pending: exchanges.filter((e) => e.status === 'PENDING').length,
      accepted: exchanges.filter((e) => e.status === 'ACCEPTED').length,
      completed: exchanges.filter((e) => e.status === 'COMPLETED').length,
      archived: exchanges.filter((e) => e.status === 'DECLINED' || e.status === 'CANCELLED').length,
    };
  }, [exchanges]);

  return (
    <div className="exchanges-page-container">
      <PageHeader
        eyebrow="Exchange management"
        title="Your Skill Exchanges"
        description="Track session requests, coordinate accepted lessons, confirm completions, and exchange verified reviews."
        action={
          <Link to="/skills" className="button button-primary">
            Explore skill directory →
          </Link>
        }
      />

      {notice && (
        <Alert variant="success" onDismiss={() => setNotice('')}>
          {notice}
        </Alert>
      )}

      {loadError && (
        <div className="exchanges-load-error">
          <Alert variant="error">{loadError}</Alert>
          <Button variant="secondary" onClick={fetchExchanges} className="button-sm">
            Retry loading exchanges
          </Button>
        </div>
      )}

      {/* FILTER BAR & TABS */}
      <section className="exchange-controls-bar" aria-label="Exchange filters">
        <div className="tab-buttons" role="tablist" aria-label="Filter exchanges by status">
          <button
            type="button"
            role="tab"
            aria-selected={statusTab === 'ALL'}
            className={`tab-button ${statusTab === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setStatusTab('ALL')}
          >
            All Exchanges
            {counts.all > 0 && <span className="tab-count">{counts.all}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusTab === 'PENDING'}
            className={`tab-button ${statusTab === 'PENDING' ? 'is-active' : ''}`}
            onClick={() => setStatusTab('PENDING')}
          >
            Pending
            {counts.pending > 0 && (
              <span className="tab-count tab-count-highlight">{counts.pending}</span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusTab === 'ACCEPTED'}
            className={`tab-button ${statusTab === 'ACCEPTED' ? 'is-active' : ''}`}
            onClick={() => setStatusTab('ACCEPTED')}
          >
            Accepted
            {counts.accepted > 0 && <span className="tab-count">{counts.accepted}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusTab === 'COMPLETED'}
            className={`tab-button ${statusTab === 'COMPLETED' ? 'is-active' : ''}`}
            onClick={() => setStatusTab('COMPLETED')}
          >
            Completed
            {counts.completed > 0 && <span className="tab-count">{counts.completed}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusTab === 'ARCHIVED'}
            className={`tab-button ${statusTab === 'ARCHIVED' ? 'is-active' : ''}`}
            onClick={() => setStatusTab('ARCHIVED')}
          >
            Declined / Cancelled
            {counts.archived > 0 && <span className="tab-count">{counts.archived}</span>}
          </button>
        </div>

        <div className="exchange-role-filter">
          <label htmlFor="role-select" className="role-filter-label">
            My role:
          </label>
          <select
            id="role-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input select-input role-select-input"
          >
            <option value="ALL">All roles</option>
            <option value="LEARNER">As Learner</option>
            <option value="OWNER">As Teacher (Owner)</option>
          </select>
        </div>
      </section>

      {/* CONTENT LIST */}
      {isLoading ? (
        <div className="exchanges-loading-wrapper">
          <LoadingState label="Loading your exchanges…" />
        </div>
      ) : exchanges.length === 0 ? (
        <section className="empty-panel">
          <span className="empty-number">01</span>
          <div>
            <h2>No exchanges to show yet.</h2>
            <p>
              When you request to learn a skill or another member requests a lesson from your offered listing, your requests and their statuses will appear here.
            </p>
            <div className="empty-actions">
              <Link className="button button-primary" to="/skills">
                Explore skills to learn <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      ) : filteredExchanges.length === 0 ? (
        <div className="empty-filter-state">
          <p>No exchanges matching the selected status or role filters.</p>
          <Button
            variant="secondary"
            className="button-sm"
            onClick={() => {
              setStatusTab('ALL');
              setRoleFilter('ALL');
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="exchanges-list" role="feed" aria-label="Skill exchange list">
          {filteredExchanges.map((exchange) => (
            <ExchangeCard
              key={exchange.id}
              exchange={exchange}
              currentUserId={user?.id}
              token={token}
              onTransition={handleTransition}
              isTransitioning={transitioningIds.has(exchange.id)}
              transitionError={transitionErrors[exchange.id] || ''}
              onReviewSubmitted={() => {
                setNotice(`Your review for Exchange #${exchange.id} has been recorded.`);
              }}
            />
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {totalExchanges > limit && (
        <PaginationControl
          offset={offset}
          limit={limit}
          total={totalExchanges}
          onPageChange={setOffset}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setOffset(0);
          }}
        />
      )}
    </div>
  );
}

