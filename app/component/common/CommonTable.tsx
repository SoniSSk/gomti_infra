"use client";

import { formatDate } from "@/app/utils/formatDate";
import React from "react";

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface CommonTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export default function CommonTable<T>({
  columns,
  data,
  onRowClick,
  loading = false,
  emptyMessage = "No Data Found",
}: CommonTableProps<T>) {
  // =====================================
  // TOTAL NET WEIGHT
  // =====================================

  const totalQuantity = data.reduce(
    (total, row) => {
      const value = row[
        "netWeight" as keyof T
      ];

      const quantity = Number(value);

      return (
        total +
        (Number.isNaN(quantity)
          ? 0
          : quantity)
      );
    },
    0,
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-nowrap">
        {/* =====================================
            HEADER
        ===================================== */}

        <thead>
          <tr className="bg-orange-500 text-white">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-4 py-3 text-left text-sm font-semibold"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* =====================================
            BODY
        ===================================== */}

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-gray-500"
              >
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={index}
                onClick={() =>
                  onRowClick?.(row)
                }
                className={`border-b transition hover:bg-orange-50 ${onRowClick
                    ? "cursor-pointer"
                    : ""
                  }`}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-4 py-3 text-sm text-gray-700"
                  >
                    {column.render
                      ? column.render(row)
                      : column.key ===
                        "dateTime"
                        ? formatDate(
                          String(
                            row[
                            column.key as keyof T
                            ],
                          ),
                        )
                        : column.key ===
                          "sno"
                          ? index + 1
                          : String(
                            row[
                            column.key as keyof T
                            ] ?? "",
                          )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>

        {/* =====================================
            TOTAL FOOTER
        ===================================== */}

        {!loading &&
          data.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-orange-300 bg-orange-50">
                {columns.map((column) => {
                  const key =
                    String(
                      column.key,
                    );

                  // S.No column
                  if (key === "sno") {
                    return (
                      <td
                        key={key}
                        className="px-4 py-3 text-sm font-bold text-gray-700"
                      >
                        Total
                      </td>
                    );
                  }

                  // Net Weight column
                  if (
                    key ===
                    "netWeight"
                  ) {
                    return (
                      <td
                        key={key}
                        className="px-4 py-3 text-sm font-bold text-orange-600"
                      >
                        {totalQuantity.toFixed(
                          2,
                        )}{" "}
                        MT
                      </td>
                    );
                  }

                  // All other columns
                  return (
                    <td
                      key={key}
                      className="px-4 py-3"
                    />
                  );
                })}
              </tr>
            </tfoot>
          )}
      </table>
    </div>
  );
}