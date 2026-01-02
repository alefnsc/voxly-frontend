/**
 * Apollo Client Configuration
 * 
 * Configures Apollo Client for GraphQL queries with Clerk authentication.
 * 
 * @module lib/apolloClient
 */

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

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
 * Create auth link that adds Clerk user ID to requests
 * 
 * This retrieves the Clerk user ID from session storage (set by Clerk SDK)
 * and adds it to the x-user-id header for authentication.
 */
const authLink = setContext(async (_, { headers }) => {
  // Try to get Clerk session token
  // The Clerk SDK stores the session data in various places
  let clerkUserId: string | null = null;
  
  try {
    // Check if Clerk is loaded and has a user
    const clerk = (window as any).Clerk;
    if (clerk?.user?.id) {
      clerkUserId = clerk.user.id;
    }
  } catch (error) {
    console.warn('Apollo: Failed to get Clerk user ID', error);
  }

  return {
    headers: {
      ...headers,
      'x-user-id': clerkUserId || '',
    },
  };
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
 * - Auth link for Clerk user ID
 * - HTTP link to GraphQL endpoint
 * - In-memory cache with type policies
 */
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
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
