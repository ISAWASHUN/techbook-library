import type { Config } from 'drizzle-kit';

export default {
  schema: './packages/backend/drizzle/schema.ts',
  out: './packages/backend/drizzle/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:./local.db',
  },
} satisfies Config;
