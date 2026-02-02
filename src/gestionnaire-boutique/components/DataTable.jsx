// ==========================================================
// 📋 DataTable.jsx — Tableau CRUD universel (LPD Manager)
// Colonnes dynamiques, design premium et actions personnalisables
// ==========================================================

import React from "react";
// framer-motion removed to avoid optional peer dep on react/jsx-runtime in dev

export default function DataTable({
  columns = [],
  data = [],
  actions = [],
  onRowClick,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-xs font-semibold">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 text-left whitespace-nowrap">
                {col.label}
              </th>
            ))}
            {actions.length > 0 && (
              <th className="px-4 py-3 text-center">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length ? (
            data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick && onRowClick(row)}
                className="border-b border-gray-100 hover:bg-[#F9F9FF] transition cursor-default"
              >
                {columns.map((col, j) => (
                  <td
                    key={j}
                    className={`px-4 py-3 ${
                      j === 0 ? "font-medium text-gray-800" : "text-gray-600"
                    }`}
                  >
                    {col.render 
                      ? col.render(row[col.key], row) 
                      : typeof row[col.key] === 'object' && row[col.key] !== null
                      ? JSON.stringify(row[col.key])
                      : row[col.key] ?? '-'
                    }
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {actions.map((action, k) => (
                        <button
                          key={k}
                          onClick={() => action.onClick(row)}
                          className={`p-1.5 rounded-md hover:${action.hoverBg} ${action.color}`}
                          title={action.title}
                        >
                          {action.icon}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length + (actions.length ? 1 : 0)}
                className="text-center text-gray-400 py-6"
              >
                Aucune donnée trouvée.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
