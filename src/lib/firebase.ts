const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY as
  | string
  | undefined;

export const isFirebaseConfigured = Boolean(FIREBASE_API_KEY);

interface FirebaseAuthError {
  error?: {
    message?: string;
  };
}

const errorMessages: Record<string, string> = {
  EMAIL_NOT_FOUND: 'Incorrect email or password.',
  INVALID_PASSWORD: 'Incorrect email or password.',
  INVALID_LOGIN_CREDENTIALS: 'Incorrect email or password.',
  INVALID_EMAIL: 'That email address is not valid.',
  USER_DISABLED: 'This account has been disabled.',
  TOO_MANY_ATTEMPTS_TRY_LATER:
    'Too many attempts. Please try again in a few minutes.',
  OPERATION_NOT_ALLOWED: 'Email/password sign in is disabled for this project.',
};

/**
 * Signs in with Firebase Auth's email/password REST endpoint and returns an
 * ID token, which the backend exchanges for its own JWT. Using the REST API
 * keeps the dashboard bundle small compared to the full Firebase SDK.
 */
export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<string> {
  if (!FIREBASE_API_KEY) {
    throw new Error(
      'Firebase is not configured. Add VITE_FIREBASE_API_KEY to your .env file.',
    );
  }

  let response: Response;
  try {
    response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      },
    );
  } catch {
    throw new Error('Network error while contacting Firebase.');
  }

  const data = (await response.json().catch(() => ({}))) as
    | { idToken?: string }
    | FirebaseAuthError;

  if (!response.ok) {
    const code = (data as FirebaseAuthError).error?.message ?? '';
    throw new Error(
      errorMessages[code] ??
        'Sign in failed. Check your credentials and try again.',
    );
  }

  const idToken = (data as { idToken?: string }).idToken;
  if (!idToken) {
    throw new Error('Firebase did not return an ID token.');
  }
  return idToken;
}
