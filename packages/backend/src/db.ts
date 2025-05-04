import { drizzle } from 'drizzle-orm/d1';
import { users, books, lends, reminders } from '../drizzle/schema';

export function createDb(d1: D1Database) {
  return drizzle(d1, {
    schema: { users, books, lends, reminders },
  });
}

export type DB = ReturnType<typeof createDb>;
