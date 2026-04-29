import { z } from "zod";

export const submissionSchema = z.object({
  category: z.enum(["general", "technical", "financial", "hr", "other"], {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),
  notes: z.string().max(500, "Notes must be under 500 characters").optional(),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
