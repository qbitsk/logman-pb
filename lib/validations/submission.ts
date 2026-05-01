import { z } from "zod";

export const workSubmissionDefectSchema = z.object({
  workDefectId: z.string().min(1, "Please select a defect"),
  units: z.number().int().positive("Units must be a positive number"),
});

export const submissionSchema = z.object({
  workProductId: z.string().min(1, "Please select a product"),
  workStationId: z.string().optional().nullable(),
  units: z.number().int().positive("Units must be a positive number").optional().nullable(),
  shift: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().nullable(),
  notes: z.string().max(500, "Notes must be under 500 characters").optional(),
  workSubmissionDefects: z.array(workSubmissionDefectSchema).optional(),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
export type WorkSubmissionDefectInput = z.infer<typeof workSubmissionDefectSchema>;
