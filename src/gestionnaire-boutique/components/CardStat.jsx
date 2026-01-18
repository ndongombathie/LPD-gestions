import React from "react";

const CardStat = ({ title, value, color, subtitle, icon: Icon }) => {
  return (
    <div className={`p-4 rounded-lg text-white ${color} w-full shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/80">{title}</div>
          <div className="text-2xl font-bold leading-tight mt-1">{value}</div>
          {subtitle && <div className="text-xs text-white/75 mt-1">{subtitle}</div>}
        </div>
        {Icon && <Icon size={24} className="text-white/85" />}
      </div>
    </div>
  );
};

export default CardStat;
