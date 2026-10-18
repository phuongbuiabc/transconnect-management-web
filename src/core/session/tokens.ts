export interface Tokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
}

export function isTokens(value: unknown): value is Tokens {
  return (
    typeof value === 'object' &&
    value !== null &&
    'accessToken' in value &&
    typeof value.accessToken === 'string' &&
    value.accessToken.length > 0 &&
    'refreshToken' in value &&
    typeof value.refreshToken === 'string' &&
    value.refreshToken.length > 0 &&
    'accessTokenExpiresAt' in value &&
    typeof value.accessTokenExpiresAt === 'string'
  );
}
