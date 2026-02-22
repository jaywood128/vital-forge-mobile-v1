import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../lib/api/baseQuery';

export const templatesApi = createApi({
  reducerPath: 'templatesApi',
  baseQuery,
  tagTypes: ['Templates'],
  endpoints: (builder) => ({
    getTemplates: builder.query<any[], void>({
      query: () => '/api/v1/workout_templates',
      providesTags: ['Templates'],
    }),
    getTemplate: builder.query<any, number>({
      query: (id) => `/api/v1/workout_templates/${id}`,
      providesTags: ['Templates'],
    }),
  }),
});

export const { useGetTemplatesQuery, useGetTemplateQuery } = templatesApi;
