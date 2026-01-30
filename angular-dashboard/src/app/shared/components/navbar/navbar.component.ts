import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar class="navbar">
      <div class="navbar-brand">
        <mat-icon class="brand-icon">analytics</mat-icon>
        <span class="brand-text">E-Commerce Analytics</span>
      </div>
      <div class="navbar-links">
        <a mat-button routerLink="/executive" routerLinkActive="active-link">
          <mat-icon>dashboard</mat-icon>
          Executive
        </a>
        <a mat-button routerLink="/sales" routerLinkActive="active-link">
          <mat-icon>bar_chart</mat-icon>
          Sales Analytics
        </a>
      </div>
      <div class="navbar-actions">
        <button mat-icon-button (click)="clearFilters()" matTooltip="Clear Filters">
          <mat-icon [class.filter-active]="hasActiveFilters">filter_alt_off</mat-icon>
        </button>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .navbar {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      display: flex;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-icon { font-size: 28px; width: 28px; height: 28px; }
    .brand-text { font-size: 18px; font-weight: 600; letter-spacing: 0.5px; }
    .navbar-links {
      display: flex;
      gap: 8px;
      a {
        color: rgba(255,255,255,0.8);
        &.active-link {
          color: white;
          background: rgba(255,255,255,0.1);
        }
        mat-icon { margin-right: 4px; font-size: 18px; width: 18px; height: 18px; }
      }
    }
    .navbar-actions button { color: rgba(255,255,255,0.8); }
    .filter-active { color: #FF9800 !important; }
  `]
})
export class NavbarComponent implements OnInit {
  hasActiveFilters = false;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.filters$.subscribe(f => {
      this.hasActiveFilters = !!(f.state || f.category || f.dateRange);
    });
  }

  clearFilters(): void { this.dataService.clearFilters(); }
}
