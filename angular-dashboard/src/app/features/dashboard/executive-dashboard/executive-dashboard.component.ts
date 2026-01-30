import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartType } from 'chart.js';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { ChartCardComponent } from '../../../shared/components/chart-card/chart-card.component';
import { FilterSidebarComponent } from '../../../shared/components/filter-sidebar/filter-sidebar.component';
import { DrillThroughDialogComponent } from '../../../shared/components/drill-through/drill-through-dialog.component';
import { DataService } from '../../../core/services/data.service';
import {
  ChartClickEvent, CrossFilterState, DashboardData, DashboardFilters, KPIMetric
} from '../../../core/models/ecommerce.models';

@Component({
  selector: 'app-executive-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, ChartCardComponent, FilterSidebarComponent, MatDialogModule],
  template: `
    <div class="dashboard-layout">
      <app-filter-sidebar
        [states]="availableStates"
        [categories]="[]"
        [visible]="sidebarVisible"
        (filtersChanged)="onSidebarFilterChange($event)"
        (visibilityChange)="sidebarVisible = $event"
      />
      <div class="dashboard">
        <h1 class="dashboard-title">Executive Dashboard</h1>

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

        <!-- Revenue & Order Status -->
        <div class="chart-row two-col">
          <app-chart-card
            title="Revenue Over Time"
            [chartType]="'line'"
            [chartData]="revenueChartData"
            [chartOptions]="lineChartOptions"
          />
          <app-chart-card
            title="Order Status Distribution"
            [chartType]="'doughnut'"
            [chartData]="orderStatusData"
            [chartOptions]="doughnutOptions"
            [highlightIndex]="orderStatusHighlight"
            (chartClick)="onOrderStatusClick($event)"
          />
        </div>

        <!-- Top States & Payment Types -->
        <div class="chart-row two-col">
          <app-chart-card
            title="Top 10 States by Revenue"
            [chartType]="'bar'"
            [chartData]="statesChartData"
            [chartOptions]="barChartOptions"
            [highlightIndex]="statesHighlight"
            (chartClick)="onStatesClick($event)"
          />
          <app-chart-card
            title="Payment Type Distribution"
            [chartType]="'pie'"
            [chartData]="paymentChartData"
            [chartOptions]="doughnutOptions"
            [highlightIndex]="paymentHighlight"
            (chartClick)="onPaymentTypeClick($event)"
          />
        </div>

        <!-- Reviews & Delivery -->
        <div class="chart-row two-col">
          <app-chart-card
            title="Review Score Distribution"
            [chartType]="'bar'"
            [chartData]="reviewChartData"
            [chartOptions]="horizontalBarOptions"
          />
          <div class="delivery-summary">
            <h3>Delivery Metrics</h3>
            <div class="delivery-grid">
              <div class="delivery-item">
                <span class="delivery-value">{{ data?.deliveryMetrics?.onTimeRate }}%</span>
                <span class="delivery-label">On-Time Rate</span>
              </div>
              <div class="delivery-item">
                <span class="delivery-value">{{ data?.deliveryMetrics?.avgDeliveryDays }} days</span>
                <span class="delivery-label">Avg Delivery Time</span>
              </div>
              <div class="delivery-item positive">
                <span class="delivery-value">{{ data?.deliveryMetrics?.earlyDeliveries | number }}</span>
                <span class="delivery-label">Early Deliveries</span>
              </div>
              <div class="delivery-item negative">
                <span class="delivery-value">{{ data?.deliveryMetrics?.lateDeliveries | number }}</span>
                <span class="delivery-label">Late Deliveries</span>
              </div>
            </div>
          </div>
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
    .delivery-summary {
      background: white; border-radius: 8px; padding: 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.08);
      h3 { font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 16px; }
    }
    .delivery-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .delivery-item {
      text-align: center; padding: 16px; border-radius: 8px; background: #f8f9fa;
      display: flex; flex-direction: column; gap: 4px;
      &.positive { background: #e8f5e9; }
      &.negative { background: #ffebee; }
    }
    .delivery-value { font-size: 24px; font-weight: 700; color: #1a1a2e; }
    .delivery-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    @media (max-width: 768px) {
      .dashboard-layout { flex-direction: column; }
      .two-col { grid-template-columns: 1fr; }
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class ExecutiveDashboardComponent implements OnInit, OnDestroy {
  data: DashboardData | null = null;
  kpis: KPIMetric[] = [];
  availableStates: string[] = [];
  sidebarVisible = true;

  revenueChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  orderStatusData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  statesChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  paymentChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  reviewChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

  statesHighlight: number | null = null;
  orderStatusHighlight: number | null = null;
  paymentHighlight: number | null = null;

  private crossFilter: CrossFilterState = { source: null, filterType: null, filterValue: null };
  private destroy$ = new Subject<void>();

  lineChartOptions: ChartConfiguration['options'] = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: false, ticks: { callback: (v) => `R$${(+v / 1000000).toFixed(1)}M` } } },
  };
  barChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { callback: (v) => `R$${(+v / 1000000).toFixed(1)}M` } } },
  };
  horizontalBarOptions: ChartConfiguration['options'] = {
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { callback: (v) => `${v}%` } } },
  };
  doughnutOptions: ChartConfiguration['options'] = {
    plugins: { legend: { position: 'right' } },
  };

  constructor(private dataService: DataService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.dataService.getExecutiveDashboard().subscribe(data => {
      this.data = data;
      this.kpis = data.kpis;
      this.availableStates = data.topStates.map(s => s.state);
      this.buildCharts(data);
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

  onStatesClick(event: ChartClickEvent): void {
    if (this.crossFilter.filterValue === event.label && this.crossFilter.filterType === 'state') {
      this.dataService.clearCrossFilter();
      this.dataService.updateFilters({ state: null });
    } else {
      this.dataService.setCrossFilter({ source: 'chart', filterType: 'state', filterValue: event.label });
      this.dataService.updateFilters({ state: event.label });
      this.openStateDrillThrough(event.label);
    }
  }

  onOrderStatusClick(event: ChartClickEvent): void {
    if (this.crossFilter.filterValue === event.label && this.crossFilter.filterType === 'status') {
      this.dataService.clearCrossFilter();
    } else {
      this.dataService.setCrossFilter({ source: 'chart', filterType: 'status', filterValue: event.label });
    }
  }

  onPaymentTypeClick(event: ChartClickEvent): void {
    if (this.crossFilter.filterValue === event.label && this.crossFilter.filterType === 'paymentType') {
      this.dataService.clearCrossFilter();
    } else {
      this.dataService.setCrossFilter({ source: 'chart', filterType: 'paymentType', filterValue: event.label });
    }
  }

  onSidebarFilterChange(filters: Partial<DashboardFilters>): void {
    if (filters.state !== undefined) {
      if (filters.state) {
        this.dataService.setCrossFilter({ source: 'sidebar', filterType: 'state', filterValue: filters.state });
      } else {
        this.dataService.clearCrossFilter();
      }
    }
  }

  private openStateDrillThrough(stateName: string): void {
    const stateData = this.data?.topStates.find(s => s.state === stateName);
    if (!stateData) return;
    this.dialog.open(DrillThroughDialogComponent, {
      data: { type: 'state', data: stateData },
      width: '500px',
    });
  }

  private updateHighlights(): void {
    if (!this.crossFilter.filterValue || !this.data) {
      this.statesHighlight = null;
      this.orderStatusHighlight = null;
      this.paymentHighlight = null;
      return;
    }
    this.statesHighlight = this.crossFilter.filterType === 'state'
      ? this.data.topStates.findIndex(s => s.state === this.crossFilter.filterValue) : null;
    this.orderStatusHighlight = this.crossFilter.filterType === 'status'
      ? this.data.orderStatuses.findIndex(s => s.status === this.crossFilter.filterValue) : null;
    this.paymentHighlight = this.crossFilter.filterType === 'paymentType'
      ? this.data.paymentTypes.findIndex(p => p.type === this.crossFilter.filterValue) : null;

    if (this.statesHighlight === -1) this.statesHighlight = null;
    if (this.orderStatusHighlight === -1) this.orderStatusHighlight = null;
    if (this.paymentHighlight === -1) this.paymentHighlight = null;
  }

  private buildCharts(data: DashboardData): void {
    this.revenueChartData = {
      labels: data.revenueTimeSeries.map(d => d.label),
      datasets: [{
        data: data.revenueTimeSeries.map(d => d.value),
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63,81,181,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#3f51b5',
      }],
    };

    this.orderStatusData = {
      labels: data.orderStatuses.map(s => s.status),
      datasets: [{
        data: data.orderStatuses.map(s => s.percentage),
        backgroundColor: ['#4CAF50', '#2196F3', '#F44336', '#FF9800'],
      }],
    };

    this.statesChartData = {
      labels: data.topStates.map(s => s.state),
      datasets: [{
        data: data.topStates.map(s => s.revenue),
        backgroundColor: data.topStates.map(() => '#3f51b5'),
        borderRadius: 4,
      }],
    };

    this.paymentChartData = {
      labels: data.paymentTypes.map(p => p.type),
      datasets: [{
        data: data.paymentTypes.map(p => p.percentage),
        backgroundColor: ['#3f51b5', '#009688', '#FF9800', '#F44336'],
      }],
    };

    this.reviewChartData = {
      labels: data.reviewDistribution.map(r => `${r.score} Stars`),
      datasets: [{
        data: data.reviewDistribution.map(r => r.percentage),
        backgroundColor: ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336'],
        borderRadius: 4,
      }],
    };
  }
}
