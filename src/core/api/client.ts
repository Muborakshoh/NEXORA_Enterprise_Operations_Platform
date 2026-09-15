/**
 * API Client
 * 
 * Centralized HTTP client for backend communication.
 * Handles authentication, error mapping, and request/response interceptors.
 */

import { config } from '../config';

// ─── Error Classes ──────────────────────────────────────────────────────────

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error. Please check your connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class UnauthorizedError extends ApiClientError {
  constructor() {
    super('UNAUTHORIZED', 'Authentication required.', 401);
  }
}

// ─── Token Management ───────────────────────────────────────────────────────

class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem(config.tokenStorageKey);
    }
    return this.accessToken;
  }

  setTokens(access: string, refresh: string): void {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem(config.tokenStorageKey, access);
    localStorage.setItem(config.refreshTokenStorageKey, refresh);
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem(config.tokenStorageKey);
    localStorage.removeItem(config.refreshTokenStorageKey);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const tokenManager = new TokenManager();

// ─── API Client ─────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  responseType?: 'json' | 'blob' | 'text';
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
    this.timeout = config.requestTimeout;
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Build request headers with authentication
   */
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Request-ID': crypto.randomUUID(),
      ...customHeaders,
    };

    const token = tokenManager.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle HTTP errors and map to typed exceptions
   */
  private async handleError(response: Response): Promise<never> {
    let errorData: any = null;

    try {
      errorData = await response.json();
    } catch {
      // Response body is not JSON
    }

    if (response.status === 401) {
      tokenManager.clearTokens();
      throw new UnauthorizedError();
    }

    throw new ApiClientError(
      errorData?.error?.code || 'UNKNOWN_ERROR',
      errorData?.error?.message || response.statusText || 'An unexpected error occurred',
      response.status,
      errorData?.error?.details,
    );
  }

  /**
   * Execute HTTP request
   */
  async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    const headers = this.buildHeaders(options?.headers);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: options?.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleError(response);
      }

      // Handle different response types
      if (options?.responseType === 'blob') {
        return await response.blob() as any;
      } else if (options?.responseType === 'text') {
        return await response.text() as any;
      } else {
        const result = await response.json();
        return result.data;
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiClientError('TIMEOUT', 'Request timed out', 408);
      }

      throw new NetworkError();
    }
  }

  // Convenience methods
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }
}

export const apiClient = new ApiClient();
