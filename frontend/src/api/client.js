const API_BASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  '/api/v1'
).replace(/\/+$/, '');

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} email
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} profile_image
 * @property {string} bio
 * @property {string} location
 * @property {string} timezone
 * @property {string} role
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} TokenResponse
 * @property {string} access_token
 * @property {string} token_type
 * @property {User} user
 */

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   * @param {unknown} detail
   */
  constructor(message, status, detail) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * @param {string} path
 * @param {{ method?: string, body?: unknown, token?: string, signal?: AbortSignal }} [options]
 * @returns {Promise<any>}
 */
export async function apiRequest(path, options = {}) {
  const headers = new Headers({ Accept: 'application/json' });
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });
  const responseText = response.status === 204 ? '' : await response.text();
  let payload = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = responseText;
    }
  }

  if (!response.ok) {
    const detail = payload && typeof payload === 'object' ? payload.detail : null;
    throw new ApiError(
      formatApiError(detail) || `The request failed (${response.status}).`,
      response.status,
      detail,
    );
  }

  return payload;
}

/**
 * @param {unknown} detail
 * @returns {string}
 */
export function formatApiError(detail) {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const location = Array.isArray(item?.loc) ? item.loc.slice(1).join(' → ') : '';
        const message = item?.msg || 'Invalid value';
        return location ? `${location}: ${message}` : message;
      })
      .join(' ');
  }
  if (detail && typeof detail === 'object' && typeof detail.message === 'string') {
    return detail.message;
  }
  return '';
}

export const authApi = {
  /** @param {{ email: string, password: string }} credentials */
  login: (credentials) =>
    /** @type {Promise<TokenResponse>} */ (
      apiRequest('/auth/login', { method: 'POST', body: credentials })
    ),

  /** @param {{ email: string, password: string, first_name: string, last_name: string }} details */
  register: (details) =>
    /** @type {Promise<TokenResponse>} */ (
      apiRequest('/auth/register', { method: 'POST', body: details })
    ),

  /** @param {string} token */
  me: (token) => /** @type {Promise<User>} */ (apiRequest('/auth/me', { token })),
};

export const profileApi = {
  /**
   * @param {string} token
   * @param {{ signal?: AbortSignal }} [options]
   */
  get: (token, options = {}) =>
    /** @type {Promise<User>} */ (apiRequest('/users/me', { token, signal: options.signal })),

  /**
   * @param {string} token
   * @param {Partial<Pick<User, 'first_name' | 'last_name' | 'profile_image' | 'bio' | 'location' | 'timezone'>>} changes
   */
  update: (token, changes) =>
    /** @type {Promise<User>} */ (
      apiRequest('/users/me', { method: 'PATCH', token, body: changes })
    ),
};

/**
 * @typedef {Object} Skill
 * @property {number} id
 * @property {string} name
 * @property {string} slug
 * @property {string} category
 * @property {string} description
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} SkillListing
 * @property {number} id
 * @property {number} owner_id
 * @property {Skill} skill
 * @property {'OFFER' | 'LEARN'} direction
 * @property {string} description
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} SkillPage
 * @property {Skill[]} items
 * @property {number} total
 * @property {number} limit
 * @property {number} offset
 */

