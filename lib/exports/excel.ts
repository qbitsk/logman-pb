import ExcelJS from "exceljs";
import type { Submission } from "@/lib/db/schema";

export async function generateSubmissionsExcel(
  submissions: (Submission & { userName: string; userEmail: string })[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "My App";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Submissions");

  // Column definitions
  sheet.columns = [
    { header: "ID", key: "id", width: 38 },
    { header: "Title", key: "title", width: 30 },
    { header: "Category", key: "category", width: 15 },
    { header: "Status", key: "status", width: 12 },
    { header: "Submitted By", key: "userName", width: 20 },
    { header: "Email", key: "userEmail", width: 30 },
    { header: "Description", key: "description", width: 40 },
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

export async function generateSubmissionsCSV(
  submissions: (Submission & { userName: string; userEmail: string })[]
): Promise<string> {
  const headers = [
    "ID",
    "Title",
    "Category",
    "Status",
    "Submitted By",
    "Email",
    "Description",
    "Notes",
    "Created At",
  ];

  const escape = (val: string | null | undefined) => {
    if (!val) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = submissions.map((s) =>
    [
      s.id,
      s.title,
      s.category,
      s.status,
      s.userName,
      s.userEmail,
      s.description,
      s.notes ?? "",
      s.createdAt?.toISOString() ?? "",
    ]
      .map(escape)
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
