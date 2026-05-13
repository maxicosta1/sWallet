import { z } from "zod";

export const optionalText = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.string().trim().min(1).optional()
);

export const nullableText = z.preprocess(
  (value) => value === "" || value === undefined ? null : value,
  z.string().trim().min(1).nullable()
);

export const optionalDate = z.preprocess(
  (value) => value === "" || value === null || value === undefined ? undefined : value,
  z.coerce.date().optional()
);

export const nullableDate = z.preprocess(
  (value) => value === "" || value === undefined ? null : value,
  z.coerce.date().nullable()
);

export const optionalUrl = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.string().trim().url().optional()
);

export const nullableUrl = z.preprocess(
  (value) => value === "" || value === undefined ? null : value,
  z.string().trim().url().nullable()
);
