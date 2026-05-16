import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../lib/api/baseQuery';

type MobileUser = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
};

type MobileAuthResponse = {
  data: {
    user: MobileUser;
    token: string;
    expires_at?: string;
    message?: string;
  };
};

type MobileCurrentUserResponse = {
  data: {
    user: MobileUser;
  };
};

type ForgotPasswordResponse = {
  message: string;
};

type ResetPasswordResponse = {
  message: string;
};


export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['Auth', 'User'],
  endpoints: (builder) => ({
    login: builder.mutation<
      MobileAuthResponse['data'],
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/api/v1/mobile/login',
        method: 'POST',
        body: { user: credentials },
      }),
      transformResponse: (response: MobileAuthResponse) => response.data,
      invalidatesTags: ['Auth', 'User'],
    }),
    signup: builder.mutation<
      MobileAuthResponse['data'],
      { email: string; password: string; first_name: string; last_name: string; phone_number: string; password_confirmation?: string }
    >({
      query: (userData) => ({
        url: '/api/v1/mobile/signup',
        method: 'POST',
        body: { user: userData },
      }),
      transformResponse: (response: MobileAuthResponse) => response.data,
      invalidatesTags: ['Auth', 'User'],
    }),
    getCurrentUser: builder.query<MobileUser, void>({
      query: () => '/api/v1/mobile/current_user',
      transformResponse: (response: MobileCurrentUserResponse) => response.data.user,
      providesTags: ['User'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/api/v1/mobile/logout',
        method: 'DELETE',
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
    forgotPassword: builder.mutation<ForgotPasswordResponse, { email: string }>({
      query: (body) => ({
        url: '/api/v1/mobile/forgot_password',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation<
      ResetPasswordResponse,
      { token: string; password: string; password_confirmation: string }
    >({
      query: (body) => ({
        url: '/api/v1/mobile/reset_password',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
