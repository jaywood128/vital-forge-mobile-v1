import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import * as SecureStore from 'expo-secure-store';

// NOTE:
// RTK Query's `prepareHeaders` is effectively synchronous; an async function there
// can result in headers not being applied. We attach the JWT in this wrapper
// baseQuery instead, reading from SecureStore (iOS Keychain / Android Keystore).
//
// Mobile endpoints in this Rails app skip CSRF (`Api::V1::Mobile::BaseController`),
// so we do not send/fetch CSRF tokens here.
const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
});

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let token: string | null = null;
  try {
    token = await SecureStore.getItemAsync('authToken');
  } catch {
    token = null;
  }

  const request: FetchArgs = typeof args === 'string' ? { url: args } : { ...args };
  const existingHeaders = (request.headers ?? {}) as Record<string, string>;

  request.headers = {
    ...existingHeaders,
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Only set Content-Type when we're sending a body and it isn't already set.
  if (request.body != null) {
    const hasContentType =
      Object.keys(request.headers).some((k) => k.toLowerCase() === 'content-type');
    if (!hasContentType) {
      request.headers = { ...(request.headers as Record<string, string>), 'Content-Type': 'application/json' };
    }
  }

  return rawBaseQuery(request, api, extraOptions);
};
