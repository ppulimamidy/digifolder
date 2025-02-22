export interface AuthResponse {
  data: {
    user: {
      id: string;
      email: string;
    } | null;
    session: {
      access_token: string;
      refresh_token: string;
    } | null;
  };
  error: {
    message: string;
  } | null;
}

export interface AuthError {
  message: string;
} 