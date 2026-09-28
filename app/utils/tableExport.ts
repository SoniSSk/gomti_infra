/* =========================================================
   TABLE EXPORT

   CSV is built by hand; Excel (exceljs) and PDF (jspdf)
   are imported on demand so they stay out of the main
   bundle until someone actually exports.
========================================================= */

export type ExportFormat = "csv" | "excel" | "pdf";

export type ExportCell = string | number;

export interface ExportColumn<T> {
    label: string;
    value: (row: T) => ExportCell | null | undefined;
}

export interface ExportOptions<T> {
    columns: ExportColumn<T>[];
    rows: T[];
    /** File name without extension. */
    fileName: string;
    /** Heading printed on the PDF. Defaults to fileName. */
    title?: string;
}

const toMatrix = <T>(
    columns: ExportColumn<T>[],
    rows: T[],
): ExportCell[][] =>
    rows.map((row) =>
        columns.map((column) => column.value(row) ?? ""),
    );

const timestamp = (): string => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");

    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
};

const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
};

/* ================= CSV ================= */

const escapeCsv = (value: ExportCell): string => {
    let text = String(value);

    // Stop spreadsheet apps from evaluating cells as formulas.
    if (/^[=+\-@\t\r]/.test(text) && typeof value !== "number") {
        text = `'${text}`;
    }

    return /[",\r\n]/.test(text)
        ? `"${text.replace(/"/g, '""')}"`
        : text;
};

const exportCsv = <T>({ columns, rows, fileName }: ExportOptions<T>) => {
    const lines = [
        columns.map((column) => escapeCsv(column.label)),
        ...toMatrix(columns, rows).map((cells) => cells.map(escapeCsv)),
    ].map((cells) => cells.join(","));

    // BOM so Excel opens UTF-8 correctly.
    const blob = new Blob(["﻿" + lines.join("\r\n")], {
        type: "text/csv;charset=utf-8",
    });

    downloadBlob(blob, `${fileName}_${timestamp()}.csv`);
};

/* ================= EXCEL ================= */

const exportExcel = async <T>({ columns, rows, fileName, title }: ExportOptions<T>) => {
    const { default: ExcelJS } = await import("exceljs");

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet((title ?? "Data").slice(0, 31));
    const matrix = toMatrix(columns, rows);

    sheet.columns = columns.map((column, index) => ({
        header: column.label,
        width: Math.min(
            50,
            Math.max(
                column.label.length,
                ...matrix.map((cells) => String(cells[index]).length),
            ) + 2,
        ),
    }));

    sheet.addRows(matrix);

    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEA580C" },
    };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();

    downloadBlob(
        new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `${fileName}_${timestamp()}.xlsx`,
    );
};

/* ================= PDF ================= */

const exportPdf = async <T>({ columns, rows, fileName, title }: ExportOptions<T>) => {
    const [{ jsPDF }, { autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
    ]);

    const doc = new jsPDF({
        orientation: columns.length > 6 ? "landscape" : "portrait",
        unit: "pt",
        format: "a4",
    });

    doc.setFontSize(14);
    doc.text(title ?? fileName, 40, 40);
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(
        `${rows.length} records · Exported ${new Date().toLocaleString("en-IN")}`,
        40,
        56,
    );

    autoTable(doc, {
        startY: 70,
        head: [columns.map((column) => column.label)],
        body: toMatrix(columns, rows).map((cells) => cells.map(String)),
        styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
        headStyles: { fillColor: [234, 88, 12], textColor: 255 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 40, right: 40 },
    });

    doc.save(`${fileName}_${timestamp()}.pdf`);
};

/* ================= ENTRY ================= */

export const exportTable = async <T>(
    format: ExportFormat,
    options: ExportOptions<T>,
): Promise<void> => {
    if (format === "csv") {
        exportCsv(options);
    } else if (format === "excel") {
        await exportExcel(options);
    } else {
        await exportPdf(options);
    }
};
