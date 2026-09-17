import { z } from "zod";
import { NoticePriority, EventStatus } from "@prisma/client";

// Admin Authentication Schema
export const adminLoginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Username or email must be at least 3 characters")
    .max(255, "Identifier too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
});

// Notice Schema
export const noticeSchema = z.object({
  id: z.string().uuid().optional(),
  titleHi: z.string().trim().min(3, "Hindi title required (min 3 chars)").max(255),
  titleEn: z.string().trim().min(3, "English title required (min 3 chars)").max(255),
  bodyHi: z.string().trim().min(10, "Hindi body required (min 10 chars)").max(10000),
  bodyEn: z.string().trim().min(10, "English body required (min 10 chars)").max(10000),
  priority: z.nativeEnum(NoticePriority).default(NoticePriority.NORMAL),
  isPinned: z.boolean().default(false),
  isActive: z.boolean().default(true),
  publishedAt: z.coerce.date().default(() => new Date()),
  expiresAt: z.coerce.date().nullable().optional(),
});

// Event Schema
export const eventSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  titleHi: z.string().trim().min(3).max(255),
  titleEn: z.string().trim().min(3).max(255),
  descriptionHi: z.string().trim().min(10).max(10000),
  descriptionEn: z.string().trim().min(10).max(10000),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  locationHi: z.string().trim().max(255).optional().nullable(),
  locationEn: z.string().trim().max(255).optional().nullable(),
  bannerImage: z.string().trim().max(500).optional().nullable(),
  isFeatured: z.boolean().default(false),
  status: z.nativeEnum(EventStatus).default(EventStatus.UPCOMING),
});

// Service Schema (Darshan, Aarti, Pooja, Seva)
export const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  titleHi: z.string().trim().min(2).max(255),
  titleEn: z.string().trim().min(2).max(255),
  descriptionHi: z.string().trim().min(10).max(5000),
  descriptionEn: z.string().trim().min(10).max(5000),
  timingHi: z.string().trim().max(255).optional().nullable(),
  timingEn: z.string().trim().max(255).optional().nullable(),
  guidelinesHi: z.string().trim().max(5000).optional().nullable(),
  guidelinesEn: z.string().trim().max(5000).optional().nullable(),
  capacity: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

// Gallery Category & Item Schemas
export const galleryCategorySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  nameHi: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().min(2).max(120),
  sortOrder: z.coerce.number().int().default(0),
});

export const galleryItemSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid("Valid category ID required"),
  titleHi: z.string().trim().max(255).optional().nullable(),
  titleEn: z.string().trim().max(255).optional().nullable(),
  fileUrl: z.string().trim().max(500),
  fileKey: z.string().trim().max(255),
  mimeType: z.string().trim().max(100),
  sizeBytes: z.coerce.number().int().min(1),
  width: z.coerce.number().int().optional().nullable(),
  height: z.coerce.number().int().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isFeatured: z.boolean().default(false),
});

// FAQ Schema
export const faqSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.string().trim().min(2).max(80),
  questionHi: z.string().trim().min(5).max(300),
  questionEn: z.string().trim().min(5).max(300),
  answerHi: z.string().trim().min(10).max(5000),
  answerEn: z.string().trim().min(10).max(5000),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

// Page Section Schema
export const pageSectionSchema = z.object({
  id: z.string().uuid().optional(),
  pageId: z.string().uuid(),
  sectionKey: z.string().trim().min(2).max(100),
  titleHi: z.string().trim().max(255).optional().nullable(),
  titleEn: z.string().trim().max(255).optional().nullable(),
  subtitleHi: z.string().trim().max(255).optional().nullable(),
  subtitleEn: z.string().trim().max(255).optional().nullable(),
  contentHi: z.string().trim().optional().nullable(),
  contentEn: z.string().trim().optional().nullable(),
  mediaUrl: z.string().trim().max(500).optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  metadata: z.record(z.unknown()).optional().nullable(),
});

// Site Settings Schema
export const siteSettingSchema = z.object({
  key: z.string().trim().min(2).max(100),
  value: z.string(),
  description: z.string().max(255).optional().nullable(),
  isPublic: z.boolean().default(true),
});

// SEO Metadata Schema
export const seoMetadataSchema = z.object({
  path: z.string().trim().min(1).max(255),
  titleHi: z.string().trim().min(3).max(255),
  titleEn: z.string().trim().min(3).max(255),
  metaDescHi: z.string().trim().min(10).max(500),
  metaDescEn: z.string().trim().min(10).max(500),
  ogImage: z.string().trim().max(500).optional().nullable(),
  canonicalUrl: z.string().trim().max(500).optional().nullable(),
});
