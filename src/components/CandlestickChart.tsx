import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import './CandlestickChart.css';

interface CandlestickChartProps {
  data: {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
  }[];
  playerName: string;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, playerName }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with v4 API
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#16213e' },
        textColor: '#a0a0b0',
      },
      grid: {
        vertLines: { color: '#2a3b5f' },
        horzLines: { color: '#2a3b5f' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#2f3336',
      },
      rightPriceScale: {
        borderColor: '#2f3336',
      },
      crosshair: {
        vertLine: {
          color: '#667eea',
          labelBackgroundColor: '#667eea',
        },
        horzLine: {
          color: '#667eea',
          labelBackgroundColor: '#667eea',
        },
      },
    });

    chartRef.current = chart;

    // Add candlestick series with v4 API
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00ba7c',
      downColor: '#f4212e',
      borderVisible: false,
      wickUpColor: '#00ba7c',
      wickDownColor: '#f4212e',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (candlestickSeriesRef.current && data.length > 0) {
      // Convert data to the format lightweight-charts expects
      const formattedData = data.map(candle => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

      candlestickSeriesRef.current.setData(formattedData);

      // Fit content to chart
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [data]);

  return (
    <div className="candlestick-chart-container">
      <div className="chart-header">
        <h3>{playerName}</h3>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-color" style={{ background: '#00ba7c' }}></span>
            Up
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ background: '#f4212e' }}></span>
            Down
          </span>
        </div>
      </div>
      <div ref={chartContainerRef} className="chart-canvas" />
    </div>
  );
};

export default CandlestickChart;
