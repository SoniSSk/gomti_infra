"use client";

interface Column {
  key: string;
  label: string;
}

interface AppTableProps {
  columns: Column[];
  data: Record<string, any>[];
}

export default function AppTable({ columns, data }: AppTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-orange-500 text-white">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left font-semibold"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr
                key={index}
                className="border-b hover:bg-orange-50 transition"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-gray-500"
              >
                No Data Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
