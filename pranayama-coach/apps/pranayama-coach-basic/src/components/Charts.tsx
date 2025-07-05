import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LineChart, BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: screenWidth } = Dimensions.get('window');

interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
}

interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface ProgressData {
  labels: string[];
  data: number[];
}

interface ChartsProps {
  type: 'line' | 'bar' | 'pie' | 'progress';
  data: ChartData | PieChartData[] | ProgressData;
  title?: string;
  subtitle?: string;
  height?: number;
  color?: string;
  showLegend?: boolean;
  showValues?: boolean;
  bezier?: boolean;
  withDots?: boolean;
  withInnerLines?: boolean;
  withOuterLines?: boolean;
  withVerticalLines?: boolean;
  withHorizontalLines?: boolean;
  yAxisSuffix?: string;
  yAxisInterval?: number;
  fromZero?: boolean;
  segments?: number;
}

export const Charts: React.FC<ChartsProps> = ({
  type,
  data,
  title,
  subtitle,
  height = 220,
  color = '#3b82f6',
  showLegend = true,
  showValues = false,
  bezier = false,
  withDots = true,
  withInnerLines = true,
  withOuterLines = true,
  withVerticalLines = true,
  withHorizontalLines = true,
  yAxisSuffix = '',
  yAxisInterval = 1,
  fromZero = false,
  segments = 4,
}) => {
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: withDots ? '4' : '0',
      strokeWidth: '2',
      stroke: color,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: withInnerLines ? '#e5e7eb' : 'transparent',
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: 12,
    },
    yAxisSuffix,
    yAxisInterval,
    fromZero,
    segments,
    fillShadowGradient: color,
    fillShadowGradientOpacity: 0.1,
  };

  const pieChartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  const progressChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => color,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    strokeWidth: 8,
    baseLabelColor: '#6b7280',
    fillShadowGradient: color,
    fillShadowGradientOpacity: 0.1,
  };

  const renderChart = () => {
    const chartWidth = screenWidth - 40;

    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data as ChartData}
            width={chartWidth}
            height={height}
            chartConfig={chartConfig}
            bezier={bezier}
            style={styles.chart}
            withDots={withDots}
            withInnerLines={withInnerLines}
            withOuterLines={withOuterLines}
            withVerticalLines={withVerticalLines}
            withHorizontalLines={withHorizontalLines}
            fromZero={fromZero}
            segments={segments}
          />
        );
      
      case 'bar':
        return (
          <BarChart
            data={data as ChartData}
            width={chartWidth}
            height={height}
            chartConfig={chartConfig}
            style={styles.chart}
            withInnerLines={withInnerLines}
            withOuterLines={withOuterLines}
            withVerticalLines={withVerticalLines}
            withHorizontalLines={withHorizontalLines}
            fromZero={fromZero}
            segments={segments}
            showValuesOnTopOfBars={showValues}
            showBarTops={false}
          />
        );
      
      case 'pie':
        return (
          <PieChart
            data={data as PieChartData[]}
            width={chartWidth}
            height={height}
            chartConfig={pieChartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
            center={[10, 0]}
            hasLegend={showLegend}
          />
        );
      
      case 'progress':
        const progressData = data as ProgressData;
        return (
          <ProgressChart
            data={{
              labels: progressData.labels,
              data: progressData.data.map(value => value / 100), // Convert to 0-1 range
            }}
            width={chartWidth}
            height={height}
            strokeWidth={8}
            radius={32}
            chartConfig={progressChartConfig}
            style={styles.chart}
            hideLegend={!showLegend}
          />
        );
      
      default:
        return null;
    }
  };

  const getAverageValue = () => {
    if (type === 'pie') {
      const pieData = data as PieChartData[];
      return pieData.reduce((sum, item) => sum + item.population, 0) / pieData.length;
    }
    
    if (type === 'progress') {
      const progressData = data as ProgressData;
      return progressData.data.reduce((sum, value) => sum + value, 0) / progressData.data.length;
    }
    
    const chartData = data as ChartData;
    if (chartData.datasets && chartData.datasets.length > 0) {
      const allValues = chartData.datasets[0].data;
      return allValues.reduce((sum, value) => sum + value, 0) / allValues.length;
    }
    
    return 0;
  };

  const getTrendDirection = () => {
    if (type === 'pie' || type === 'progress') return null;
    
    const chartData = data as ChartData;
    if (chartData.datasets && chartData.datasets.length > 0) {
      const values = chartData.datasets[0].data;
      if (values.length < 2) return null;
      
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const percentChange = ((lastValue - firstValue) / firstValue) * 100;
      
      return {
        direction: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'stable',
        percentage: Math.abs(percentChange),
      };
    }
    
    return null;
  };

  const trend = getTrendDirection();
  const averageValue = getAverageValue();

  return (
    <View style={styles.container}>
      {(title || subtitle) && (
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          
          {trend && (
            <View style={styles.trendContainer}>
              <Ionicons
                name={
                  trend.direction === 'up'
                    ? 'trending-up'
                    : trend.direction === 'down'
                    ? 'trending-down'
                    : 'remove'
                }
                size={16}
                color={
                  trend.direction === 'up'
                    ? '#22c55e'
                    : trend.direction === 'down'
                    ? '#ef4444'
                    : '#6b7280'
                }
              />
              <Text
                style={[
                  styles.trendText,
                  {
                    color:
                      trend.direction === 'up'
                        ? '#22c55e'
                        : trend.direction === 'down'
                        ? '#ef4444'
                        : '#6b7280',
                  },
                ]}
              >
                {trend.percentage.toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.chartContainer}>
        {renderChart()}
      </View>

      <View style={styles.footer}>
        <Text style={styles.averageText}>
          Average: {averageValue.toFixed(1)}{yAxisSuffix}
        </Text>
        
        {type === 'line' || type === 'bar' ? (
          <Text style={styles.dataPointsText}>
            {(data as ChartData).datasets?.[0]?.data.length || 0} data points
          </Text>
        ) : type === 'pie' ? (
          <Text style={styles.dataPointsText}>
            {(data as PieChartData[]).length} categories
          </Text>
        ) : (
          <Text style={styles.dataPointsText}>
            {(data as ProgressData).data.length} metrics
          </Text>
        )}
      </View>
    </View>
  );
};

// Preset chart components for common use cases
export const HeartRateChart: React.FC<{ data: ChartData; title?: string }> = ({ data, title }) => (
  <Charts
    type="line"
    data={data}
    title={title || 'Heart Rate'}
    color="#ef4444"
    yAxisSuffix=" BPM"
    bezier
    height={200}
  />
);

export const HRVChart: React.FC<{ data: ChartData; title?: string }> = ({ data, title }) => (
  <Charts
    type="line"
    data={data}
    title={title || 'Heart Rate Variability'}
    color="#22c55e"
    yAxisSuffix=" ms"
    bezier
    height={200}
  />
);

export const BreathingRateChart: React.FC<{ data: ChartData; title?: string }> = ({ data, title }) => (
  <Charts
    type="bar"
    data={data}
    title={title || 'Breathing Rate'}
    color="#3b82f6"
    yAxisSuffix=" BPM"
    height={200}
  />
);

export const StressLevelChart: React.FC<{ data: ChartData; title?: string }> = ({ data, title }) => (
  <Charts
    type="line"
    data={data}
    title={title || 'Stress Level'}
    color="#f59e0b"
    yAxisSuffix="/10"
    bezier
    height={200}
    segments={5}
  />
);

export const SessionDistributionChart: React.FC<{ data: PieChartData[]; title?: string }> = ({ data, title }) => (
  <Charts
    type="pie"
    data={data}
    title={title || 'Session Distribution'}
    height={220}
    showLegend
  />
);

export const ProgressGoalsChart: React.FC<{ data: ProgressData; title?: string }> = ({ data, title }) => (
  <Charts
    type="progress"
    data={data}
    title={title || 'Progress Goals'}
    color="#8b5cf6"
    height={200}
    showLegend
  />
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  averageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  dataPointsText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

// Example usage and data generators for testing
export const generateMockLineData = (points: number = 7): ChartData => ({
  labels: Array.from({ length: points }, (_, i) => `Day ${i + 1}`),
  datasets: [{
    data: Array.from({ length: points }, () => Math.floor(Math.random() * 40) + 60),
  }],
});

export const generateMockBarData = (points: number = 5): ChartData => ({
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].slice(0, points),
  datasets: [{
    data: Array.from({ length: points }, () => Math.floor(Math.random() * 10) + 10),
  }],
});

export const generateMockPieData = (): PieChartData[] => [
  {
    name: 'Nadi Shodhana',
    population: 45,
    color: '#22c55e',
    legendFontColor: '#374151',
    legendFontSize: 12,
  },
  {
    name: 'Box Breathing',
    population: 30,
    color: '#3b82f6',
    legendFontColor: '#374151',
    legendFontSize: 12,
  },
  {
    name: 'Meditation',
    population: 25,
    color: '#8b5cf6',
    legendFontColor: '#374151',
    legendFontSize: 12,
  },
];

export const generateMockProgressData = (): ProgressData => ({
  labels: ['Sessions', 'Minutes', 'Streak', 'Goals'],
  data: [85, 72, 90, 65], // Percentage values
});