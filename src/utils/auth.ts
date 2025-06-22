import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { verifyIdToken } from '../lib/firebaseAdmin'; // Assuming firebaseAdmin.ts is in lib
import nookies from 'nookies';

interface AuthenticatedUser {
  uid: string;
  email?: string | null;
  displayName?: string | null; // Added displayName
  // Add other user properties you might need
}

interface WithAuthOptions {
  redirectTo?: string; // Path to redirect to if not authenticated
  fetchUserData?: (uid: string) => Promise<Record<string, unknown>>; // Optional: Function to fetch additional user data
}

// Props type for when user is not authenticated or an error occurs
type UnauthenticatedProps = { user: null };
type AuthErrorProps = { user: null; error: string };


// Higher-order function for server-side authentication
export function withAuth<P extends Record<string, unknown>>(
  handler: (
    context: GetServerSidePropsContext,
    auth: { user: AuthenticatedUser; token: string }
  ) => Promise<GetServerSidePropsResult<P>>,
  options?: WithAuthOptions
) {
  return async (
    context: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<P | UnauthenticatedProps | AuthErrorProps>> => {
    const cookies = nookies.get(context);
    const token = cookies.token; // Assuming the token is stored in a cookie named 'token'

    if (!token) {
      if (options?.redirectTo) {
        return {
          redirect: {
            destination: options.redirectTo,
            permanent: false,
          },
        };
      }
      // If no redirect path, you might want to return a specific prop or error
      return { props: { user: null } }; // Or handle as an error page
    }

    try {
      const decodedToken = await verifyIdToken(token);
      if (!decodedToken) {
        // Token is invalid or expired
        nookies.destroy(context, 'token'); // Clear the invalid cookie
        if (options?.redirectTo) {
          return {
            redirect: {
              destination: options.redirectTo,
              permanent: false,
            },
          };
        }
        return { props: { user: null } };
      }

      const user: AuthenticatedUser = {
        uid: decodedToken.uid,
        email: decodedToken.email || null,
        displayName: decodedToken.name || null, // Firebase ID token often has 'name' for displayName
        // Map other relevant fields from decodedToken if needed
      };

      // Optionally fetch additional user data
      let additionalProps = {};
      if (options?.fetchUserData) {
        const userData = await options.fetchUserData(user.uid);
        additionalProps = { userData }; // Or spread into props
      }
      
      // Call the original getServerSideProps handler with the authenticated user
      const result = await handler(context, { user, token });

      if ('props' in result) {
        return {
          props: {
            ...result.props,
            user, // Ensure user is always passed down
            ...additionalProps,
          } as P & { user: AuthenticatedUser }, // Type assertion
        };
      }
      return result; // Handles redirects, notFound, etc.

    } catch (error) {
      console.error('Authentication error in withAuth:', error);
      // Handle error, e.g., redirect to login or show an error page
      nookies.destroy(context, 'token'); // Clear cookie on error
      if (options?.redirectTo) {
        return {
          redirect: {
            destination: options.redirectTo,
            permanent: false,
          },
        };
      }
      // Fallback if no redirect is specified
      return {
        props: { user: null, error: 'Authentication failed' },
      };
    }
  };
}

// Example usage (optional, for demonstration)
//
// export const getServerSideProps = withAuth(async (context, auth) => {
//   // auth.user contains the authenticated user
//   // auth.token contains the Firebase ID token
//   console.log('Authenticated user:', auth.user);
//
//   // Your regular getServerSideProps logic here
//   return {
//     props: {
//       myData: "This is protected data for " + auth.user.email,
//     },
//   };
// }, { redirectTo: '/auth' }); // Redirect to /auth if not authenticated