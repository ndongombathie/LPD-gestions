import React from "react";

const normalizeLabel = (label) => {
  if (!label) return "";
  if (label.includes("Previous")) return "Precedent";
  if (label.includes("Next")) return "Suivant";
  return label.replace(/&laquo;|&raquo;/g, "").trim();
};

const getPageFromLink = (link) => {
  if (link?.page) return link.page;
  const label = String(link?.label || "").trim();
  const num = parseInt(label, 10);
  return Number.isNaN(num) ? null : num;
};

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || !Array.isArray(pagination.links) || pagination.links.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
      {pagination.links.map((link, idx) => {
        const page = getPageFromLink(link);
        const label = normalizeLabel(link.label);
        const isDisabled = !link.url || page === null;
        const isActive = !!link.active;

        return (
          <button
            key={`${label}-${idx}`}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onPageChange(page)}
            className={`px-3 py-1 rounded border text-sm ${
              isActive
                ? "bg-[#472EAD] text-white border-[#472EAD]"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {label || page}
          </button>
        );
      })}
    </div>
  );
};

export default Pagination;
