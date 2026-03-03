import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { skill } from "./skills";

export const vaultTypeEnum = pgEnum("vault_type", ["personal", "enterprise", "system_default"]);

export const vaultMembershipRoleEnum = pgEnum("vault_membership_role", [
  "owner",
  "admin",
  "member",
]);

export const vaultInvitationStatusEnum = pgEnum("vault_invitation_status", [
  "pending",
  "accepted",
  "declined",
  "revoked",
  "expired",
]);

export const vault = pgTable(
  "vault",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    type: vaultTypeEnum("type").notNull(),
    color: text("color"),
    // system-managed vaults can't be deleted or renamed by users
    isSystemManaged: boolean("is_system_managed").notNull().default(false),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("vault_slug_idx").on(table.slug), index("vault_type_idx").on(table.type)],
);

export const vaultMembership = pgTable(
  "vault_membership",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vaultId: uuid("vault_id")
      .notNull()
      .references(() => vault.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: vaultMembershipRoleEnum("role").notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("vault_membership_vault_user_idx").on(table.vaultId, table.userId),
    index("vault_membership_user_id_idx").on(table.userId),
    index("vault_membership_vault_id_idx").on(table.vaultId),
  ],
);

export const vaultInvitation = pgTable(
  "vault_invitation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vaultId: uuid("vault_id")
      .notNull()
      .references(() => vault.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: vaultMembershipRoleEnum("role").notNull().default("member"),
    status: vaultInvitationStatusEnum("status").notNull().default("pending"),
    invitedByUserId: text("invited_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("vault_invitation_vault_email_pending_idx")
      .on(table.vaultId, table.email)
      .where(sql`${table.status} = 'pending'`),
    index("vault_invitation_vault_id_idx").on(table.vaultId),
    index("vault_invitation_email_idx").on(table.email),
    index("vault_invitation_status_idx").on(table.status),
  ],
);

// -- relations --

export const vaultRelations = relations(vault, ({ many }) => ({
  memberships: many(vaultMembership),
  invitations: many(vaultInvitation),
  skills: many(skill),
}));

export const vaultMembershipRelations = relations(vaultMembership, ({ one }) => ({
  vault: one(vault, {
    fields: [vaultMembership.vaultId],
    references: [vault.id],
  }),
  user: one(user, {
    fields: [vaultMembership.userId],
    references: [user.id],
  }),
}));

export const vaultInvitationRelations = relations(vaultInvitation, ({ one }) => ({
  vault: one(vault, {
    fields: [vaultInvitation.vaultId],
    references: [vault.id],
  }),
  invitedBy: one(user, {
    fields: [vaultInvitation.invitedByUserId],
    references: [user.id],
  }),
}));
