'use client';

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { Line } from '@nivo/line';
import type { UserGrowthChartData } from '@/types/user-growth';
import type { UserGrowthFilters } from '@/types/user-growth';

interface UserGrowthChartProps {
  filters: UserGrowthFilters;
}

// Memoize the component to prevent re-renders
export const UserGrowthChart = memo(function UserGrowthChart({ filters }: UserGrowthChartProps) {
  const [data, setData] = useState<UserGrowthChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const prevFiltersRef = useRef<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [isMounted, setIsMounted] = useState(false);

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
      } else {
        setDimensions({ width: 800, height: 400 });
      }
    }
  }, []);

  // Initial measurement and ResizeObserver for responsive chart dimensions
  useEffect(() => {
    setIsMounted(true);
    requestAnimationFrame(updateDimensions);

    const el = containerRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [updateDimensions]);

  // Memoize loadChartData to prevent recreation on every render
  const loadChartData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.chapterId) params.append('chapter_id', filters.chapterId);
      if (filters.activityWindow) {
        params.append('activity_window', filters.activityWindow.toString());
      }

      const response = await fetch(`/api/developer/user-growth/chart?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load chart data');
      
      const chartData = await response.json();
      setData(chartData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.chapterId, filters.activityWindow]);

  useEffect(() => {
    // Serialize filters to string for comparison
    const filtersKey = JSON.stringify(filters);
    
    // Only load chart data if filters actually changed
    if (prevFiltersRef.current !== filtersKey) {
      prevFiltersRef.current = filtersKey;
      loadChartData();
    }
  }, [filters]);

  // Transform data for Nivo format - memoized to prevent recalculation
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return [
      {
        id: 'Total Users',
        color: '#8884d8',
        data: data.map((d) => ({
          x: d.date,
          y: d.total,
        })),
      },
      {
        id: 'Admin Users',
        color: '#82ca9d',
        data: data.map((d) => ({
          x: d.date,
          y: d.admin,
        })),
      },
      {
        id: 'Alumni Users',
        color: '#ffc658',
        data: data.map((d) => ({
          x: d.date,
          y: d.alumni,
        })),
      },
      {
        id: 'Member Users',
        color: '#ff7300',
        data: data.map((d) => ({
          x: d.date,
          y: d.activeMember,
        })),
      },
    ];
  }, [data]);

  // Compute y-axis max from data so scale adapts to actual counts (avoids Nivo 'auto' capping at 1000)
  const yMax = useMemo(() => {
    if (!data || data.length === 0) return 100;
    const maxVal = Math.max(
      ...data.flatMap((d) => [d.total, d.admin, d.alumni, d.activeMember])
    );
    const withPadding = Math.ceil(maxVal * 1.08);
    // Round up to a nice interval for cleaner axis labels
    if (withPadding <= 100) return Math.max(100, withPadding);
    if (withPadding <= 500) return Math.ceil(withPadding / 100) * 100;
    if (withPadding <= 2000) return Math.ceil(withPadding / 500) * 500;
    return Math.ceil(withPadding / 1000) * 1000;
  }, [data]);

  if (loading) {
    return <div className="h-full flex items-center justify-center">Loading chart...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-gray-500">No data available</div>;
  }

  if (!isMounted || dimensions.width === 0) {
    return <div className="h-full flex items-center justify-center">Initializing chart...</div>;
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        position: 'relative',
        contain: 'layout style paint',
        willChange: 'auto',
        isolation: 'isolate',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'auto',
        }}
      >
        <Line
          width={dimensions.width}
          height={dimensions.height}
          data={chartData}
          margin={
            dimensions.width < 400
              ? { top: 40, right: 10, bottom: 72, left: 45 }
              : dimensions.width < 600
                ? { top: 45, right: 15, bottom: 72, left: 55 }
                : { top: 50, right: 20, bottom: 72, left: 70 }
          }
          xScale={{
            type: 'time',
            format: '%Y-%m-%d',
            useUTC: false,
          }}
          xFormat="time:%Y-%m-%d"
          yScale={{
            type: 'linear',
            min: 0,
            max: yMax,
          }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            format: '%b %d',
            tickValues: 'every 2 weeks',
            legend: 'Date',
            legendOffset: 50,
            legendPosition: 'middle',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
          }}
          axisLeft={{
            legend: 'Users',
            legendOffset: -55,
            legendPosition: 'middle',
            format: (value) => {
              if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
              return value.toLocaleString();
            },
            tickSize: 5,
            tickPadding: 5,
          }}
          pointSize={10}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          useMesh={true}
          enableSlices="x"
          sliceTooltip={({ slice }) => {
            const SERIES_ORDER = ['Total Users', 'Alumni Users', 'Member Users', 'Admin Users'];
            const getSeriesLabel = (point: { seriesId?: string; serieId?: string; id?: string }) =>
              String(point.seriesId ?? point.serieId ?? point.id ?? '').replace(/\.[^.]*$/, '') || 'Unknown';
            const sortedPoints = [...(slice.points ?? [])].sort((a, b) => {
              const aLabel = getSeriesLabel(a);
              const bLabel = getSeriesLabel(b);
              return SERIES_ORDER.indexOf(aLabel) - SERIES_ORDER.indexOf(bLabel);
            });
            return (
              <div
                style={{
                  background: 'white',
                  color: '#374151',
                  fontSize: 12,
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  minWidth: 180,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: '#6b7280',
                    marginBottom: 8,
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: 6,
                  }}
                >
                  {typeof slice.points[0]?.data?.x === 'string'
                    ? new Date(slice.points[0].data.x).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : slice.points[0]?.data?.xFormatted}
                </div>
                {sortedPoints.map((point) => {
                  const label = getSeriesLabel(point);
                  return (
                    <div
                      key={point.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'center',
                        marginTop: 6,
                      }}
                    >
<span style={{ color: point.seriesColor, flexShrink: 0 }}>●</span>
<span style={{ flex: 1, minWidth: 100, color: '#374151' }}>{label}</span>
                      <span style={{ fontWeight: 600, flexShrink: 0 }}>
                        {Number(point.data.y).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          }}
          tooltip={({ point }) => (
            <div
              style={{
                background: 'white',
                color: '#374151',
                fontSize: 12,
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '10px 14px',
                border: '1px solid #e5e7eb',
              }}
            >
              <strong>{point.seriesId}</strong>
              <div style={{ marginTop: 4, color: '#6b7280', fontSize: 11 }}>
                {new Date(point.data.x).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <div style={{ marginTop: 4, fontWeight: 600 }}>
                {Number(point.data.y).toLocaleString()} users
              </div>
            </div>
          )}
          legends={
            dimensions.width >= 480
              ? [
                  {
                    anchor: 'top',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: -30,
                    itemsSpacing: 20,
                    itemDirection: 'left-to-right',
                    itemWidth: 100,
                    itemHeight: 20,
                    itemOpacity: 0.85,
                    symbolSize: 10,
                    symbolShape: 'circle',
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemBackground: 'rgba(0, 0, 0, .03)',
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]
              : []
          }
          theme={{
            axis: {
              domain: {
                line: {
                  stroke: '#e5e7eb',
                  strokeWidth: 1,
                },
              },
              ticks: {
                line: {
                  stroke: '#e5e7eb',
                  strokeWidth: 1,
                },
                text: {
                  fill: '#6b7280',
                  fontSize: 11,
                  fontFamily: 'inherit',
                },
              },
              legend: {
                text: {
                  fill: '#6b7280',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  fontWeight: 500,
                },
              },
            },
            grid: {
              line: {
                stroke: '#f0f0f0',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              },
            },
            tooltip: {
              container: {
                background: 'white',
                color: '#374151',
                fontSize: 12,
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '10px 14px',
                border: '1px solid #e5e7eb',
              },
            },
          }}
          colors={['#14b8a6', '#64748b', '#f59e0b', '#ef4444']}
          lineWidth={2.5}
          curve="monotoneX"
          enableArea={false}
          enableGridX={true}
          enableGridY={true}
          enablePoints={true}
          enablePointLabel={false}
          animate={false}
          isInteractive={true}
        />
      </div>
    </div>
  );
});