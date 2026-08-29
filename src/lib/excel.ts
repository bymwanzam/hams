import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

// Shared plumbing for the Reports module's "Export to Excel" links (see
// reports/opd/export/route.ts and reports/inpatient/export/route.ts).
//
// Sheets use flat, single-row headers (e.g. "Insured New Male") rather than
// the merged, multi-row headers the printed/on-screen report uses — the
// data is identical, but a flat header is what makes the sheet sortable,
// filterable and pivot-table-friendly once it's open in Excel, which is
// the point of exporting it rather than just printing the page.
export interface ExcelSheetSpec {
  name: string;
  /** Lines shown above the header row — facility name, report title, date range, etc. */
  titleLines: string[];
  columns: { header: string; width?: number }[];
  rows: (string | number)[][];
  /** Rendered bold with a top border, e.g. a grand-total row. */
  totalRow?: (string | number)[];
}

export async function buildWorkbook(sheets: ExcelSheetSpec[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  for (const spec of sheets) {
    const sheet = workbook.addWorksheet(spec.name);
    const columnCount = spec.columns.length;

    spec.titleLines.forEach((line, i) => {
      const row = sheet.getRow(i + 1);
      row.getCell(1).value = line;
      row.getCell(1).font = { bold: i === 0, size: i === 0 ? 13 : 10 };
      sheet.mergeCells(i + 1, 1, i + 1, columnCount);
    });

    const headerRowNumber = spec.titleLines.length + 2; // one blank row before it
    const headerRow = sheet.getRow(headerRowNumber);
    spec.columns.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.header;
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2E8F0" }, // slate-200, matching the on-screen table
      };
      cell.border = THIN_BORDER;
      sheet.getColumn(i + 1).width = col.width ?? 14;
    });

    for (const row of spec.rows) {
      const excelRow = sheet.addRow(row);
      excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = THIN_BORDER;
        if (colNumber > 1) cell.alignment = { horizontal: "center" };
      });
    }

    if (spec.totalRow) {
      const excelRow = sheet.addRow(spec.totalRow);
      excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = THIN_BORDER;
        cell.font = { bold: true };
        if (colNumber > 1) cell.alignment = { horizontal: "center" };
      });
    }

    sheet.views = [{ state: "frozen", ySplit: headerRowNumber }];
  }

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFCBD5E1" } },
  bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
  left: { style: "thin", color: { argb: "FFCBD5E1" } },
  right: { style: "thin", color: { argb: "FFCBD5E1" } },
};

export async function excelFileResponse(
  sheets: ExcelSheetSpec[],
  filename: string
): Promise<NextResponse> {
  const buffer = await buildWorkbook(sheets);
  // NextResponse's BodyInit typing doesn't include Node's Buffer, even
  // though it's a valid Uint8Array at runtime — view it as one for TS.
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
