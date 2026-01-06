/**
 * Apollo Client Configuration
 *
 * Configures Apollo Client for GraphQL queries using first-party cookie sessions.
 *
 * @module lib/apolloClient
 */

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from '@apollo/client';

// Get base URL from environment
const GRAPHQL_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/graphql`
  : 'http://localhost:3001/graphql';

// Create HTTP link for GraphQL endpoint
const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
  credentials: 'include',
});

/**
 * Configure cache with field policies for proper merging
 */
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Dashboard data should be replaced entirely
        dashboardData: {
          merge: false,
        },
        // Interviews list should merge by ID
        interviews: {
          keyArgs: ['filters'],
          merge(existing, incoming) {
            return incoming;
          },
        },
      },
    },
    // Define key fields for types
    Interview: {
      keyFields: ['id'],
    },
    DashboardData: {
      keyFields: [], // Singleton - no key fields
    },
    BenchmarkResponse: {
      keyFields: ['data', ['roleTitle']],
    },
  },
});

/**
 * Apollo Client instance
 * 
 * Configured with:
 * - Cookie session auth (credentials: include)
 * - HTTP link to GraphQL endpoint
 * - In-memory cache with type policies
 */
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  // Enable devtools in development
  devtools: {
    enabled: process.env.NODE_ENV !== 'production',
  },
});

/**
 * Clear Apollo cache (useful for logout)
 */
export async function clearApolloCache(): Promise<void> {
  await apolloClient.clearStore();
}

/**
 * Reset Apollo cache and refetch active queries
 */
export async function resetApolloCache(): Promise<void> {
  await apolloClient.resetStore();
}

export default apolloClient;
