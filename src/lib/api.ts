/**
 * The single HTTP client for talking to the backend.
 *
 * Before this existed every call site re-implemented the base URL, the
 * `/api/v1` prefix, the JSON headers and — where it remembered to — the bearer
 * token. It mostly didn't remember, which is how thirteen admin endpoints
 * started returning 401 the moment the backend started guarding them.
 *
 * Paths passed in here are relative to the API version prefix: `/categories`,
 * not `/api/v1/categories`.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const VERSION_PREFIX = '/api/v1';

/**
 * A non-2xx response. Carries the status and whatever the backend said, so
 * callers can tell "your session expired" apart from "that slug is taken"
 * instead of showing one generic failure message for both.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  /** The session is missing or no longer valid. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const withPrefix = path.startsWith(VERSION_PREFIX)
    ? path
    : `${VERSION_PREFIX}${path.startsWith('/') ? path : `/${path}`}`;
  return `${API_BASE}${withPrefix}`;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  /** Request body. Plain objects are JSON-encoded; FormData is passed through. */
  body?: unknown;
  /**
   * Send the bearer token from localStorage. Defaults to true — an unwanted
   * token on a public endpoint is harmless, a missing one on a guarded
   * endpoint is a 401.
   */
  auth?: boolean;
  /** Query params appended to the URL. Undefined and null values are dropped. */
  params?: Record<string, string | number | boolean | undefined | null>;
}

/** Pull the most useful message out of a Nest error body. */
function messageFromBody(status: number, body: unknown): string {
  if (body && typeof body === 'object') {
    const message = (body as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message) return message;
    const error = (body as { error?: unknown }).error;
    if (typeof error === 'string' && error) return error;
  }
  if (typeof body === 'string' && body.trim()) return body.trim();
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return 'You do not have permission to do that.';
  return `Request failed (${status})`;
}

/**
 * Perform a request and return the raw `Response`. Throws {@link ApiError} on
 * a non-2xx status. Use {@link request} unless you need the response object
 * itself (blob downloads, header inspection).
 */
export async function rawRequest(
  method: string,
  path: string,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const { body, auth = true, params, headers, ...rest } = options;

  let url = apiUrl(path);
  if (params) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, String(value));
      }
    }
    const query = search.toString();
    if (query) url += (url.includes('?') ? '&' : '?') + query;
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const finalHeaders = new Headers(headers);

  // Let the browser set the multipart boundary itself.
  if (body !== undefined && !isFormData && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getToken();
    if (token && !finalHeaders.has('Authorization')) {
      finalHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });
  } catch (cause) {
    // Network-level failure: no status to report.
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.', cause);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let parsed: unknown = text;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        // Not JSON — keep the raw text.
      }
    }
    throw new ApiError(response.status, messageFromBody(response.status, parsed), parsed);
  }

  return response;
}

/** Perform a request and parse the JSON body. `204` and empty bodies yield `null`. */
export async function request<T = unknown>(
  method: string,
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await rawRequest(method, path, options);
  if (response.status === 204) return null as T;
  const text = await response.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const api = {
  get: <T = unknown>(path: string, options?: ApiRequestOptions) =>
    request<T>('GET', path, options),
  post: <T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  put: <T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T = unknown>(path: string, options?: ApiRequestOptions) =>
    request<T>('DELETE', path, options),
  /** Multipart upload. Pass a FormData body. */
  upload: <T = unknown>(path: string, form: FormData, options?: ApiRequestOptions) =>
    request<T>('POST', path, { ...options, body: form }),
  /** Escape hatch for callers that need the `Response` (e.g. blob downloads). */
  raw: rawRequest,
  url: apiUrl,
};

/**
 * Save a response body as a file download. Pairs with `api.raw` for the
 * endpoints that return a spreadsheet, ZIP or PDF rather than JSON.
 */
export async function downloadBlob(response: Response, filename: string): Promise<void> {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Message for a caught error, whether or not it came from this client.
 * Use in `catch` blocks instead of a hardcoded "Something went wrong".
 */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default api;
