import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, CurrencyPipe, DecimalPipe, PercentPipe],
  template: `
    <mat-card class="kpi-card" [class.trend-up]="trend === 'up'" [class.trend-down]="trend === 'down'">
      <mat-card-content>
        <div class="kpi-header">
          <mat-icon class="kpi-icon">{{ icon }}</mat-icon>
          <span class="kpi-label">{{ label }}</span>
        </div>
        <div class="kpi-value">
          @switch (format) {
            @case ('currency') { {{ value | currency:'BRL':'symbol':'1.0-0' }} }
            @case ('number') { {{ value | number:'1.0-0' }} }
            @case ('percent') { {{ value }}% }
            @case ('rating') { {{ value }}/5.0 }
          }
        </div>
        <div class="kpi-change" [class.positive]="change >= 0" [class.negative]="change < 0">
          <mat-icon class="change-icon">{{ change >= 0 ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          <span>{{ change >= 0 ? '+' : '' }}{{ change }}%</span>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .kpi-card {
      padding: 8px;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: default;
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
    }
    .kpi-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .kpi-icon {
      color: #3f51b5;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .kpi-label {
      font-size: 13px;
      color: #666;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-value {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 4px;
    }
    .kpi-change {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 600;
      &.positive { color: #4caf50; }
      &.negative { color: #f44336; }
    }
    .change-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
  `]
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() change = 0;
  @Input() trend: 'up' | 'down' | 'neutral' = 'neutral';
  @Input() icon = 'info';
  @Input() format: 'currency' | 'number' | 'percent' | 'rating' = 'number';
}
