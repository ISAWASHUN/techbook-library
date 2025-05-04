# Drizzle ORMの導入

このドキュメントでは、Drizzle ORMを使用してCloudflare D1データベースとの連携方法について説明します。

## Drizzle ORMとは

Drizzle ORMは、TypeScriptに完全対応した型安全なSQLクエリビルダです。以下の特徴があります：

- 型安全性: TypeScriptの型システムを活用した安全なデータアクセス
- SQLライクな構文: 学習コストが低く、SQLに近い直感的な構文
- パフォーマンス: 軽量で高速な実行
- マイグレーション管理: スキーマ変更を追跡・適用する仕組み

## インストール手順

1. 必要なパッケージをインストールします

```bash
# DrizzleとD1アダプターをインストール
pnpm add -w drizzle-orm @libsql/client
# 開発依存関係として、drizzle-kitをインストール
pnpm add -D -w drizzle-kit
```

2. プロジェクト構成を作成します

```
packages/backend/
├── drizzle/
│   ├── migrations/    # マイグレーションファイルが保存されるディレクトリ
│   └── schema.ts      # データベーススキーマ定義
├── src/
│   ├── db.ts          # データベース接続設定
```

## スキーマ定義

既存のデータベース設計に基づいて、`schema.ts`ファイルに以下のようにスキーマを定義します。

```typescript
// packages/backend/drizzle/schema.ts
import { integer, sqliteTable, text, boolean } from 'drizzle-orm/sqlite-core';

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
  isLendable: boolean('is_lendable').notNull().default(true),
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
```

## マイグレーションの設定

1. `drizzle.config.ts`ファイルをプロジェクトのルートに作成します

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './packages/backend/drizzle/schema.ts',
  out: './packages/backend/drizzle/migrations',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: './packages/backend/wrangler.toml',
    dbName: 'techbook-library-db',
  },
} satisfies Config;
```

2. package.jsonにマイグレーション用のスクリプトを追加します

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push:sqlite",
    "db:studio": "drizzle-kit studio"
  }
}
```

## データベース接続設定

Cloudflare WorkersでD1を使用する場合の接続設定例：

```typescript
// packages/backend/src/db.ts
import { drizzle } from 'drizzle-orm/d1';
import { users, books, lends, reminders } from '../drizzle/schema';

export function createDb(d1: D1Database) {
  return drizzle(d1, {
    schema: { users, books, lends, reminders },
  });
}

// 使用例
export type DB = ReturnType<typeof createDb>;

// Honoでの使用例
import { Hono } from 'hono';
import { createDb } from './db';

const app = new Hono<{
  Bindings: {
    DB: D1Database;
  };
}>();

app.get('/users', async c => {
  const db = createDb(c.env.DB);
  const allUsers = await db.select().from(users);
  return c.json(allUsers);
});
```

## マイグレーションの実行

マイグレーションを生成して適用する手順：

1. マイグレーションファイルの生成

```bash
pnpm db:generate
```

2. マイグレーションをD1データベースに適用

```bash
pnpm db:push
```

## Drizzle Studioを使用したデータ管理

ローカルでデータベースを管理するためのGUIを起動：

```bash
pnpm db:studio
```

これにより、ブラウザでデータベースの内容を確認・編集できるインターフェースが提供されます。

## 参考リンク

- [Drizzle ORM 公式ドキュメント](https://orm.drizzle.team/docs/overview)
- [Cloudflare D1 ドキュメント](https://developers.cloudflare.com/d1/)
- [Drizzle Kit CLI リファレンス](https://orm.drizzle.team/kit-docs/overview)
