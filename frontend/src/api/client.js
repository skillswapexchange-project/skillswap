const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');

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
