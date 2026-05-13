import { z } from "zod";
import { clientStatuses, currencies, priorities } from "../../types/domain.js";
import { paginationSchema } from "../../shared/pagination.js";
import { nullableDate, nullableText, nullableUrl, optionalDate, optionalText, optionalUrl } from "../../shared/validation.js";

export const listClientsSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  status: z.enum(clientStatuses).optional(),
  priority: z.enum(priorities).optional(),
  currency: z.enum(currencies).optional()
});

export const clientParamsSchema = z.object({
  id: z.string().min(1)
});

export const createClientSchema = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(160),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(3).max(80),
  address: optionalText,
  socials: optionalText,
  website: optionalUrl,
  service: z.string().trim().min(2).max(160),
  agreedPrice: z.coerce.number().min(0),
  currency: z.enum(currencies).default("ARS"),
  status: z.enum(clientStatuses).default("lead"),
  priority: z.enum(priorities).default("media"),
  firstContact: optionalDate,
  lastContact: optionalDate,
  startDate: optionalDate,
  observations: optionalText
});

export const updateClientSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  company: z.string().trim().min(2).max(160).optional(),
  email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
  phone: z.string().trim().min(3).max(80).optional(),
  address: nullableText.optional(),
  socials: nullableText.optional(),
  website: nullableUrl.optional(),
  service: z.string().trim().min(2).max(160).optional(),
  agreedPrice: z.coerce.number().min(0).optional(),
  currency: z.enum(currencies).optional(),
  status: z.enum(clientStatuses).optional(),
  priority: z.enum(priorities).optional(),
  firstContact: nullableDate.optional(),
  lastContact: nullableDate.optional(),
  startDate: nullableDate.optional(),
  observations: nullableText.optional()
});
