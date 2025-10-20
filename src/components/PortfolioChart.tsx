import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './PortfolioChart.css';

interface PortfolioChartProps {
  data: Array<{
    date: string;
    timestamp?: number;
    value: number;
  }>;
}

type TimePeriod = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

const PortfolioChart: React.FC<PortfolioChartProps> = ({ data }) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1M');

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    let cutoffDate = new Date();

    switch (timePeriod) {
      case '1D':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case '1W':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'ALL':
        return data.map(item => ({
          ...item,
          displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
    }

    const cutoffTime = cutoffDate.getTime();
    return data
      .filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getTime() >= cutoffTime;
      })
      .map(item => ({
        ...item,
        displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));
  }, [data, timePeriod]);

  const startValue = filteredData[0]?.value || 0;
  const endValue = filteredData[filteredData.length - 1]?.value || 0;
  const change = endValue - startValue;
  const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;
  const isPositive = change >= 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="portfolio-chart-tooltip">
          <div className="tooltip-value">
            ${value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="tooltip-date">{payload[0].payload.displayDate || payload[0].payload.date}</div>
        </div>
      );
    }
    return null;
  };

  // Debug logging
  console.log('📊 PortfolioChart render:', {
    dataLength: data.length,
    filteredDataLength: filteredData.length,
    startValue,
    endValue,
    change,
    changePercent,
    firstDataPoint: data[0],
    lastDataPoint: data[data.length - 1]
  });

  return (
    <div className="portfolio-chart-container">
      <div className="portfolio-chart-header">
        <div>
          <h2 className="chart-title">Portfolio Performance</h2>
          <div className="chart-change">
            <span className={`change-value ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}${Math.abs(change).toFixed(2)} (
              {isPositive ? '+' : ''}
              {changePercent.toFixed(2)}%)
            </span>
            <span className="change-period">• {timePeriod}</span>
          </div>
        </div>

        <div className="time-period-selector">
          {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as TimePeriod[]).map(period => (
            <button
              key={period}
              className={`period-btn ${timePeriod === period ? 'active' : ''}`}
              onClick={() => setTimePeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="portfolio-chart-body">
        {filteredData.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No data available for this time period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? '#10b981' : '#ef4444'}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? '#10b981' : '#ef4444'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis
              dataKey="displayDate"
              stroke="var(--chart-axis)"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
              tickLine={{ stroke: 'var(--chart-axis)' }}
            />
            <YAxis
              stroke="var(--chart-axis)"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
              tickLine={{ stroke: 'var(--chart-axis)' }}
              tickFormatter={value =>
                `$${(value / 1000).toFixed(0)}K`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              fill="url(#colorValue)"
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default PortfolioChart;
