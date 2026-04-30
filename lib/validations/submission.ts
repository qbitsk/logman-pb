import { z } from "zod";

export const workDefectSchema = z.object({
  type: z.enum(["component", "unit"]),
  workComponentId: z.string().optional(),
  categoryId: z.string().optional(),
  units: z.number().int().positive("Units must be a positive number"),
});

export const submissionSchema = z.object({
  workCategoryId: z.string().min(1, "Please select a category"),
  workStationId: z.string().optional().nullable(),
  units: z.number().int().positive("Units must be a positive number").optional().nullable(),
  shift: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().nullable(),
  notes: z.string().max(500, "Notes must be under 500 characters").optional(),
  workDefects: z.array(workDefectSchema).optional(),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
export type WorkDefectInput = z.infer<typeof workDefectSchema>;
