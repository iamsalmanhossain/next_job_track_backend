export const DEMO_CONFIG = {
  USER_EMAIL: 'demoUser@jobtracker.com',
  USER_PASSWORD: 'DemoUser123!',
  ADMIN_EMAIL: 'demoAdmin@jobtracker.com',
  ADMIN_PASSWORD: 'DemoAdmin123!',
};

export const isDemoEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return (
    normalized === DEMO_CONFIG.USER_EMAIL.toLowerCase() ||
    normalized === DEMO_CONFIG.ADMIN_EMAIL.toLowerCase()
  );
};
