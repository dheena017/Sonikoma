import React from "react";
import { TrendingUp, RefreshCw } from "lucide-react";

export interface AdminDashboardChartProps {
  signupChartData: Array<{ date: string; count: number }>;
  projectChartData: Array<{ date: string; count: number }>;
  onRefresh: () => void;
}

export const AdminDashboardChart: React.FC<AdminDashboardChartProps> = ({
  signupChartData,
  projectChartData,
  onRefresh,
}) => {
  const maxVal =
    Math.max(
      ...signupChartData.map((d) => d.count || 0),
      ...projectChartData.map((d) => d.count || 0),
      10
    ) * 1.15;

  const chartWidth = 500;
  const chartHeight = 180;
  const padding = { left: 40, right: 20, top: 15, bottom: 25 };

  const getCoords = (data: Array<{ date: string; count: number }>) => {
    if (data.length === 0) return [];
    const stepX =
      (chartWidth - padding.left - padding.right) /
      Math.max(data.length - 1, 1);
    return data.map((item, index) => {
      const x = padding.left + index * stepX;
      const y =
        chartHeight -
        padding.bottom -
        ((item.count || 0) / maxVal) *
          (chartHeight - padding.top - padding.bottom);
      return { x, y, value: item.count, label: item.date };
    });
  };

  const signupCoords = getCoords(signupChartData);
  const projectCoords = getCoords(projectChartData);

  const makePath = (coords: Array<{ x: number; y: number }>) => {
    if (coords.length === 0) return "";
    return coords.reduce((acc, coord, idx) => {
      if (idx === 0) return `M ${coord.x} ${coord.y}`;
      const prev = coords[idx - 1];
      const cpX1 = prev.x + (coord.x - prev.x) / 3;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (2 * (coord.x - prev.x)) / 3;
      const cpY2 = coord.y;
      return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${coord.x} ${coord.y}`;
    }, "");
  };

  const makeAreaPath = (coords: Array<{ x: number; y: number }>) => {
    if (coords.length === 0) return "";
    const linePath = makePath(coords);
    return `${linePath} L ${coords[coords.length - 1].x} ${
      chartHeight - padding.bottom
    } L ${coords[0].x} ${chartHeight - padding.bottom} Z`;
  };

  const signupPath = makePath(signupCoords);
  const projectPath = makePath(projectCoords);
  const signupArea = makeAreaPath(signupCoords);
  const projectArea = makeAreaPath(projectCoords);

  return (
    <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between shadow-sm text-left">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-extrabold text-[#E5E5E5] flex items-center gap-2 font-mono">
            <TrendingUp className="w-4 h-4 text-[#3B82F6]" /> Platform Signups &
            Project Activity
          </h3>
          <button
            onClick={onRefresh}
            className="btn-secondary p-1.5 rounded-lg cursor-pointer"
            title="Refresh trends"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-full relative py-2">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto overflow-visible"
          >
            <defs>
              <linearGradient id="chartGradientViolet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="chartGradientBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y =
                chartHeight -
                padding.bottom -
                pct * (chartHeight - padding.top - padding.bottom);
              const val = Math.round(pct * maxVal);
              return (
                <g key={`grid-${pct}`}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="#262626"
                    strokeDasharray="2 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 6}
                    y={y + 3}
                    textAnchor="end"
                    fill="#737373"
                    className="text-[9px] font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Areas */}
            {signupArea && (
              <path d={signupArea} fill="url(#chartGradientViolet)" />
            )}
            {projectArea && (
              <path d={projectArea} fill="url(#chartGradientBlue)" />
            )}

            {/* Lines */}
            {signupPath && (
              <path
                d={signupPath}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
            {projectPath && (
              <path
                d={projectPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Dots */}
            {signupCoords.map((coord, idx) => (
              <g key={`signup-${idx}`} className="group/dot">
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="4"
                  fill="#0a0a0f"
                  stroke="#a78bfa"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-5 transition-all"
                />
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="8"
                  fill="#a78bfa"
                  className="opacity-0 group-hover/dot:opacity-20 cursor-pointer animate-ping"
                />
              </g>
            ))}

            {projectCoords.map((coord, idx) => (
              <g key={`project-${idx}`} className="group/dot">
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="4"
                  fill="#0a0a0f"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-5 transition-all"
                />
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="8"
                  fill="#3b82f6"
                  className="opacity-0 group-hover/dot:opacity-20 cursor-pointer animate-ping"
                />
              </g>
            ))}

            {/* X Axis Date labels */}
            {signupCoords.map((coord, idx) => {
              if (idx % 2 !== 0 && idx !== signupCoords.length - 1) return null;
              const dateStr = coord.label.substring(5);
              return (
                <text
                  key={`label-${idx}`}
                  x={coord.x}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fill="#737373"
                  className="text-[9px] font-bold"
                >
                  {dateStr}
                </text>
              );
            })}
          </svg>

          <div className="flex gap-4 items-center justify-center text-[10px] mt-2 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
              <span className="text-neutral-400 font-bold">New Creators</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-neutral-400 font-bold">New Chapters</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardChart;
