// db/schema.ts
import {pgTable, text, integer, timestamp, uniqueIndex, PgTable} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()), 
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});



export const accounts = pgTable(
  "accounts",
  {
    id: text("id")
  .primaryKey()
  .$defaultFn(() => crypto.randomUUID()),

    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: text("type").notNull(), // "cash" | "card"
    name: text("name").notNull(), // "Cash" | "Card"
    balanceCents: integer("balance_cents").notNull().default(0),

    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    userTypeUnique: uniqueIndex("accounts_user_type_unique").on(t.userId, t.type),
  })
);

