import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// usersテーブル
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slackUserId: text('slack_user_id').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// booksテーブル
export const books = sqliteTable('books', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  recommendFor: text('recommend_for'),
  isLendable: integer('is_lendable').notNull().default(1),
  ownerId: integer('owner_id')
    .notNull()
    .references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// lendsテーブル
export const lends = sqliteTable('lends', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bookId: integer('book_id')
    .notNull()
    .references(() => books.id),
  borrowerId: integer('borrower_id')
    .notNull()
    .references(() => users.id),
  lenderId: integer('lender_id')
    .notNull()
    .references(() => users.id),
  borrowDate: integer('borrow_date', { mode: 'timestamp' }).notNull().defaultNow(),
  returnDeadline: integer('return_deadline', { mode: 'timestamp' }).notNull(),
  status: text('status', { enum: ['BORROWING', 'RETURNED'] })
    .notNull()
    .default('BORROWING'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// remindersテーブル
export const reminders = sqliteTable('reminders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lendId: integer('lend_id')
    .notNull()
    .references(() => lends.id),
  sentAt: integer('sent_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// リレーションの型定義
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;

export type Lend = typeof lends.$inferSelect;
export type NewLend = typeof lends.$inferInsert;

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
