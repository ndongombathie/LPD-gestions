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
              <th key={`${col.key ?? 'col'}-${i}`} className="px-4 py-3 text-left whitespace-nowrap">
                {col.label}
              </th>
            ))}
            {actions.length > 0 && (
              <th className="px-4 py-3 text-center">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
              data.map((row) => {
                const rowKey = row?.id ?? row?._id;
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row)}
                  className="border-b border-gray-100 hover:bg-[#F9F9FF] transition cursor-default"
                >
                  {columns.map((col, j) => {
                    const value = row[col.key];
                    let content;
                    if (typeof col.render === 'function') {
                      content = col.render(value, row);
                    } else if (value !== null && typeof value === 'object') {
                      content = JSON.stringify(value);
                    } else {
                      content = value ?? '-';
                    }

                    return (
                      <td
                        key={`${rowKey}-${j}`}
                        className={`px-4 py-3 ${j === 0 ? "font-medium text-gray-800" : "text-gray-600"}`}
                      >
                        {content}
                      </td>
                    );
                  })}

                  {actions.length > 0 && (
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {actions.map((action, k) => (
                          <button
                            key={action.key ?? action.title ?? `action-${k}`}
                            onClick={(e) => { e.stopPropagation(); action.onClick(row); }}
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
              );
            })
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
