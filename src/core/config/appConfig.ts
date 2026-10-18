const configuredUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5267';
const url = new URL(configuredUrl);
if (
  !['http:', 'https:'].includes(url.protocol) ||
  url.username ||
  url.password ||
  url.search ||
  url.hash
) {
  throw new Error(
    'VITE_API_BASE_URL must be an HTTP(S) URL without credentials, query or fragment.',
  );
}
export const API_BASE_URL = configuredUrl.replace(/\/+$/, '');
