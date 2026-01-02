/**
 * Reusable Analytics Chart Components
 * 
 * Shared across landing page demos and app dashboards.
 * Built with recharts for consistency.
 */

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ========================================
// TYPES
// ========================================

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface ChartConfig {
  /** Height in pixels */
  height?: number;
  /** Show grid lines */
  showGrid?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** Animate on load */
  animate?: boolean;
  /** Primary color (default: purple-600) */
  primaryColor?: string;
  /** Secondary color for area fills */
  secondaryColor?: string;
}

const DEFAULT_CONFIG: ChartConfig = {
  height: 300,
  showGrid: true,
  showLegend: false,
  animate: true,
  primaryColor: '#7c3aed',
  secondaryColor: '#7c3aed20',
};

// Common tooltip style
const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  labelStyle: {
    color: '#374151',
    fontWeight: 600,
  },
};

// ========================================
// PERFORMANCE LINE CHART
// ========================================

interface PerformanceLineChartProps {
  data: ChartDataPoint[];
  xKey: string;
  yKey: string;
  config?: ChartConfig;
}

export function PerformanceLineChart({
  data,
  xKey,
  yKey,
  config = {},
}: PerformanceLineChartProps) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return (
    <ResponsiveContainer width="100%" height={mergedConfig.height}>
      <LineChart data={data}>
        {mergedConfig.showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        )}
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          stroke="#e5e7eb"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          stroke="#e5e7eb"
        />
        <Tooltip {...tooltipStyle} />
        {mergedConfig.showLegend && <Legend />}
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={mergedConfig.primaryColor}
          strokeWidth={3}
          dot={{ fill: mergedConfig.primaryColor, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: mergedConfig.primaryColor }}
          isAnimationActive={mergedConfig.animate}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ========================================
// PERFORMANCE AREA CHART
// ========================================

interface PerformanceAreaChartProps {
  data: ChartDataPoint[];
  xKey: string;
  yKey: string;
  config?: ChartConfig;
}

export function PerformanceAreaChart({
  data,
  xKey,
  yKey,
  config = {},
}: PerformanceAreaChartProps) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return (
    <ResponsiveContainer width="100%" height={mergedConfig.height}>
      <AreaChart data={data}>
        {mergedConfig.showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        )}
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          stroke="#e5e7eb"
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6b7280' }}
          stroke="#e5e7eb"
        />
        <Tooltip {...tooltipStyle} />
        {mergedConfig.showLegend && <Legend />}
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={mergedConfig.primaryColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={mergedConfig.primaryColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={mergedConfig.primaryColor}
          strokeWidth={2}
          fill="url(#colorGradient)"
          isAnimationActive={mergedConfig.animate}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ========================================
// SCORE DISTRIBUTION BAR CHART
// ========================================

interface ScoreDistributionChartProps {
  data: ChartDataPoint[];
  xKey: string;
  yKey: string;
  config?: ChartConfig;
}

export function ScoreDistributionChart({
  data,
  xKey,
  yKey,
  config = {},
}: ScoreDistributionChartProps) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return (
    <ResponsiveContainer width="100%" height={mergedConfig.height}>
      <BarChart data={data}>
        {mergedConfig.showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        )}
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          stroke="#e5e7eb"
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6b7280' }}
          stroke="#e5e7eb"
        />
        <Tooltip {...tooltipStyle} />
        {mergedConfig.showLegend && <Legend />}
        <Bar
          dataKey={yKey}
          fill={mergedConfig.primaryColor}
          radius={[4, 4, 0, 0]}
          isAnimationActive={mergedConfig.animate}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ========================================
// COMPETENCY RADAR CHART
// ========================================

interface CompetencyRadarChartProps {
  data: ChartDataPoint[];
  subjectKey: string;
  valueKey: string;
  config?: ChartConfig;
}

export function CompetencyRadarChart({
  data,
  subjectKey,
  valueKey,
  config = {},
}: CompetencyRadarChartProps) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return (
    <ResponsiveContainer width="100%" height={mergedConfig.height}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey={subjectKey}
          tick={{ fontSize: 11, fill: '#6b7280' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
        />
        <Radar
          name="Score"
          dataKey={valueKey}
          stroke={mergedConfig.primaryColor}
          fill={mergedConfig.primaryColor}
          fillOpacity={0.3}
          isAnimationActive={mergedConfig.animate}
        />
        {mergedConfig.showLegend && <Legend />}
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ========================================
// MULTI-LINE COMPARISON CHART
// ========================================

interface ComparisonLineChartProps {
  data: ChartDataPoint[];
  xKey: string;
  lines: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  config?: ChartConfig;
}

export function ComparisonLineChart({
  data,
  xKey,
  lines,
  config = {},
}: ComparisonLineChartProps) {
  const mergedConfig = { ...DEFAULT_CONFIG, showLegend: true, ...config };

  return (
    <ResponsiveContainer width="100%" height={mergedConfig.height}>
      <LineChart data={data}>
        {mergedConfig.showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        )}
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          stroke="#e5e7eb"
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6b7280' }}
          stroke="#e5e7eb"
        />
        <Tooltip {...tooltipStyle} />
        {mergedConfig.showLegend && <Legend />}
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={{ fill: line.color, strokeWidth: 2, r: 3 }}
            isAnimationActive={mergedConfig.animate}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ========================================
// EXPORTS
// ========================================

const Charts = {
  PerformanceLineChart,
  PerformanceAreaChart,
  ScoreDistributionChart,
  CompetencyRadarChart,
  ComparisonLineChart,
};

export default Charts;
