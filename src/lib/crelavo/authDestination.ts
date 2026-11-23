/** Authentication returns to the current app, never a configured production origin. */
export function authDestination(origin: string, target: string): string {
  const base = new URL(origin);
  if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw new Error('invalid_auth_origin');
  if (!target.startsWith('/') || target.startsWith('//') || /[\\\x00-\x20]/.test(target)) throw new Error('invalid_auth_target');
  const result = new URL(target, base.origin);
  if (result.origin !== base.origin) throw new Error('invalid_auth_target');
  return result.toString();
}
