import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// NOTE:
// RTK Query's `prepareHeaders` is effectively synchronous; an async function there
// can result in headers not being applied. For React Native we need AsyncStorage,
// so we attach headers in this wrapper baseQuery instead.
//
// Also: mobile endpoints in this Rails app skip CSRF (`Api::V1::Mobile::BaseController`),
// so we do not send/fetch CSRF tokens here.
const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
});

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let token: string | null = null;
  try {
    token = await AsyncStorage.getItem('authToken');
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
