import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration } from 'chart.js';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { ChartCardComponent } from '../../../shared/components/chart-card/chart-card.component';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { FilterSidebarComponent } from '../../../shared/components/filter-sidebar/filter-sidebar.component';
import { DrillThroughDialogComponent } from '../../../shared/components/drill-through/drill-through-dialog.component';
import { DataService } from '../../../core/services/data.service';
import {
  ChartClickEvent, CrossFilterState, DashboardData, DashboardFilters,
  KPIMetric, ProductPerformance, SellerPerformance, CategoryMetric, CustomerSegment, RowClickEvent
} from '../../../core/models/ecommerce.models';

@Component({
  selector: 'app-sales-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, ChartCardComponent, DataTableComponent, FilterSidebarComponent, MatDialogModule],
  template: `
    <div class="dashboard-layout">
      <app-filter-sidebar
        [states]="availableStates"
        [categories]="availableCategories"
        [visible]="sidebarVisible"
        (filtersChanged)="onSidebarFilterChange($event)"
        (visibilityChange)="sidebarVisible = $event"
      />
      <div class="dashboard">
        <h1 class="dashboard-title">Sales Analytics Dashboard</h1>

        <!-- KPI Row -->
        <div class="kpi-grid">
          @for (kpi of kpis; track kpi.label) {
            <app-kpi-card
              [label]="kpi.label"
              [value]="kpi.value"
              [change]="kpi.change"
              [trend]="kpi.trend"
              [icon]="kpi.icon"
              [format]="kpi.format"
            />
          }
        </div>

        <!-- Sales Trend & Category Performance -->
        <div class="chart-row two-col">
          <app-chart-card
            title="Sales Trend (30 Days)"
            [chartType]="'line'"
            [chartData]="salesTrendData"
            [chartOptions]="lineChartOptions"
          />
          <app-chart-card
            title="Category Performance"
            [chartType]="'bar'"
            [chartData]="categoryChartData"
            [chartOptions]="barChartOptions"
            [highlightIndex]="categoryHighlight"
            (chartClick)="onCategoryChartClick($event)"
          />
        </div>

        <!-- Top Products & Top Sellers Tables -->
        <div class="chart-row two-col">
          <app-data-table
            title="Top 10 Products"
            [columns]="productColumns"
            [data]="topProducts"
            [paginated]="true"
            [highlightPredicate]="productHighlightFn"
            (rowClick)="onProductRowClick($event)"
          />
          <app-data-table
            title="Top 5 Sellers"
            [columns]="sellerColumns"
            [data]="topSellers"
            [highlightPredicate]="sellerHighlightFn"
            (rowClick)="onSellerRowClick($event)"
          />
        </div>

        <!-- Customer Segments & Category Mix -->
        <div class="chart-row two-col">
          <app-chart-card
            title="Customer Segments (RFM)"
            [chartType]="'bar'"
            [chartData]="segmentChartData"
            [chartOptions]="segmentChartOptions"
            [highlightIndex]="segmentHighlight"
            (chartClick)="onSegmentChartClick($event)"
          />
          <app-chart-card
            title="Product Category Mix"
            [chartType]="'doughnut'"
            [chartData]="categoryMixData"
            [chartOptions]="doughnutOptions"
            [highlightIndex]="categoryMixHighlight"
            (chartClick)="onCategoryMixClick($event)"
          />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout { display: flex; }
    .dashboard { flex: 1; padding: 24px; max-width: 1400px; margin: 0 auto; }
    .dashboard-title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin-bottom: 24px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .chart-row { display: grid; gap: 16px; margin-bottom: 24px; }
    .two-col { grid-template-columns: 1.5fr 1fr; }
    @media (max-width: 768px) {
      .dashboard-layout { flex-direction: column; }
      .two-col { grid-template-columns: 1fr; }
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class SalesAnalyticsDashboardComponent implements OnInit, OnDestroy {
  data: DashboardData | null = null;
  kpis: KPIMetric[] = [];
  topProducts: ProductPerformance[] = [];
  topSellers: SellerPerformance[] = [];
  availableStates: string[] = [];
  availableCategories: string[] = [];
  sidebarVisible = true;

  salesTrendData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  categoryChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  segmentChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  categoryMixData: ChartConfiguration['data'] = { labels: [], datasets: [] };

  categoryHighlight: number | null = null;
  categoryMixHighlight: number | null = null;
  segmentHighlight: number | null = null;
  productHighlightFn: ((row: any) => boolean) | null = null;
  sellerHighlightFn: ((row: any) => boolean) | null = null;

  private crossFilter: CrossFilterState = { source: null, filterType: null, filterValue: null };
  private destroy$ = new Subject<void>();

  productColumns: TableColumn[] = [
    { key: 'rank', label: 'Rank', format: 'number' },
    { key: 'category', label: 'Category' },
    { key: 'revenue', label: 'Revenue', format: 'currency' },
    { key: 'orders', label: 'Orders', format: 'number' },
    { key: 'avgPrice', label: 'Avg Price', format: 'currency' },
  ];

  sellerColumns: TableColumn[] = [
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'revenue', label: 'Revenue', format: 'currency' },
    { key: 'orders', label: 'Orders', format: 'number' },
    { key: 'avgRating', label: 'Rating', format: 'rating' },
    { key: 'fulfillmentRate', label: 'Fulfillment', format: 'percent' },
  ];

  lineChartOptions: ChartConfiguration['options'] = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: false } },
  };
  barChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { callback: (v) => `R$${(+v / 1000000).toFixed(1)}M` } } },
  };
  segmentChartOptions: ChartConfiguration['options'] = {
    plugins: { legend: { display: false } },
    scales: { y: { ticks: { callback: (v) => `${(+v / 1000).toFixed(0)}K` } } },
  };
  doughnutOptions: ChartConfiguration['options'] = {
    plugins: { legend: { position: 'right' } },
  };

  constructor(private dataService: DataService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.dataService.getSalesDashboard().subscribe(data => {
      this.data = data;
      this.kpis = data.kpis;
      this.topProducts = data.topProducts;
      this.topSellers = data.topSellers;
      this.availableCategories = data.categoryMetrics.map(c => c.category);
      this.availableStates = [...new Set(data.topSellers.map(s => s.state))];
      this.buildCharts(data.salesTrend, data.categoryMetrics, data.customerSegments);
    });

    this.dataService.crossFilter$.pipe(takeUntil(this.destroy$)).subscribe(cf => {
      this.crossFilter = cf;
      this.updateHighlights();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCategoryChartClick(event: ChartClickEvent): void {
    if (this.crossFilter.filterValue === event.label && this.crossFilter.filterType === 'category') {
      this.dataService.clearCrossFilter();
      this.dataService.updateFilters({ category: null });
    } else {
      this.dataService.setCrossFilter({ source: 'chart', filterType: 'category', filterValue: event.label });
      this.dataService.updateFilters({ category: event.label });
      this.openCategoryDrillThrough(event.label);
    }
  }

  onCategoryMixClick(event: ChartClickEvent): void {
    if (this.crossFilter.filterValue === event.label && this.crossFilter.filterType === 'category') {
      this.dataService.clearCrossFilter();
      this.dataService.updateFilters({ category: null });
    } else {
      this.dataService.setCrossFilter({ source: 'chart', filterType: 'category', filterValue: event.label });
      this.dataService.updateFilters({ category: event.label });
    }
  }

  onSegmentChartClick(event: ChartClickEvent): void {
    if (this.crossFilter.filterValue === event.label && this.crossFilter.filterType === 'segment') {
      this.dataService.clearCrossFilter();
    } else {
      this.dataService.setCrossFilter({ source: 'chart', filterType: 'segment', filterValue: event.label });
    }
  }

  onProductRowClick(event: RowClickEvent): void {
    this.dialog.open(DrillThroughDialogComponent, {
      data: { type: 'product', data: event.row as ProductPerformance },
      width: '500px',
    });
  }

  onSellerRowClick(event: RowClickEvent): void {
    this.dialog.open(DrillThroughDialogComponent, {
      data: { type: 'seller', data: event.row as SellerPerformance },
      width: '500px',
    });
  }

  onSidebarFilterChange(filters: Partial<DashboardFilters>): void {
    if (filters.category !== undefined) {
      if (filters.category) {
        this.dataService.setCrossFilter({ source: 'sidebar', filterType: 'category', filterValue: filters.category });
      } else {
        this.dataService.clearCrossFilter();
      }
    } else if (filters.state !== undefined) {
      if (filters.state) {
        this.dataService.setCrossFilter({ source: 'sidebar', filterType: 'state', filterValue: filters.state });
      } else {
        this.dataService.clearCrossFilter();
      }
    }
  }

  private openCategoryDrillThrough(categoryName: string): void {
    const catData = this.data?.categoryMetrics.find(c => c.category === categoryName);
    if (!catData) return;
    this.dialog.open(DrillThroughDialogComponent, {
      data: { type: 'category', data: catData },
      width: '500px',
    });
  }

  private updateHighlights(): void {
    if (!this.crossFilter.filterValue || !this.data) {
      this.categoryHighlight = null;
      this.categoryMixHighlight = null;
      this.segmentHighlight = null;
      this.productHighlightFn = null;
      this.sellerHighlightFn = null;
      return;
    }

    const val = this.crossFilter.filterValue;

    if (this.crossFilter.filterType === 'category') {
      const idx = this.data.categoryMetrics.findIndex(c => c.category === val);
      this.categoryHighlight = idx >= 0 ? idx : null;
      this.categoryMixHighlight = this.categoryHighlight;
      this.productHighlightFn = (row: any) => row.category === val;
      this.sellerHighlightFn = null;
      this.segmentHighlight = null;
    } else if (this.crossFilter.filterType === 'state') {
      this.categoryHighlight = null;
      this.categoryMixHighlight = null;
      this.segmentHighlight = null;
      this.productHighlightFn = null;
      this.sellerHighlightFn = (row: any) => row.state === val;
    } else if (this.crossFilter.filterType === 'segment') {
      const idx = this.data.customerSegments.findIndex(s => s.segment === val);
      this.segmentHighlight = idx >= 0 ? idx : null;
      this.categoryHighlight = null;
      this.categoryMixHighlight = null;
      this.productHighlightFn = null;
      this.sellerHighlightFn = null;
    } else {
      this.categoryHighlight = null;
      this.categoryMixHighlight = null;
      this.segmentHighlight = null;
      this.productHighlightFn = null;
      this.sellerHighlightFn = null;
    }
  }

  private buildCharts(
    salesTrend: any[],
    categories: CategoryMetric[],
    segments: CustomerSegment[]
  ): void {
    this.salesTrendData = {
      labels: salesTrend.map(d => d.label),
      datasets: [{
        data: salesTrend.map(d => d.value),
        borderColor: '#009688',
        backgroundColor: 'rgba(0,150,136,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
      }],
    };

    this.categoryChartData = {
      labels: categories.map(c => c.category),
      datasets: [{
        data: categories.map(c => c.revenue),
        backgroundColor: categories.map(() => '#3f51b5'),
        borderRadius: 4,
      }],
    };

    this.segmentChartData = {
      labels: segments.map(s => s.segment),
      datasets: [
        {
          label: 'Customers',
          data: segments.map(s => s.count),
          backgroundColor: segments.map(s => s.color),
          borderRadius: 4,
        },
      ],
    };

    const colors = ['#3f51b5', '#009688', '#FF9800', '#F44336', '#4CAF50', '#9C27B0', '#2196F3', '#795548'];
    this.categoryMixData = {
      labels: categories.map(c => c.category),
      datasets: [{
        data: categories.map(c => c.revenue),
        backgroundColor: colors.slice(0, categories.length),
      }],
    };
  }
}
