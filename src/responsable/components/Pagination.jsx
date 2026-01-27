import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = new Set();

    pages.add(1);
    pages.add(totalPages);

    if (page - 1 > 1) pages.add(page - 1);
    pages.add(page);
    if (page + 1 < totalPages) pages.add(page + 1);

    return Array.from(pages).sort((a, b) => a - b);
  };

  const pages = getPages();

  return (
    <div className="flex items-center justify-between pt-4 border-t border-[#E4E0FF]">
      <span className="text-xs text-gray-500">
        Page {page} sur {totalPages}
      </span>

      <div className="flex items-center gap-2">
        {/* ⬅️ Précédent */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 🔢 Pages */}
        {pages.map((p, i) => {
          const prev = pages[i - 1];
          const showDots = prev && p - prev > 1;

          return (
            <React.Fragment key={p}>
              {showDots && (
                <span className="px-2 text-gray-400 text-sm">…</span>
              )}

              <button
                onClick={() => onPageChange(p)}
                disabled={p === page}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border
                  ${
                    p === page
                      ? "bg-[#472EAD] text-white border-[#472EAD] cursor-default"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {p}
              </button>
            </React.Fragment>
          );
        })}

        {/* ➡️ Suivant */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
