'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { UserGrowthChartData } from '@/types/user-growth';
import type { UserGrowthFilters } from '@/types/user-growth';

interface UserGrowthChartProps {
  filters: UserGrowthFilters;
}

export function UserGrowthChart({ filters }: UserGrowthChartProps) {
  const [data, setData] = useState<UserGrowthChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [filters]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.chapterId) params.append('chapter_id', filters.chapterId);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.activityWindow) params.append('activity_window', filters.activityWindow.toString());
      params.append('days', '90');

      const response = await fetch(`/api/developer/user-growth/chart?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load chart data');
      
      const chartData = await response.json();
      setData(chartData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-96 flex items-center justify-center">Loading chart...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
          formatter={(value: number) => value.toLocaleString()}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#8884d8"
          name="Total Users"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="admin"
          stroke="#82ca9d"
          name="Admin Users"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="alumni"
          stroke="#ffc658"
          name="Alumni Users"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="activeMember"
          stroke="#ff7300"
          name="Member Users"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
