import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { skillsApi, formatApiError } from '../api/client.js';
import {
  Alert,
  Badge,
  Button,
  LoadingState,
  Modal,
  PageHeader,
  SelectField,
  TextField,
} from '../components/UI.jsx';
import {
  DeleteListingDialog,
  ListingCard,
  ListingFormModal,
  PaginationControl,
} from '../components/ListingComponents.jsx';
import { ExchangeRequestModal } from '../components/ExchangeComponents.jsx';

export function SkillsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Active view: 'all' | 'mine' | 'catalog'
  const [activeTab, setActiveTab] = useState('all');

  // Skill catalog state
  const [catalogSkills, setCatalogSkills] = useState([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [skillsError, setSkillsError] = useState('');

  // Listings state
  const [listings, setListings] = useState([]);
  const [totalListings, setTotalListings] = useState(0);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [listingsError, setListingsError] = useState('');
  const [notice, setNotice] = useState('');

  // Track locally created/edited listings for current session
  const [userManagedListings, setUserManagedListings] = useState([]);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState(''); // '' | 'OFFER' | 'LEARN'
  const [categoryFilter, setCategoryFilter] = useState('');
  const [skillSlugFilter, setSkillSlugFilter] = useState('');

  // Pagination state
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(20);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [deletingListing, setDeletingListing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalApiError, setModalApiError] = useState('');

  // Exchange intent dialog
  const [selectedExchangeListing, setSelectedExchangeListing] = useState(null);

  // Debounce search query input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load verified skills catalog
  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingSkills(true);
    setSkillsError('');

    skillsApi
      .listSkills({ limit: 100 }, { signal: controller.signal })
      .then((data) => {
        setCatalogSkills(data.items || []);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setSkillsError(err.message || 'Could not load skills catalog.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingSkills(false);
      });

    return () => controller.abort();
  }, []);

  // Fetch listings from API matching current filters
  const fetchListings = useCallback(() => {
    const controller = new AbortController();
    setIsLoadingListings(true);
    setListingsError('');

    const params = {
      limit,
      offset,
    };
    if (debouncedQuery) params.query = debouncedQuery;
    if (directionFilter) params.direction = directionFilter;
    if (skillSlugFilter) params.skill_slug = skillSlugFilter;

    skillsApi
      .listListings(params, { signal: controller.signal })
      .then((data) => {
        setListings(data.items || []);
        setTotalListings(data.total || 0);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setListingsError(err.message || 'Failed to load skill listings.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingListings(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, directionFilter, skillSlugFilter, limit, offset]);

  useEffect(() => {
    const abort = fetchListings();
    return () => abort();
  }, [fetchListings]);

  // Extract unique categories from catalog
  const categories = useMemo(() => {
    const set = new Set();
    catalogSkills.forEach((skill) => {
      if (skill.category) set.add(skill.category);
    });
    return Array.from(set).sort();
  }, [catalogSkills]);

  // Skills filtered by selected category for the skill dropdown
  const filteredCatalogSkills = useMemo(() => {
    if (!categoryFilter) return catalogSkills;
    return catalogSkills.filter((s) => s.category?.toLowerCase() === categoryFilter.toLowerCase());
  }, [catalogSkills, categoryFilter]);

  // Combined user-owned listings
  const myListings = useMemo(() => {
    if (!user) return [];
    const map = new Map();
    // First add any listings managed during this session
    userManagedListings.forEach((item) => {
      if (item.owner_id === user.id) map.set(item.id, item);
    });
    // Then add any user listings found in the public search results
    listings.forEach((item) => {
      if (item.owner_id === user.id) map.set(item.id, item);
    });
    return Array.from(map.values());
  }, [user, userManagedListings, listings]);

  // Reset all filters
  function handleResetFilters() {
    setSearchQuery('');
    setDebouncedQuery('');
    setDirectionFilter('');
    setCategoryFilter('');
    setSkillSlugFilter('');
    setOffset(0);
  }

  const hasActiveFilters = Boolean(
    searchQuery || directionFilter || categoryFilter || skillSlugFilter
  );

  // Handle open create modal
  function handleOpenCreate() {
    if (!user) {
      navigate('/login');
      return;
    }
    setModalApiError('');
    setIsCreateModalOpen(true);
  }

  // Handle create submission
  async function handleCreateListing(formData) {
    if (!token) return;
    setIsSubmitting(true);
    setModalApiError('');
    setNotice('');

    try {
      const created = await skillsApi.createListing(token, formData);
      setUserManagedListings((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      setIsCreateModalOpen(false);
      setNotice(`Your ${created.direction === 'OFFER' ? 'OFFER' : 'LEARN'} listing for "${created.skill?.name}" has been published.`);
      fetchListings();
    } catch (err) {
      setModalApiError(err.message || 'Could not create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle edit submission
  async function handleUpdateListing(formData) {
    if (!token || !editingListing) return;
    setIsSubmitting(true);
    setModalApiError('');
    setNotice('');

    try {
      const updated = await skillsApi.updateListing(token, editingListing.id, formData);
      setUserManagedListings((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setEditingListing(null);
      setNotice(`Your listing for "${updated.skill?.name}" has been updated.`);
      fetchListings();
    } catch (err) {
      setModalApiError(err.message || 'Could not update listing.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle delete confirmation
  async function handleDeleteListing() {
    if (!token || !deletingListing) return;
    setIsSubmitting(true);
    setModalApiError('');
    setNotice('');

    try {
      await skillsApi.deleteListing(token, deletingListing.id);
      setUserManagedListings((prev) =>
        prev.filter((item) => item.id !== deletingListing.id)
      );
      setListings((prev) => prev.filter((item) => item.id !== deletingListing.id));
      setTotalListings((prev) => Math.max(0, prev - 1));
      setDeletingListing(null);
      setNotice(`Listing for "${deletingListing.skill?.name}" was deleted.`);
      fetchListings();
    } catch (err) {
      setModalApiError(err.message || 'Could not delete listing.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="marketplace-container">
      <PageHeader
        eyebrow="Skill directory & marketplace"
        title="Learn something. Share something."
        description="Discover people teaching skills you want to learn, or offer your own expertise to the community."
        action={
          user ? (
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              aria-haspopup="dialog"
            >
              + Offer or request a skill
            </Button>
          ) : (
            <Link className="button button-primary" to="/login">
              Sign in to list a skill <span aria-hidden="true">→</span>
            </Link>
          )
        }
      />

      {notice && (
        <Alert variant="success" onDismiss={() => setNotice('')}>
          {notice}
        </Alert>
      )}

      {/* View Switcher Tabs */}
      <div className="marketplace-tabs" role="tablist" aria-label="Marketplace views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          className={`tab-button ${activeTab === 'all' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Listings <span className="tab-count">({totalListings})</span>
        </button>

        {user && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'mine'}
            className={`tab-button ${activeTab === 'mine' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('mine')}
          >
            My Listings <span className="tab-count">({myListings.length})</span>
          </button>
        )}

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'catalog'}
          className={`tab-button ${activeTab === 'catalog' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          Skills Catalog <span className="tab-count">({catalogSkills.length})</span>
        </button>
      </div>

      {/* VIEW: ALL LISTINGS */}
      {activeTab === 'all' && (
        <section className="marketplace-feed" aria-label="Skill listings">
          {/* Filter Bar */}
          <div className="filter-card">
            <div className="filter-primary-row">
              <div className="filter-search-box">
                <TextField
                  id="filter-search"
                  label="Search listings"
                  placeholder="Search by skill name, topic, or description…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-field"
                />
              </div>

              <div className="filter-direction-group">
                <label className="filter-group-label">Direction</label>
                <div className="direction-filter-pills" role="group" aria-label="Direction filter">
                  <button
                    type="button"
                    className={`filter-pill ${directionFilter === '' ? 'is-selected' : ''}`}
                    onClick={() => {
                      setDirectionFilter('');
                      setOffset(0);
                    }}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`filter-pill filter-pill-offer ${directionFilter === 'OFFER' ? 'is-selected' : ''}`}
                    onClick={() => {
                      setDirectionFilter('OFFER');
                      setOffset(0);
                    }}
                  >
                    <span className="glyph">↑</span> Teach (Offer)
                  </button>
                  <button
                    type="button"
                    className={`filter-pill filter-pill-learn ${directionFilter === 'LEARN' ? 'is-selected' : ''}`}
                    onClick={() => {
                      setDirectionFilter('LEARN');
                      setOffset(0);
                    }}
                  >
                    <span className="glyph">↓</span> Learn (Request)
                  </button>
                </div>
              </div>
            </div>

            <div className="filter-secondary-row">
              <div className="filter-select-item">
                <SelectField
                  id="filter-category"
                  label="Category"
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setSkillSlugFilter('');
                    setOffset(0);
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </SelectField>
              </div>

              <div className="filter-select-item">
                <SelectField
                  id="filter-skill"
                  label="Specific Skill"
                  value={skillSlugFilter}
                  onChange={(e) => {
                    setSkillSlugFilter(e.target.value);
                    setOffset(0);
                  }}
                >
                  <option value="">All Skills</option>
                  {filteredCatalogSkills.map((skill) => (
                    <option key={skill.slug} value={skill.slug}>
                      {skill.name}
                    </option>
                  ))}
                </SelectField>
              </div>

              {hasActiveFilters && (
                <div className="filter-reset-wrapper">
                  <Button
                    type="button"
                    variant="quiet"
                    onClick={handleResetFilters}
                    className="button-sm"
                  >
                    Reset filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {listingsError && (
            <div className="listings-error-banner">
              <Alert variant="error">{listingsError}</Alert>
              <Button variant="secondary" onClick={fetchListings} className="button-sm">
                Try again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoadingListings ? (
            <div className="listings-loading-wrap">
              <LoadingState label="Loading listings from the marketplace…" />
            </div>
          ) : listings.length === 0 ? (
            /* Empty State */
            <div className="empty-panel marketplace-empty">
              <span className="empty-number">00</span>
              <div>
                <h2>No listings match your search.</h2>
                <p>
                  {hasActiveFilters
                    ? 'Try adjusting your filters, clearing your search query, or switching direction.'
                    : 'The marketplace does not have any active listings yet.'}
                </p>
                <div className="empty-actions">
                  {hasActiveFilters && (
                    <Button variant="secondary" onClick={handleResetFilters}>
                      Clear all filters
                    </Button>
                  )}
                  {user ? (
                    <Button variant="primary" onClick={handleOpenCreate}>
                      Be the first to list a skill
                    </Button>
                  ) : (
                    <Link className="button button-primary" to="/register">
                      Join SkillSwap to share a skill
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Listings Grid */
            <>
              <div className="listings-grid">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    currentUserId={user?.id}
                    onEdit={(l) => {
                      setModalApiError('');
                      setEditingListing(l);
                    }}
                    onDelete={(l) => {
                      setModalApiError('');
                      setDeletingListing(l);
                    }}
                    onRequestExchange={(l) => {
                      if (!user) {
                        navigate('/login', { state: { from: { pathname: '/skills' } } });
                      } else {
                        setSelectedExchangeListing(l);
                      }
                    }}
                  />
                ))}
              </div>

              <PaginationControl
                total={totalListings}
                limit={limit}
                offset={offset}
                onPageChange={(newOffset) => setOffset(newOffset)}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  setOffset(0);
                }}
              />
            </>
          )}
        </section>
      )}

      {/* VIEW: MY LISTINGS */}
      {activeTab === 'mine' && (
        <section className="my-listings-section" aria-label="Your listings">
          <div className="contract-gap-callout">
            <div className="callout-indicator" aria-hidden="true">ℹ</div>
            <div>
              <p className="callout-title">Listing Search API Scope Note</p>
              <p className="callout-description">
                The public listing search endpoint (<code>GET /api/v1/skills/listings</code>) queries active listings across all members and does not provide an <code>owner_id</code> filter or access to deactivated listings. Listings shown below represent your listings matched from current platform results and active session creations.
              </p>
              <p className="callout-recommendation">
                <strong>Recommended API enhancement:</strong> Adding an <code>owner_id</code> query parameter to <code>GET /api/v1/skills/listings</code> (or a dedicated <code>GET /api/v1/skills/listings/me</code> endpoint supporting <code>is_active</code> filtering) will enable complete, persistent self-management.
              </p>
            </div>
          </div>

          {myListings.length === 0 ? (
            <div className="empty-panel">
              <span className="empty-number">01</span>
              <div>
                <h2>You haven’t created any listings yet.</h2>
                <p>
                  Share what you know or post a request for a skill you want to acquire.
                </p>
                <Button variant="primary" onClick={handleOpenCreate}>
                  Create your first listing
                </Button>
              </div>
            </div>
          ) : (
            <div className="listings-grid">
              {myListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  currentUserId={user?.id}
                  onEdit={(l) => {
                    setModalApiError('');
                    setEditingListing(l);
                  }}
                  onDelete={(l) => {
                    setModalApiError('');
                    setDeletingListing(l);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* VIEW: SKILLS CATALOG */}
      {activeTab === 'catalog' && (
        <section className="skills-catalog-section" aria-label="Skills catalog">
          <div className="catalog-intro">
            <p className="eyebrow">Verified catalog</p>
            <h2>Verified Skills in SkillSwap</h2>
            <p>
              All marketplace listings link directly to standard skills in our directory.
            </p>
          </div>

          {isLoadingSkills ? (
            <LoadingState label="Loading skills catalog…" />
          ) : skillsError ? (
            <Alert variant="error">{skillsError}</Alert>
          ) : catalogSkills.length === 0 ? (
            <div className="empty-panel">
              <span className="empty-number">00</span>
              <div>
                <h2>Catalog is empty.</h2>
                <p>No verified skills have been loaded yet.</p>
              </div>
            </div>
          ) : (
            <div className="catalog-grid">
              {catalogSkills.map((skill) => (
                <article key={skill.slug} className="catalog-card">
                  <div className="catalog-header">
                    <Badge variant="category">{skill.category || 'General'}</Badge>
                    <span className="catalog-slug">#{skill.slug}</span>
                  </div>
                  <h3>{skill.name}</h3>
                  <p className="catalog-desc">{skill.description || 'No description provided.'}</p>
                  <div className="catalog-card-actions">
                    <Button
                      variant="secondary"
                      className="button-sm"
                      onClick={() => {
                        setSkillSlugFilter(skill.slug);
                        setActiveTab('all');
                      }}
                    >
                      View listings for this skill →
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* CREATE MODAL */}
      <ListingFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateListing}
        skills={catalogSkills}
        isLoading={isSubmitting}
        apiError={modalApiError}
      />

      {/* EDIT MODAL */}
      <ListingFormModal
        isOpen={Boolean(editingListing)}
        onClose={() => setEditingListing(null)}
        onSubmit={handleUpdateListing}
        initialData={editingListing}
        skills={catalogSkills}
        isLoading={isSubmitting}
        apiError={modalApiError}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <DeleteListingDialog
        isOpen={Boolean(deletingListing)}
        onClose={() => setDeletingListing(null)}
        onConfirm={handleDeleteListing}
        listing={deletingListing}
        isLoading={isSubmitting}
        apiError={modalApiError}
      />

      {/* EXCHANGE REQUEST MODAL */}
      <ExchangeRequestModal
        isOpen={Boolean(selectedExchangeListing)}
        onClose={() => setSelectedExchangeListing(null)}
        listing={selectedExchangeListing}
        token={token}
        currentUserId={user?.id}
        onSuccess={(createdExchange) => {
          setNotice(`Exchange request #${createdExchange.id} sent successfully! You can track it in My Exchanges.`);
        }}
      />
    </div>
  );
}

