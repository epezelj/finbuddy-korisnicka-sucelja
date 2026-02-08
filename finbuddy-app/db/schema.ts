// db/schema.ts
import {pgTable, text, integer, timestamp, index, uniqueIndex, PgTable} from "drizzle-orm/pg-core";


// Define your tables schema directly here
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "cash" | "card"
  name: text("name").notNull(), // "Cash" | "Card"
  balanceCents: integer("balance_cents").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
});


export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),

    accountId: text("account_id").notNull(),
    kind: text("kind").notNull(),

    amountCents: integer("amount_cents").notNull(),
    category: text("category").notNull(),
    date: text("date").notNull(),

    name: text("name").notNull(),

    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("tx_user_idx").on(t.userId),
    userDateIdx: index("tx_user_date_idx").on(t.userId, t.date),
  })
);

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(), //expense ili income
    color: text("color").notNull().default("#2563EB"),
    monthlyLimitCents: integer("monthly_limit_cents"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("categories_user_idx").on(t.userId),
    userNameIdx: index("categories_user_name_idx").on(t.userId, t.name),
  })
);



