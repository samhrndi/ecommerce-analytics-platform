export interface SalesMetric {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
}

export interface KPIMetric {
  label: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  format: 'currency' | 'number' | 'percent' | 'rating';
}

export interface OrderStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface ProductPerformance {
  rank: number;
  productId: string;
  category: string;
  revenue: number;
  orders: number;
  avgPrice: number;
  avgReview: number;
}

export interface CategoryMetric {
  category: string;
  revenue: number;
  orders: number;
  avgPrice: number;
  productCount: number;
}

export interface SellerPerformance {
  sellerId: string;
  city: string;
  state: string;
  revenue: number;
  orders: number;
  avgRating: number;
  fulfillmentRate: number;
}

export interface CustomerSegment {
  segment: string;
  count: number;
  revenue: number;
  avgOrderValue: number;
  color: string;
}

export interface GeographicMetric {
  state: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface TimeSeries {
  date: string;
  value: number;
  label?: string;
}

export interface ReviewMetric {
  score: number;
  count: number;
  percentage: number;
}

export interface PaymentTypeMetric {
  type: string;
  count: number;
  value: number;
  percentage: number;
}

export interface DeliveryMetric {
  onTimeRate: number;
  avgDeliveryDays: number;
  lateDeliveries: number;
  earlyDeliveries: number;
}

export interface DashboardFilters {
  dateRange: { start: Date; end: Date } | null;
  state: string | null;
  category: string | null;
}

export interface ChartClickEvent {
  label: string;
  value: number;
  dataIndex: number;
  datasetIndex: number;
}

export interface RowClickEvent {
  row: any;
}

export interface CrossFilterState {
  source: 'chart' | 'sidebar' | 'table' | null;
  filterType: 'state' | 'category' | 'status' | 'paymentType' | 'segment' | null;
  filterValue: string | null;
}

export interface DrillThroughData {
  type: 'product' | 'seller' | 'state' | 'category';
  data: ProductPerformance | SellerPerformance | GeographicMetric | CategoryMetric;
}

export interface DashboardData {
  kpis: KPIMetric[];
  salesMetrics: SalesMetric;
  orderStatuses: OrderStatus[];
  topStates: GeographicMetric[];
  paymentTypes: PaymentTypeMetric[];
  reviewDistribution: ReviewMetric[];
  revenueTimeSeries: TimeSeries[];
  deliveryMetrics: DeliveryMetric;
  topProducts: ProductPerformance[];
  topSellers: SellerPerformance[];
  categoryMetrics: CategoryMetric[];
  customerSegments: CustomerSegment[];
  salesTrend: TimeSeries[];
}
