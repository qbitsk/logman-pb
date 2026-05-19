import { z } from "zod";

export const workerProductionDefectSchema = z.object({
  productionDefectId: z.string().min(1, "Please select a defect"),
  units: z.number().int().positive("Units must be a positive number"),
});

export const workerProductionSchema = z.object({
  productionPartId: z.string().min(1, "Please select a product"),
  productionStationId: z.string().optional().nullable(),
  units: z.number().int().positive("Units must be a positive number").optional().nullable(),
  shift: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().nullable(),
  notes: z.string().max(500, "Notes must be under 500 characters").optional(),
  workerProductionDefects: z.array(workerProductionDefectSchema).optional(),
});

export type WorkerProductionInput = z.infer<typeof workerProductionSchema>;
export type WorkerProductionDefectInput = z.infer<typeof workerProductionDefectSchema>;
