/**
 * Drizzle schema for the ESA Campus Platform.
 *
 * Mirrors §05 "Data model" of the architecture spec. Grouped the same way the
 * spec groups it: identity & academic structure, Badge & clubs, events,
 * timetable & resources, notifications.
 *
 * Two ideas baked into this schema on purpose (spec §02):
 *  - Every verified student is an ESA member automatically. There is no
 *    "membership" row required just to exist in the system.
 *  - The `badges` table is the *paid* incentive tier. `users.role` values
 *    above "student" are only meant to be granted to a user whose badge
 *    status is "active" — enforced in application code (see apps/web),
 *    not by a DB constraint, since a badge can lapse without deleting the role.
 */
import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  boolean,
  timestamp,
  date,
  time,
  smallint,
  bigint,
  pgEnum,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRoleEnum = pgEnum("user_role", [
  "student",
  "class_rep",
  "club_admin",
  "esa_admin",
  "super_admin",
]);

export const badgeStatusEnum = pgEnum("badge_status", [
  "pending_verification",
  "active",
  "expired",
  "rejected",
]);

export const clubAdminLevelEnum = pgEnum("club_admin_level", ["owner", "editor"]);

export const subscriptionSubjectEnum = pgEnum("subscription_subject", [
  "club",
  "course",
  "cohort",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "push",
  "in_app",
  "both",
]);

export const resourceTypeEnum = pgEnum("resource_type", [
  "past_paper",
  "notes",
  "slides",
  "other",
]);

export const examTypeEnum = pgEnum("exam_type", [
  "cat_1",
  "cat_2",
  "main_exam",
  "assignment",
]);

export const resourceStatusEnum = pgEnum("resource_status", ["pending", "approved"]);

// ---------------------------------------------------------------------------
// Identity & academic structure
// ---------------------------------------------------------------------------

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cohorts = pgTable(
  "cohorts",
  {
    id: serial("id").primaryKey(),
    departmentId: integer("department_id")
      .references(() => departments.id, { onDelete: "cascade" })
      .notNull(),
    entryYear: smallint("entry_year").notNull(),
    label: varchar("label", { length: 120 }).notNull(), // e.g. "Mechanical · Year 3 · 2026"
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    deptYearIdx: uniqueIndex("cohorts_department_id_entry_year_idx").on(
      t.departmentId,
      t.entryYear,
    ),
  }),
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  photoBlobUrl: text("photo_blob_url"),
  regNo: varchar("reg_no", { length: 30 }).unique(), // e.g. "ENG-123-4567/2023" — set during profile completion
  departmentId: integer("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),
  cohortId: integer("cohort_id").references(() => cohorts.id, { onDelete: "set null" }),
  role: userRoleEnum("role").notNull().default("student"),

  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  verificationToken: text("verification_token"),
  verificationTokenExpiresAt: timestamp("verification_token_expires_at", {
    withTimezone: true,
  }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Badge & clubs
// ---------------------------------------------------------------------------

export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  description: text("description"),
  logoBlobUrl: text("logo_blob_url"),
  category: varchar("category", { length: 80 }),
  // Level 1 (spec §06): always shown, links out to the club's own site/socials.
  externalUrl: text("external_url"),
  // ESA itself — the one club that can issue Badges and manage departments.
  isPlatformOwner: boolean("is_platform_owner").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clubAdmins = pgTable(
  "club_admins",
  {
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    clubId: integer("club_id")
      .references(() => clubs.id, { onDelete: "cascade" })
      .notNull(),
    level: clubAdminLevelEnum("level").notNull().default("editor"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.clubId] }),
  }),
);

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  badgeNumber: varchar("badge_number", { length: 20 }).unique(), // assigned on approval
  status: badgeStatusEnum("status").notNull().default("pending_verification"),
  paymentReference: varchar("payment_reference", { length: 40 }).notNull(), // pasted M-Pesa code
  academicYear: varchar("academic_year", { length: 9 }), // e.g. "2025/2026"
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Members who already hold a physical/pre-platform ESA Badge (existing membership
 * cards, numbered before this system existed). Recorded here from the card so the
 * number is never reissued; an admin links the row to the member's real account
 * once they sign up, which instantly activates their badge with the same number.
 */
