type ErrorDetails = {
  code?: unknown;
  message?: unknown;
};

function hasErrorDetails(error: unknown): error is ErrorDetails {
  return typeof error === "object" && error !== null && ("code" in error || "message" in error);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (hasErrorDetails(error) && typeof error.message === "string") {
    return error.message;
  }

  return "";
}

function getErrorCode(error: unknown) {
  if (hasErrorDetails(error) && typeof error.code === "string") {
    return error.code;
  }

  return "";
}

export function getAuthErrorMessage(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "That email and password combination was not recognized.";
  }

  if (message.includes("email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }

  if (message.includes("user already registered")) {
    return "An account with that email already exists. Try signing in instead.";
  }

  if (message.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return "We could not complete that authentication request. Please try again.";
}

export function getDatabaseErrorMessage(error: unknown, fallback: string) {
  const code = getErrorCode(error);

  if (code === "23505") {
    return "That value is already in use. Try something different.";
  }

  if (code === "23514") {
    return "Please check the values and try again.";
  }

  return fallback;
}
