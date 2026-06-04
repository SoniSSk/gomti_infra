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
  console.log(data, "data");

  // udate date by formateDate
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full">
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
                onClick={() => onRowClick?.(row)}
                className={`border-b hover:bg-orange-50 transition ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-4 py-3 text-sm text-gray-700"
                  >
                    {column.render
                      ? column.render(row)
                      : column.key === "dateTime"
                        ? formatDate(String(row[column.key as keyof T]))
                        : column.key === "sno"
                          ? ++index
                          : String(row[column.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