export const legacyMembers = pgTable("legacy_members", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  badgeNumber: varchar("badge_number", { length: 20 }).notNull().unique(), // e.g. "ESA-1330", from their card
  regNo: varchar("reg_no", { length: 30 }),
  notes: text("notes"),
  // Scan of their physical/Canva membership card — shown on their profile once
  // this roster row is linked to their real account (see the /match route).
  cardImageUrl: text("card_image_url"),
  matchedUserId: integer("matched_user_id").references(() => users.id, { onDelete: "set null" }),
  matchedAt: timestamp("matched_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Events & subscriptions
// ---------------------------------------------------------------------------

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id")
    .references(() => clubs.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 200 }),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }),
  coverImageBlobUrl: text("cover_image_blob_url"),
  registrationUrl: text("registration_url"),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdBy: integer("created_by")
    .references(() => users.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Generic "follow" table (spec §05): following a club's events and following
 * a course's or cohort's timetable/resources are the same shape.
 * `subjectId` points at clubs.id, courses.id, or cohorts.id depending on
 * `subjectType` — no FK constraint here since it's polymorphic; integrity is
 * enforced in application code.
 */
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    subjectType: subscriptionSubjectEnum("subject_type").notNull(),
    subjectId: integer("subject_id").notNull(),
    channel: notificationChannelEnum("channel").notNull().default("both"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueSub: uniqueIndex("subscriptions_user_subject_idx").on(
      t.userId,
      t.subjectType,
      t.subjectId,
    ),
  }),
);

// ---------------------------------------------------------------------------
// Timetable & resources
// ---------------------------------------------------------------------------

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id")
    .references(() => departments.id, { onDelete: "cascade" })
    .notNull(),
  code: varchar("code", { length: 20 }).notNull(), // e.g. "EEE 301"
  name: varchar("name", { length: 160 }).notNull(), // e.g. "Control Systems"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const timetableEntries = pgTable("timetable_entries", {
  id: serial("id").primaryKey(),
  cohortId: integer("cohort_id")
    .references(() => cohorts.id, { onDelete: "cascade" })
    .notNull(),
  courseId: integer("course_id")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
  dayOfWeek: smallint("day_of_week").notNull(), // 0 = Monday .. 6 = Sunday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  venue: varchar("venue", { length: 120 }),
  lecturerName: varchar("lecturer_name", { length: 120 }),
  semesterLabel: varchar("semester_label", { length: 40 }), // e.g. "2026 Sem 1"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  type: resourceTypeEnum("type").notNull(),
  departmentId: integer("department_id")
    .references(() => departments.id, { onDelete: "cascade" })
    .notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  academicYear: varchar("academic_year", { length: 9 }), // e.g. "2025/2026"
  examType: examTypeEnum("exam_type"),
  title: varchar("title", { length: 200 }).notNull(),
  blobUrl: text("blob_url").notNull(),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  uploadedBy: integer("uploaded_by")
    .references(() => users.id, { onDelete: "set null" }),
  status: resourceStatusEnum("status").notNull().default("pending"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notificationsLog = pgTable("notifications_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 40 }).notNull(), // e.g. "class_reminder", "event_reminder"
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body"),
  link: text("link"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Relations (used by Drizzle's relational query API — db.query.users.findFirst etc.)
// ---------------------------------------------------------------------------

export const departmentsRelations = relations(departments, ({ many }) => ({
  cohorts: many(cohorts),
  courses: many(courses),
  users: many(users),
  resources: many(resources),
}));

export const cohortsRelations = relations(cohorts, ({ one, many }) => ({
  department: one(departments, {
    fields: [cohorts.departmentId],
    references: [departments.id],
  }),
  users: many(users),
  timetableEntries: many(timetableEntries),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  cohort: one(cohorts, { fields: [users.cohortId], references: [cohorts.id] }),
  badges: many(badges),
  clubAdminships: many(clubAdmins),
  subscriptions: many(subscriptions),
  pushSubscriptions: many(pushSubscriptions),
  notifications: many(notificationsLog),
}));

export const clubsRelations = relations(clubs, ({ many }) => ({
  admins: many(clubAdmins),
  events: many(events),
}));

export const clubAdminsRelations = relations(clubAdmins, ({ one }) => ({
  user: one(users, { fields: [clubAdmins.userId], references: [users.id] }),
  club: one(clubs, { fields: [clubAdmins.clubId], references: [clubs.id] }),
}));

export const badgesRelations = relations(badges, ({ one }) => ({
  user: one(users, { fields: [badges.userId], references: [users.id] }),
  approver: one(users, { fields: [badges.approvedBy], references: [users.id] }),
}));

export const legacyMembersRelations = relations(legacyMembers, ({ one }) => ({
  matchedUser: one(users, { fields: [legacyMembers.matchedUserId], references: [users.id] }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  club: one(clubs, { fields: [events.clubId], references: [clubs.id] }),
  creator: one(users, { fields: [events.createdBy], references: [users.id] }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  department: one(departments, {
    fields: [courses.departmentId],
    references: [departments.id],
  }),
  timetableEntries: many(timetableEntries),
  resources: many(resources),
}));

export const timetableEntriesRelations = relations(timetableEntries, ({ one }) => ({
  cohort: one(cohorts, { fields: [timetableEntries.cohortId], references: [cohorts.id] }),
  course: one(courses, { fields: [timetableEntries.courseId], references: [courses.id] }),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  department: one(departments, {
    fields: [resources.departmentId],
    references: [departments.id],
  }),
  course: one(courses, { fields: [resources.courseId], references: [courses.id] }),
  uploader: one(users, { fields: [resources.uploadedBy], references: [users.id] }),
}));
