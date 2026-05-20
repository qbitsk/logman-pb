type DefectRow = {
  submissionId: string;
  componentName: string;
  defectName: string;
  defectType: string;
  units: number;
};

type ProductionCSVRow = {
  id: string;
  processName: string;
  productionPartName: string;
  workStationName: string;
  units: number | null;
  shift: number | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  userName: string;
};

export async function generateProductionsCSV(
  productions: ProductionCSVRow[],
  defects: DefectRow[] = [],
  delimiter: "," | ";" = ","
): Promise<string> {
  const escape = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(delimiter) || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build pivot: submissionId -> { columnKey -> units }
  const defectPivot = new Map<string, Map<string, number>>();
  const defectColumns = new Set<string>();

  for (const d of defects) {
    const colKey = d.defectType === "component"
      ? `${d.componentName} - ${d.defectName}`
      : d.defectName;
    defectColumns.add(colKey);
    if (!defectPivot.has(d.submissionId)) {
      defectPivot.set(d.submissionId, new Map());
    }
    defectPivot.get(d.submissionId)!.set(colKey, d.units);
  }

  const sortedDefectCols = [...defectColumns].sort();

  const baseHeaders = [
    "ID",
    "Process",
    "Part",
    "Station",
    "Units",
    "Shift",
    "Status",
    "User",
    "Notes",
    "Created At",
  ];

  const allHeaders = [...baseHeaders, ...sortedDefectCols];

  const rows = productions.map((s) => {
    const productionDefects = defectPivot.get(s.id) ?? new Map<string, number>();
    const defectValues = sortedDefectCols.map((col) => productionDefects.get(col) ?? "");
    return [
      s.id,
      s.processName,
      s.productionPartName,
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
      .join(delimiter);
  });

  return [allHeaders.join(delimiter), ...rows].join("\n");
}
