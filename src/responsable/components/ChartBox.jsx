// ==========================================================
// 📊 ChartBox.jsx — Composant Graphique Premium (LPD Manager)
// Version harmonisée : design aligné + animations fluides
// ==========================================================

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

// Palette cohérente LPD
const COLORS = ["#472EAD", "#F58020", "#10B981", "#EF4444", "#7A5BF5", "#34D399"];

export default function ChartBox({
  title,
  icon,
  data,
  dataKey1,
  dataKey2,
  type = "bar", // "bar" | "line" | "area" | "pie"
  height = 260,
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-white/90 border border-[#E4E0FF] rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 p-5 sm:p-6 backdrop-blur-sm transition-all duration-300"
    >
      {/* === En-tête === */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold text-[#2F1F7A] flex items-center gap-2">
          <span className="inline-flex items-center justify-center p-2 rounded-lg bg-[#F7F5FF] text-[#472EAD] border border-[#E4E0FF]">
            {icon}
          </span>
          <span>{title}</span>
        </h3>
      </div>

      {/* === Conteneur graphique === */}
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" && (
            <BarChart
              data={data}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip cursor={{ fill: "#F7F5FF" }} />
              <Legend />
              <Bar
                dataKey={dataKey1}
                fill={COLORS[0]}
                radius={[6, 6, 0, 0]}
              />
              {dataKey2 && (
                <Bar
                  dataKey={dataKey2}
                  fill={COLORS[1]}
                  radius={[6, 6, 0, 0]}
                />
              )}
            </BarChart>
          )}

          {type === "line" && (
            <LineChart
              data={data}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip cursor={{ fill: "#F7F5FF" }} />
              <Legend />
              <Line
                type="monotone"
                dataKey={dataKey1}
                stroke={COLORS[0]}
                strokeWidth={3}
                dot={false}
              />
              {dataKey2 && (
                <Line
                  type="monotone"
                  dataKey={dataKey2}
                  stroke={COLORS[1]}
                  strokeWidth={3}
                  dot={false}
                />
              )}
            </LineChart>
          )}

          {type === "area" && (
            <AreaChart
              data={data}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="color1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="color2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip cursor={{ fill: "#F7F5FF" }} />
              <Legend />
              <Area
                type="monotone"
                dataKey={dataKey1}
                stroke={COLORS[0]}
                fill="url(#color1)"
              />
              {dataKey2 && (
                <Area
                  type="monotone"
                  dataKey={dataKey2}
                  stroke={COLORS[1]}
                  fill="url(#color2)"
                />
              )}
            </AreaChart>
          )}

          {type === "pie" && (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
                dataKey={dataKey1}
                nameKey="name"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
