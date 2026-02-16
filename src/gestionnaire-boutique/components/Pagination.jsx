import React from "react";

const normalizeLabel = (label) => {
  if (!label) return "";
  const rawLabel = String(label);
  const lowered = rawLabel.toLowerCase();
  if (lowered.includes("previous") || lowered.includes("pagination.previous")) return "Precedent";
  if (lowered.includes("next") || lowered.includes("pagination.next")) return "Suivant";
  return rawLabel.replace(/&laquo;|&raquo;/g, "").trim();
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

  const links = pagination.links;
  const isPrev = (label) => {
    const lowered = String(label || "").toLowerCase();
    return lowered.includes("previous") || lowered.includes("pagination.previous");
  };
  const isNext = (label) => {
    const lowered = String(label || "").toLowerCase();
    return lowered.includes("next") || lowered.includes("pagination.next");
  };
  const prevLinks = links.filter((link) => isPrev(link.label));
  const nextLinks = links.filter((link) => isNext(link.label));
  const otherLinks = links.filter((link) => !isPrev(link.label) && !isNext(link.label));
  const activeLink = otherLinks.find((link) => link.active);
  const activePage = getPageFromLink(activeLink);
  const firstLink = otherLinks.find((link) => getPageFromLink(link) === 1);
  const lastLink = otherLinks.find((link) => getPageFromLink(link) === pagination.last_page);
  const middleLinks = otherLinks.filter((link) => {
    const page = getPageFromLink(link);
    if (page === null || page === 1 || page === pagination.last_page) return false;
    if (activePage == null) return false;
    return Math.abs(page - activePage) <= 1;
  });

  const renderLink = (link, idx) => {
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
  };

  const renderEllipsis = (key) => (
    <span key={key} className="px-2 text-gray-500">
      ...
    </span>
  );

  return (
    <div className="flex items-center justify-center gap-2 pt-4 flex-nowrap overflow-x-auto w-full">
      {prevLinks.map((link, idx) => renderLink(link, idx))}
      {firstLink && renderLink(firstLink, prevLinks.length)}
      {activePage > 3 && renderEllipsis("ellipsis-left")}
      {middleLinks.map((link, idx) => renderLink(link, prevLinks.length + 1 + idx))}
      {activePage && pagination.last_page - activePage > 2 && renderEllipsis("ellipsis-right")}
      {lastLink && pagination.last_page > 1 && renderLink(lastLink, prevLinks.length + 1 + middleLinks.length)}
      {nextLinks.map((link, idx) =>
        renderLink(link, prevLinks.length + otherLinks.length + idx)
      )}
    </div>
  );
};

export default Pagination;
