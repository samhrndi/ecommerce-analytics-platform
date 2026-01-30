import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ChartClickEvent } from '../../../core/models/ecommerce.models';
import { dimColor } from '../../../core/utils/color.utils';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="chart-card">
      <mat-card-header>
        <mat-card-title class="chart-title">{{ title }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="chart-container">
          <canvas #chartCanvas></canvas>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .chart-card { height: 100%; }
    .chart-title { font-size: 16px; font-weight: 600; color: #1a1a2e; }
    .chart-container { position: relative; width: 100%; height: 300px; cursor: pointer; }
  `]
})
export class ChartCardComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() title = '';
  @Input() chartType: ChartType = 'bar';
  @Input() chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  @Input() chartOptions: ChartConfiguration['options'] = {};
  @Input() highlightIndex: number | null = null;
  @Output() chartClick = new EventEmitter<ChartClickEvent>();

  private chart: Chart | null = null;
  private originalColors: (string | string[])[] = [];

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.chart) return;
    if (changes['chartData'] || changes['chartOptions']) {
      this.chart.destroy();
      this.createChart();
    } else if (changes['highlightIndex']) {
      this.applyHighlight();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private createChart(): void {
    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: this.chartType,
      data: this.chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } },
        },
        onClick: (_event, elements) => {
          if (elements.length > 0) {
            const el = elements[0];
            const label = String(this.chartData.labels?.[el.index] ?? '');
            const value = Number(this.chartData.datasets[el.datasetIndex]?.data[el.index] ?? 0);
            this.chartClick.emit({ label, value, dataIndex: el.index, datasetIndex: el.datasetIndex });
          }
        },
        ...this.chartOptions,
      },
    });

    this.storeOriginalColors();
    this.applyHighlight();
  }

  private storeOriginalColors(): void {
    this.originalColors = this.chartData.datasets.map(ds => {
      const bg = ds.backgroundColor;
      return Array.isArray(bg) ? [...bg] : (bg as string);
    });
  }

  private applyHighlight(): void {
    if (!this.chart || this.chartType === 'line') return;

    this.chart.data.datasets.forEach((ds, dsIdx) => {
      const orig = this.originalColors[dsIdx];
      if (this.highlightIndex === null || this.highlightIndex === undefined) {
        ds.backgroundColor = Array.isArray(orig) ? [...orig] : orig;
      } else if (Array.isArray(orig)) {
        ds.backgroundColor = orig.map((c, i) =>
          i === this.highlightIndex ? c : dimColor(c as string)
        );
      }
    });
    this.chart.update();
  }
}
