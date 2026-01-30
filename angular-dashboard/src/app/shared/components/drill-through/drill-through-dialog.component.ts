import { Component, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import {
  DrillThroughData, ProductPerformance, SellerPerformance,
  GeographicMetric, CategoryMetric
} from '../../../core/models/ecommerce.models';

@Component({
  selector: 'app-drill-through-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, CurrencyPipe, DecimalPipe],
  template: `
    <div class="drill-through">
      <div class="dialog-header">
        <h2>{{ headerTitle }}</h2>
        <button mat-icon-button mat-dialog-close><mat-icon>close</mat-icon></button>
      </div>
      <mat-divider />
      <div class="dialog-body">
        @switch (data.type) {
          @case ('product') {
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Product ID</span><span class="detail-value id-value">{{ product.productId }}</span></div>
              <div class="detail-item"><span class="detail-label">Category</span><span class="detail-value">{{ product.category }}</span></div>
              <div class="detail-item"><span class="detail-label">Revenue</span><span class="detail-value">{{ product.revenue | currency:'BRL':'symbol':'1.0-0' }}</span></div>
              <div class="detail-item"><span class="detail-label">Orders</span><span class="detail-value">{{ product.orders | number }}</span></div>
              <div class="detail-item"><span class="detail-label">Avg Price</span><span class="detail-value">{{ product.avgPrice | currency:'BRL':'symbol':'1.2-2' }}</span></div>
              <div class="detail-item"><span class="detail-label">Avg Review</span><span class="detail-value">{{ product.avgReview | number:'1.1-1' }} / 5.0</span></div>
              <div class="detail-item"><span class="detail-label">Rank</span><span class="detail-value">#{{ product.rank }}</span></div>
              <div class="detail-item"><span class="detail-label">Revenue per Order</span><span class="detail-value">{{ product.revenue / product.orders | currency:'BRL':'symbol':'1.2-2' }}</span></div>
            </div>
          }
          @case ('seller') {
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Seller ID</span><span class="detail-value id-value">{{ seller.sellerId }}</span></div>
              <div class="detail-item"><span class="detail-label">Location</span><span class="detail-value">{{ seller.city }}, {{ seller.state }}</span></div>
              <div class="detail-item"><span class="detail-label">Revenue</span><span class="detail-value">{{ seller.revenue | currency:'BRL':'symbol':'1.0-0' }}</span></div>
              <div class="detail-item"><span class="detail-label">Orders</span><span class="detail-value">{{ seller.orders | number }}</span></div>
              <div class="detail-item"><span class="detail-label">Avg Rating</span><span class="detail-value">{{ seller.avgRating | number:'1.1-1' }} / 5.0</span></div>
              <div class="detail-item"><span class="detail-label">Fulfillment Rate</span><span class="detail-value">{{ seller.fulfillmentRate | number:'1.1-1' }}%</span></div>
              <div class="detail-item"><span class="detail-label">Revenue per Order</span><span class="detail-value">{{ seller.revenue / seller.orders | currency:'BRL':'symbol':'1.2-2' }}</span></div>
            </div>
          }
          @case ('state') {
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">State</span><span class="detail-value">{{ state.state }}</span></div>
              <div class="detail-item"><span class="detail-label">Revenue</span><span class="detail-value">{{ state.revenue | currency:'BRL':'symbol':'1.0-0' }}</span></div>
              <div class="detail-item"><span class="detail-label">Orders</span><span class="detail-value">{{ state.orders | number }}</span></div>
              <div class="detail-item"><span class="detail-label">Customers</span><span class="detail-value">{{ state.customers | number }}</span></div>
              <div class="detail-item"><span class="detail-label">Revenue / Customer</span><span class="detail-value">{{ state.revenue / state.customers | currency:'BRL':'symbol':'1.0-0' }}</span></div>
              <div class="detail-item"><span class="detail-label">Orders / Customer</span><span class="detail-value">{{ state.orders / state.customers | number:'1.1-1' }}</span></div>
            </div>
          }
          @case ('category') {
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Category</span><span class="detail-value">{{ category.category }}</span></div>
              <div class="detail-item"><span class="detail-label">Revenue</span><span class="detail-value">{{ category.revenue | currency:'BRL':'symbol':'1.0-0' }}</span></div>
              <div class="detail-item"><span class="detail-label">Orders</span><span class="detail-value">{{ category.orders | number }}</span></div>
              <div class="detail-item"><span class="detail-label">Avg Price</span><span class="detail-value">{{ category.avgPrice | currency:'BRL':'symbol':'1.2-2' }}</span></div>
              <div class="detail-item"><span class="detail-label">Product Count</span><span class="detail-value">{{ category.productCount | number }}</span></div>
              <div class="detail-item"><span class="detail-label">Revenue / Product</span><span class="detail-value">{{ category.revenue / category.productCount | currency:'BRL':'symbol':'1.0-0' }}</span></div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .drill-through { padding: 0; min-width: 420px; }
    .dialog-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 24px;
      h2 { margin: 0; font-size: 20px; font-weight: 600; color: #1a1a2e; }
    }
    .dialog-body { padding: 24px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .detail-item {
      display: flex; flex-direction: column; gap: 4px;
      padding: 12px; background: #f8f9fa; border-radius: 8px;
    }
    .detail-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }
    .detail-value { font-size: 18px; font-weight: 600; color: #1a1a2e; }
    .id-value { font-size: 13px; font-family: monospace; word-break: break-all; }
  `]
})
export class DrillThroughDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DrillThroughData) {}

  get headerTitle(): string {
    switch (this.data.type) {
      case 'product': return `Product #${this.product.rank} - ${this.product.category}`;
      case 'seller': return `Seller - ${this.seller.city}, ${this.seller.state}`;
      case 'state': return `State - ${this.state.state}`;
      case 'category': return `Category - ${this.category.category}`;
    }
  }

  get product(): ProductPerformance { return this.data.data as ProductPerformance; }
  get seller(): SellerPerformance { return this.data.data as SellerPerformance; }
  get state(): GeographicMetric { return this.data.data as GeographicMetric; }
  get category(): CategoryMetric { return this.data.data as CategoryMetric; }
}
