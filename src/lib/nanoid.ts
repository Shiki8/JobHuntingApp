export const nanoid = (): string =>
  crypto.randomUUID().replace(/-/g, '').slice(0, 16);
