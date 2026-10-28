/** Firebase auth error codes → something a player can act on. */
export const friendlyAuthError = (err: any): string => {
  switch (err?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Wrong number or password. New here? Create an account first.';
    case 'auth/email-already-in-use':
      return 'This number is already registered. Please log in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled for this Firebase project.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a minute and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/invalid-email':
      return 'That number does not look right. Please check it.';
    default:
      return err?.message || 'Authentication failed';
  }
};

/**
 * The app signs people in as `<number>@clorigo.com`, so the number is the
 * identity. Keep this in one place — the login and sign-up screens must agree,
 * otherwise the same person ends up with two accounts.
 */
export const emailForNumber = (raw: string): string => {
  const value = raw.trim();
  return value.includes('@') ? value : `${value}@clorigo.com`;
};