/**
 * @typedef {Object} SkillListingPage
 * @property {SkillListing[]} items
 * @property {number} total
 * @property {number} limit
 * @property {number} offset
 */

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const skillsApi = {
  /**
   * @param {{ query?: string, category?: string, limit?: number, offset?: number }} [params]
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<SkillPage>}
   */
  listSkills: (params = {}, options = {}) =>
    apiRequest(`/skills${buildQueryString(params)}`, { signal: options.signal }),

  /**
   * @param {{ query?: string, skill_slug?: string, direction?: 'OFFER' | 'LEARN', limit?: number, offset?: number }} [params]
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<SkillListingPage>}
   */
  listListings: (params = {}, options = {}) =>
    apiRequest(`/skills/listings${buildQueryString(params)}`, { signal: options.signal }),

  /**
   * @param {string} token
   * @param {{ skill_slug: string, direction: 'OFFER' | 'LEARN', description?: string }} listing
   * @returns {Promise<SkillListing>}
   */
  createListing: (token, listing) =>
    apiRequest('/skills/listings', {
      method: 'POST',
      token,
      body: listing,
    }),

  /**
   * @param {string} token
   * @param {number} listingId
   * @param {{ skill_slug?: string, direction?: 'OFFER' | 'LEARN', description?: string, is_active?: boolean }} changes
   * @returns {Promise<SkillListing>}
   */
  updateListing: (token, listingId, changes) =>
    apiRequest(`/skills/listings/${listingId}`, {
      method: 'PATCH',
      token,
      body: changes,
    }),

  /**
   * @param {string} token
   * @param {number} listingId
   * @returns {Promise<void>}
   */
  deleteListing: (token, listingId) =>
    apiRequest(`/skills/listings/${listingId}`, {
      method: 'DELETE',
      token,
    }),
};

/**
 * @typedef {'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED'} ExchangeStatus
 */

/**
 * @typedef {Object} Exchange
 * @property {number} id
 * @property {number} learner_id
 * @property {number} owner_id
 * @property {SkillListing | null} listing
 * @property {ExchangeStatus} status
 * @property {string | null} scheduled_at
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} ExchangePage
 * @property {Exchange[]} items
 * @property {number} total
 * @property {number} limit
 * @property {number} offset
 */

export const exchangesApi = {
  /**
   * List exchange requests for current user
   * @param {string} token
   * @param {{ limit?: number, offset?: number }} [params]
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<ExchangePage>}
   */
  list: (token, params = {}, options = {}) =>
    apiRequest(`/exchanges${buildQueryString(params)}`, {
      token,
      signal: options.signal,
    }),

  /**
   * Request an exchange on an offered skill listing
   * @param {string} token
   * @param {{ listing_id: number, scheduled_at?: string | null }} request
   * @returns {Promise<Exchange>}
   */
  create: (token, request) =>
    apiRequest('/exchanges', {
      method: 'POST',
      token,
      body: request,
    }),

  /**
   * Transition an exchange request status
   * @param {string} token
   * @param {number} exchangeId
   * @param {ExchangeStatus} status
   * @returns {Promise<Exchange>}
   */
  updateStatus: (token, exchangeId, status) =>
    apiRequest(`/exchanges/${exchangeId}/status`, {
      method: 'PATCH',
      token,
      body: { status },
    }),
};

/**
 * @typedef {Object} ReviewUserSummary
 * @property {number} id
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} profile_image
 */

/**
 * @typedef {Object} Review
 * @property {number} id
 * @property {number} exchange_id
 * @property {number} reviewer_id
 * @property {number} reviewee_id
 * @property {ReviewUserSummary} reviewer
 * @property {ReviewUserSummary} reviewee
 * @property {number} rating
 * @property {string} feedback
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} ReviewPage
 * @property {Review[]} items
 * @property {number} total
 * @property {number} limit
 * @property {number} offset
 */

export const reviewsApi = {
  /**
   * Submit a review for a completed exchange
   * @param {string} token
   * @param {{ exchange_id: number, rating: number, feedback?: string, reviewee_id?: number | null }} review
   * @returns {Promise<Review>}
   */
  create: (token, review) =>
    apiRequest('/reviews', {
      method: 'POST',
      token,
      body: review,
    }),

  /**
   * List reviews with optional filters
   * @param {string} token
   * @param {{ user_id?: number, reviewee_id?: number, reviewer_id?: number, exchange_id?: number, rating?: number, min_rating?: number, limit?: number, offset?: number }} [params]
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<ReviewPage>}
   */
  list: (token, params = {}, options = {}) =>
    apiRequest(`/reviews${buildQueryString(params)}`, {
      token,
      signal: options.signal,
    }),

  /**
   * Get a single review by ID
   * @param {string} token
   * @param {number} reviewId
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<Review>}
   */
  get: (token, reviewId, options = {}) =>
    apiRequest(`/reviews/${reviewId}`, {
      token,
      signal: options.signal,
    }),
};
