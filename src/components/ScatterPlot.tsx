import React, { useState, useMemo } from 'react';
import { IrisRecord, Species, FeatureKey, FEATURE_LABELS, SPECIES_COLORS } from '../types';

interface ScatterPlotProps {
  data: IrisRecord[];
  xAxis: FeatureKey;
  yAxis: FeatureKey;
  onXAxisChange: (feature: FeatureKey) => void;
  onYAxisChange: (feature: FeatureKey) => void;
  predictFn?: (record: Omit<IrisRecord, 'species' | 'id'>) => Species;
  // Current slider/test values to evaluate for remaining dimensions in decision boundary
  currentTestValues: {
    sepalLength: number;
    sepalWidth: number;
    petalLength: number;
    petalWidth: number;
  };
  onPlotClick?: (xValue: number, yValue: number) => void;
  trainIds: Set<number>;
}

export default function ScatterPlot({
  data,
  xAxis,
  yAxis,
  onXAxisChange,
  onYAxisChange,
  predictFn,
  currentTestValues,
  onPlotClick,
  trainIds,
}: ScatterPlotProps) {
  const [hoveredPoint, setHoveredPoint] = useState<IrisRecord | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Features list
  const features: FeatureKey[] = ['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'];

  // Dimensions of SVG plot area
  const svgWidth = 500;
  const svgHeight = 400;
  const padding = { top: 30, right: 30, bottom: 50, left: 60 };

  // Calculate global min and max with slight margin
  const bounds = useMemo(() => {
    const xValues = data.map((d) => d[xAxis]);
    const yValues = data.map((d) => d[yAxis]);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    return {
      xMin: Math.max(0, xMin - xRange * 0.08),
      xMax: xMax + xRange * 0.08,
      yMin: Math.max(0, yMin - yRange * 0.08),
      yMax: yMax + yRange * 0.08,
    };
  }, [data, xAxis, yAxis]);

  // Map data coordinates to SVG space
  const getSvgCoords = (xVal: number, yVal: number) => {
    const x =
      padding.left +
      ((xVal - bounds.xMin) / (bounds.xMax - bounds.xMin)) *
        (svgWidth - padding.left - padding.right);
    const y =
      svgHeight -
      padding.bottom -
      ((yVal - bounds.yMin) / (bounds.yMax - bounds.yMin)) *
        (svgHeight - padding.top - padding.bottom);
    return { x, y };
  };

  // Map SVG space back to data coordinates (for click events)
  const getDataCoords = (svgX: number, svgY: number) => {
    const plotWidth = svgWidth - padding.left - padding.right;
    const plotHeight = svgHeight - padding.top - padding.bottom;

    // Constrain to plotting area
    const clampedX = Math.max(padding.left, Math.min(svgX, svgWidth - padding.right));
    const clampedY = Math.max(padding.top, Math.min(svgY, svgHeight - padding.bottom));

    const xPct = (clampedX - padding.left) / plotWidth;
    const yPct = (svgHeight - padding.bottom - clampedY) / plotHeight;

    const xVal = bounds.xMin + xPct * (bounds.xMax - bounds.xMin);
    const yVal = bounds.yMin + yPct * (bounds.yMax - bounds.yMin);

    return { xVal, yVal };
  };

  // Generate decision boundary grid
  const gridCells = useMemo(() => {
    if (!predictFn) return [];

    const cells: { x: number; y: number; width: number; height: number; species: Species }[] = [];
    const stepsX = 40;
    const stepsY = 32;

    const plotWidth = svgWidth - padding.left - padding.right;
    const plotHeight = svgHeight - padding.top - padding.bottom;

    const cellWidth = plotWidth / stepsX;
    const cellHeight = plotHeight / stepsY;

    for (let i = 0; i < stepsX; i++) {
      for (let j = 0; j < stepsY; j++) {
        // SVG center coordinate of this cell
        const svgX = padding.left + i * cellWidth + cellWidth / 2;
        const svgY = padding.top + j * cellHeight + cellHeight / 2;

        const { xVal, yVal } = getDataCoords(svgX, svgY);

        // Build a complete record utilizing remaining dimensions from sliders
        const recordToPredict = {
          sepalLength: currentTestValues.sepalLength,
          sepalWidth: currentTestValues.sepalWidth,
          petalLength: currentTestValues.petalLength,
          petalWidth: currentTestValues.petalWidth,
          [xAxis]: xVal,
          [yAxis]: yVal,
        };

        const pred = predictFn(recordToPredict);

        cells.push({
          x: padding.left + i * cellWidth,
          y: padding.top + j * cellHeight,
          width: cellWidth + 0.5, // slightly overlap to avoid seams
          height: cellHeight + 0.5,
          species: pred,
        });
      }
    }
    return cells;
  }, [bounds, xAxis, yAxis, predictFn, currentTestValues]);

  // Handle click on plot to move test point
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onPlotClick) return;

    const svgRect = e.currentTarget.getBoundingClientRect();
    // Calculate click coords relative to the SVG viewbox
    const clickX = ((e.clientX - svgRect.left) / svgRect.width) * svgWidth;
    const clickY = ((e.clientY - svgRect.top) / svgRect.height) * svgHeight;

    // Check if within bounds
    if (
      clickX >= padding.left &&
      clickX <= svgWidth - padding.right &&
      clickY >= padding.top &&
      clickY <= svgHeight - padding.bottom
    ) {
      const { xVal, yVal } = getDataCoords(clickX, clickY);
      onPlotClick(xVal, yVal);
    }
  };

  // Generate ticks for axes
  const xTicks = useMemo(() => {
    const ticks = [];
    const count = 5;
    for (let i = 0; i <= count; i++) {
      const val = bounds.xMin + (i / count) * (bounds.xMax - bounds.xMin);
      ticks.push(val);
    }
    return ticks;
  }, [bounds]);

  const yTicks = useMemo(() => {
    const ticks = [];
    const count = 5;
    for (let i = 0; i <= count; i++) {
      const val = bounds.yMin + (i / count) * (bounds.yMax - bounds.yMin);
      ticks.push(val);
    }
    return ticks;
  }, [bounds]);

  // Current test point SVG coordinates
  const testPointCoords = getSvgCoords(currentTestValues[xAxis], currentTestValues[yAxis]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col h-full" id="scatter-plot-container">
      {/* Selector Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
          Interactive 2D Feature Space
        </h3>
        
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center">
            <label className="text-slate-400 mr-1.5 font-medium">X Axis:</label>
            <select
              value={xAxis}
              onChange={(e) => onXAxisChange(e.target.value as FeatureKey)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer"
            >
              {features.map((f) => (
                <option key={f} value={f}>
                  {FEATURE_LABELS[f].split(' ')[0]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label className="text-slate-400 mr-1.5 font-medium">Y Axis:</label>
            <select
              value={yAxis}
              onChange={(e) => onYAxisChange(e.target.value as FeatureKey)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer"
            >
              {features.map((f) => (
                <option key={f} value={f}>
                  {FEATURE_LABELS[f].split(' ')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main SVG Area */}
      <div className="relative flex-grow flex items-center justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair max-h-[380px]"
          onClick={handleSvgClick}
        >
          {/* 1. DECISION BOUNDARY GRID */}
          {predictFn && gridCells.map((cell, idx) => {
            let fillColor = 'rgba(229, 231, 235, 0.1)';
            if (cell.species === 'Iris-setosa') fillColor = 'rgba(59, 130, 246, 0.07)';
            if (cell.species === 'Iris-versicolor') fillColor = 'rgba(16, 185, 129, 0.07)';
            if (cell.species === 'Iris-virginica') fillColor = 'rgba(236, 72, 153, 0.07)';

            return (
              <rect
                key={`grid-${idx}`}
                x={cell.x}
                y={cell.y}
                width={cell.width}
                height={cell.height}
                fill={fillColor}
                shapeRendering="crispEdges"
              />
            );
          })}

          {/* Plotting area border */}
          <rect
            x={padding.left}
            y={padding.top}
            width={svgWidth - padding.left - padding.right}
            height={svgHeight - padding.top - padding.bottom}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />

          {/* Grid lines (light dashed) */}
          {xTicks.slice(1, -1).map((tick, i) => {
            const { x } = getSvgCoords(tick, bounds.yMin);
            return (
              <line
                key={`grid-x-${i}`}
                x1={x}
                y1={padding.top}
                x2={x}
                y2={svgHeight - padding.bottom}
                stroke="#f3f4f6"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })}
          {yTicks.slice(1, -1).map((tick, i) => {
            const { y } = getSvgCoords(bounds.xMin, tick);
            return (
              <line
                key={`grid-y-${i}`}
                x1={padding.left}
                y1={y}
                x2={svgWidth - padding.right}
                y2={y}
                stroke="#f3f4f6"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })}

          {/* 2. AXES TICKS AND VALUES */}
          {/* X Axis */}
          {xTicks.map((tick, i) => {
            const { x } = getSvgCoords(tick, bounds.yMin);
            return (
              <g key={`xtick-${i}`}>
                <line x1={x} y1={svgHeight - padding.bottom} x2={x} y2={svgHeight - padding.bottom + 5} stroke="#d1d5db" strokeWidth="1" />
                <text
                  x={x}
                  y={svgHeight - padding.bottom + 18}
                  textAnchor="middle"
                  className="font-mono text-[10px] text-gray-400 fill-gray-400"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}
          <text
            x={padding.left + (svgWidth - padding.left - padding.right) / 2}
            y={svgHeight - 12}
            textAnchor="middle"
            className="text-xs font-semibold text-gray-500 fill-gray-500"
          >
            {FEATURE_LABELS[xAxis]}
          </text>

          {/* Y Axis */}
          {yTicks.map((tick, i) => {
            const { y } = getSvgCoords(bounds.xMin, tick);
            return (
              <g key={`ytick-${i}`}>
                <line x1={padding.left} y1={y} x2={padding.left - 5} y2={y} stroke="#d1d5db" strokeWidth="1" />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="font-mono text-[10px] text-gray-400 fill-gray-400"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}
          <text
            transform={`rotate(-90, 15, ${padding.top + (svgHeight - padding.top - padding.bottom) / 2})`}
            x={15}
            y={padding.top + (svgHeight - padding.top - padding.bottom) / 2}
            textAnchor="middle"
            className="text-xs font-semibold text-gray-500 fill-gray-500"
          >
            {FEATURE_LABELS[yAxis]}
          </text>

          {/* 3. DATA POINTS */}
          {data.map((record) => {
            const { x, y } = getSvgCoords(record[xAxis], record[yAxis]);
            const isTrain = trainIds.has(record.id);
            const isHovered = hoveredPoint?.id === record.id;

            return (
              <g key={`point-${record.id}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 8 : isTrain ? 4.5 : 3.5}
                  fill={SPECIES_COLORS[record.species]}
                  stroke={isHovered ? '#1e293b' : isTrain ? '#ffffff' : 'rgba(30, 41, 59, 0.4)'}
                  strokeWidth={isHovered ? 2 : isTrain ? 1.2 : 0.8}
                  opacity={isHovered ? 1 : 0.85}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (rect) {
                      setHoveredPoint(record);
                      setTooltipPos({
                        x: x,
                        y: y - 10,
                      });
                    }
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* 4. CURRENT TEST POINT INDICATOR (CROSSHAIR STAR) */}
          {testPointCoords && (
            <g className="pointer-events-none">
              {/* Pulsing ring */}
              <circle
                cx={testPointCoords.x}
                cy={testPointCoords.y}
                r="12"
                fill="none"
                stroke="#000000"
                strokeWidth="1.5"
                strokeDasharray="3,3"
                className="animate-spin"
                style={{ transformOrigin: `${testPointCoords.x}px ${testPointCoords.y}px`, animationDuration: '6s' }}
              />
              <circle
                cx={testPointCoords.x}
                cy={testPointCoords.y}
                r="6"
                fill="#ffffff"
                stroke="#1e293b"
                strokeWidth="2.5"
              />
              <circle
                cx={testPointCoords.x}
                cy={testPointCoords.y}
                r="2.5"
                fill="#f59e0b"
              />
            </g>
          )}
        </svg>

        {/* Dynamic Legend Overlay */}
        <div className="absolute top-2.5 left-[68px] bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-xl px-3 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-white bg-blue-500 shadow-xs" /> Setosa
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-white bg-emerald-500 shadow-xs" /> Versicolor
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-white bg-pink-500 shadow-xs" /> Virginica
          </div>
          <div className="w-px h-3.5 bg-slate-200/80" />
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-white bg-slate-400 shadow-xs" /> Train
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full border border-slate-400 bg-transparent" /> Test
          </div>
        </div>

        {/* Live Click Helper Overlay */}
        <div className="absolute bottom-2.5 right-3.5 pointer-events-none text-[9px] font-semibold text-slate-400 bg-white/80 backdrop-blur-md border border-slate-200/40 px-2 py-0.5 rounded-lg shadow-xs">
          💡 Click anywhere on plot to classify custom values
        </div>

        {/* HOVER TOOLTIP */}
        {hoveredPoint && (
          <div
            className="absolute z-30 bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-3 shadow-lg text-xs pointer-events-none flex flex-col gap-1 transition-all duration-100 font-sans border border-slate-800"
            style={{
              left: `${(tooltipPos.x / svgWidth) * 100}%`,
              top: `${(tooltipPos.y / svgHeight) * 100}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5 mb-1">
              <span className="font-extrabold uppercase tracking-wider text-[10px]" style={{ color: SPECIES_COLORS[hoveredPoint.species] }}>
                {hoveredPoint.species.split('-')[1]}
              </span>
              <span className="text-[10px] text-slate-500">ID: #{hoveredPoint.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-0.5 font-mono text-[10px]">
              <span className="text-slate-400">Sepal L.:</span>
              <span className="text-right text-slate-200 font-bold">{hoveredPoint.sepalLength} cm</span>
              <span className="text-slate-400">Sepal W.:</span>
              <span className="text-right text-slate-200 font-bold">{hoveredPoint.sepalWidth} cm</span>
              <span className="text-slate-400">Petal L.:</span>
              <span className="text-right text-slate-200 font-bold">{hoveredPoint.petalLength} cm</span>
              <span className="text-slate-400">Petal W.:</span>
              <span className="text-right text-slate-200 font-bold">{hoveredPoint.petalWidth} cm</span>
            </div>
            <div className="mt-1.5 text-[9px] text-right font-semibold text-slate-500 border-t border-slate-800/60 pt-1">
              {trainIds.has(hoveredPoint.id) ? 'Training Set' : 'Testing Set'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
