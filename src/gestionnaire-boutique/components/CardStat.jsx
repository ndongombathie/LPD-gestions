import React from "react";

const CardStat = ({ title, value, color }) => {
  return (
    <div className={`p-4 rounded-lg text-white ${color} w-48`}>
      <div className="text-sm">{title}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
};

export default CardStat;
