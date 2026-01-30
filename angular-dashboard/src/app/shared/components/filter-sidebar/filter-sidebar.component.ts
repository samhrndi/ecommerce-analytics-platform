import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';
import { DashboardFilters } from '../../../core/models/ecommerce.models';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSelectModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="filter-sidebar" [class.collapsed]="!visible">
      <div class="sidebar-header">
        @if (visible) { <h3>Filters</h3> }
        <button mat-icon-button (click)="toggleVisibility()" class="toggle-btn">
          <mat-icon>{{ visible ? 'chevron_left' : 'filter_list' }}</mat-icon>
        </button>
      </div>

      @if (visible) {
        <div class="filter-controls">
          @if (currentFilters.state || currentFilters.category) {
            <div class="active-filters">
              @if (currentFilters.state) {
                <mat-chip-row (removed)="clearFilter('state')">
                  State: {{ currentFilters.state }}
                  <mat-icon matChipRemove>cancel</mat-icon>
                </mat-chip-row>
              }
              @if (currentFilters.category) {
                <mat-chip-row (removed)="clearFilter('category')">
                  Category: {{ currentFilters.category }}
                  <mat-icon matChipRemove>cancel</mat-icon>
                </mat-chip-row>
              }
            </div>
          }

          @if (states.length > 0) {
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>State</mat-label>
              <mat-select [formControl]="stateControl" (selectionChange)="onStateChange($event)">
                <mat-option [value]="null">All States</mat-option>
                @for (state of states; track state) {
                  <mat-option [value]="state">{{ state }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }

          @if (categories.length > 0) {
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Category</mat-label>
              <mat-select [formControl]="categoryControl" (selectionChange)="onCategoryChange($event)">
                <mat-option [value]="null">All Categories</mat-option>
                @for (cat of categories; track cat) {
                  <mat-option [value]="cat">{{ cat }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }

          @if (currentFilters.state || currentFilters.category) {
            <button mat-stroked-button color="warn" (click)="clearAll()" class="clear-btn">
              <mat-icon>filter_alt_off</mat-icon>
              Clear All
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .filter-sidebar {
      width: 260px;
      min-height: calc(100vh - 64px);
      background: white;
      border-right: 1px solid #e0e0e0;
      padding: 16px;
      transition: width 0.2s ease;
      box-sizing: border-box;
    }
    .filter-sidebar.collapsed {
      width: 48px;
      padding: 8px 4px;
    }
    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      h3 { font-size: 16px; font-weight: 600; color: #1a1a2e; margin: 0; }
    }
    .toggle-btn { color: #666; }
    .filter-controls { display: flex; flex-direction: column; gap: 4px; }
    .filter-field { width: 100%; }
    .active-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
    .clear-btn { width: 100%; margin-top: 8px; }
  `]
})
export class FilterSidebarComponent implements OnInit, OnDestroy {
  @Input() states: string[] = [];
  @Input() categories: string[] = [];
  @Input() visible = true;
  @Output() filtersChanged = new EventEmitter<Partial<DashboardFilters>>();
  @Output() visibilityChange = new EventEmitter<boolean>();

  stateControl = new FormControl<string | null>(null);
  categoryControl = new FormControl<string | null>(null);
  currentFilters: DashboardFilters = { dateRange: null, state: null, category: null };

  private destroy$ = new Subject<void>();

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.filters$.pipe(takeUntil(this.destroy$)).subscribe(filters => {
      this.currentFilters = filters;
      this.stateControl.setValue(filters.state, { emitEvent: false });
      this.categoryControl.setValue(filters.category, { emitEvent: false });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onStateChange(event: MatSelectChange): void {
    this.dataService.updateFilters({ state: event.value });
    this.filtersChanged.emit({ state: event.value });
  }

  onCategoryChange(event: MatSelectChange): void {
    this.dataService.updateFilters({ category: event.value });
    this.filtersChanged.emit({ category: event.value });
  }

  clearFilter(key: 'state' | 'category'): void {
    this.dataService.updateFilters({ [key]: null });
    this.filtersChanged.emit({ [key]: null });
  }

  clearAll(): void {
    this.dataService.clearFilters();
    this.filtersChanged.emit({ state: null, category: null, dateRange: null });
  }

  toggleVisibility(): void {
    this.visible = !this.visible;
    this.visibilityChange.emit(this.visible);
  }
}
