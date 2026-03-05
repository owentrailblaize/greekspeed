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

  // Set dimensions once on mount only - never recalculate
  useEffect(() => {
    setIsMounted(true);
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDimensions({ width: rect.width, height: rect.height });
        } else {
          // Fallback if dimensions are 0
          setDimensions({ width: 800, height: 400 });
        }
      }
    });
  }, []); // Empty dependency array - only runs once

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
  }, [filters, loadChartData]);

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
          margin={{ top: 50, right: 20, bottom: 60, left: 70 }}
          xScale={{
            type: 'time',
            format: '%Y-%m-%d',
            useUTC: false,
          }}
          xFormat="time:%Y-%m-%d"
          yScale={{
            type: 'linear',
            min: 0,
            max: 'auto',
          }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            format: '%b %d',
            tickValues: 'every 7 days',
            legend: 'Date',
            legendOffset: 50,
            legendPosition: 'middle',
            tickSize: 5,
            tickPadding: 5,
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
          pointSize={6}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          useMesh={false}
          legends={[
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
          ]}
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
          isInteractive={false}
        />
      </div>
    </div>
  );
});