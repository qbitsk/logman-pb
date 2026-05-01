import ExcelJS from "exceljs";
import type { Submission } from "@/lib/db/schema";

export async function generateSubmissionsExcel(
  submissions: (Omit<Submission, "workCategoryId"> & { workCategoryId: string; userName: string; userEmail: string })[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "My App";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Submissions");

  // Column definitions
  sheet.columns = [
    { header: "ID", key: "id", width: 38 },
    { header: "Category", key: "workCategoryId", width: 38 },
    { header: "Status", key: "status", width: 12 },
    { header: "Submitted By", key: "userName", width: 20 },
    { header: "Email", key: "userEmail", width: 30 },
    { header: "Notes", key: "notes", width: 30 },
    { header: "Created At", key: "createdAt", width: 20 },
    { header: "Updated At", key: "updatedAt", width: 20 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F52E5" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 22;

  // Add data rows
  submissions.forEach((submission) => {
    sheet.addRow({
      ...submission,
      createdAt: submission.createdAt?.toISOString().split("T")[0],
      updatedAt: submission.updatedAt?.toISOString().split("T")[0],
    });
  });

  // Alternate row colours for readability
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const fill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: rowNumber % 2 === 0 ? "FFF0F4FF" : "FFFFFFFF" },
    };
    row.eachCell((cell) => {
      cell.fill = fill;
      cell.alignment = { vertical: "middle", wrapText: true };
    });
  });

  // Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

type DefectRow = {
  submissionId: string;
  componentName: string;
  defectCategoryName: string;
  units: number;
};

type SubmissionCSVRow = {
  id: string;
  workProductName: string;
  workStationName: string;
  units: number | null;
  shift: number | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  userName: string;
};

export async function generateSubmissionsCSV(
  submissions: SubmissionCSVRow[],
  defects: DefectRow[] = []
): Promise<string> {
  const escape = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build pivot: submissionId -> { columnKey -> units }
  const defectPivot = new Map<string, Map<string, number>>();
  const defectColumns = new Set<string>();

  for (const d of defects) {
    const colKey = `${d.componentName} - ${d.defectCategoryName}`;
    defectColumns.add(colKey);
    if (!defectPivot.has(d.submissionId)) {
      defectPivot.set(d.submissionId, new Map());
    }
    defectPivot.get(d.submissionId)!.set(colKey, d.units);
  }

  const sortedDefectCols = [...defectColumns].sort();

  const baseHeaders = [
    "ID",
    "Work Product",
    "Work Station",
    "Units",
    "Shift",
    "Status",
    "User",
    "Notes",
    "Created At",
  ];

  const allHeaders = [...baseHeaders, ...sortedDefectCols];

  const rows = submissions.map((s) => {
    const submissionDefects = defectPivot.get(s.id) ?? new Map<string, number>();
    const defectValues = sortedDefectCols.map((col) => submissionDefects.get(col) ?? "");
    return [
      s.id,
      s.workProductName,
      s.workStationName,
      s.units ?? "",
      s.shift ?? "",
      s.status,
      s.userName,
      s.notes ?? "",
      s.createdAt?.toISOString() ?? "",
      ...defectValues,
    ]
      .map(escape)
      .join(",");
  });

  return [allHeaders.join(","), ...rows].join("\n");
}
