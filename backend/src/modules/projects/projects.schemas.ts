import { z } from "zod";
import { currencies, projectStatuses } from "../../types/domain.js";
import { paginationSchema } from "../../shared/pagination.js";
import { nullableDate, nullableText, optionalDate, optionalText } from "../../shared/validation.js";

export const listProjectsSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  clientId: z.string().min(1).optional(),
  status: z.enum(projectStatuses).optional(),
  currency: z.enum(currencies).optional(),
  responsible: z.string().trim().optional()
});

export const projectParamsSchema = z.object({
  id: z.string().min(1)
});

export const createProjectSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().trim().min(2).max(160),
  description: optionalText,
  status: z.enum(projectStatuses).default("pendiente"),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  budget: z.coerce.number().min(0),
  paid: z.coerce.number().min(0).default(0),
  expenses: z.coerce.number().min(0).default(0),
  currency: z.enum(currencies).default("ARS"),
  responsible: optionalText,
  technologies: optionalText,
  links: optionalText,
  notes: optionalText,
  startsAt: optionalDate,
  dueAt: optionalDate,
  deliveredAt: optionalDate
});

export const updateProjectSchema = z.object({
  clientId: z.string().min(1).optional(),
  name: z.string().trim().min(2).max(160).optional(),
  description: nullableText.optional(),
  status: z.enum(projectStatuses).optional(),
  progress: z.coerce.number().int().min(0).max(100).optional(),
  budget: z.coerce.number().min(0).optional(),
  paid: z.coerce.number().min(0).optional(),
  expenses: z.coerce.number().min(0).optional(),
  currency: z.enum(currencies).optional(),
  responsible: nullableText.optional(),
  technologies: nullableText.optional(),
  links: nullableText.optional(),
  notes: nullableText.optional(),
  startsAt: nullableDate.optional(),
  dueAt: nullableDate.optional(),
  deliveredAt: nullableDate.optional()
});
