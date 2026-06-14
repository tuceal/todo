import { pgTable, serial, text, unique } from "drizzle-orm/pg-core";

export const categoriesTable = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
  },
  (t) => [unique("categories_user_name").on(t.userId, t.name)],
);
