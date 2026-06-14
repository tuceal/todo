import { pgTable, text, boolean, bigint } from "drizzle-orm/pg-core";

export const todosTable = pgTable("todos", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  text: text("text").notNull(),
  done: boolean("done").notNull().default(false),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  category: text("category"),
  dueDate: text("due_date"),
  priority: text("priority"),
});

export type TodoRow = typeof todosTable.$inferSelect;
