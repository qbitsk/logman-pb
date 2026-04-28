import { z } from "zod";

export const submissionSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be under 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be under 2000 characters"),
  category: z.enum(["general", "technical", "financial", "hr", "other"], {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),
  notes: z.string().max(500, "Notes must be under 500 characters").optional(),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
