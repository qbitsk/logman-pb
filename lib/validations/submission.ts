import { z } from "zod";

export const submissionSchema = z.object({
  workCategoryId: z.string().min(1, "Please select a category"),
  notes: z.string().max(500, "Notes must be under 500 characters").optional(),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
