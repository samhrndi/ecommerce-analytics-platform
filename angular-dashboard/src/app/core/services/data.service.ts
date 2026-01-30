import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CrossFilterState, DashboardData, DashboardFilters } from '../models/ecommerce.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DataService {
  private filtersSubject = new BehaviorSubject<DashboardFilters>({
    dateRange: null,
    state: null,
    category: null,
  });
  filters$ = this.filtersSubject.asObservable();

  private crossFilterSubject = new BehaviorSubject<CrossFilterState>({
    source: null, filterType: null, filterValue: null,
  });
  crossFilter$ = this.crossFilterSubject.asObservable();

  constructor(private api: ApiService) {}

  updateFilters(filters: Partial<DashboardFilters>): void {
    this.filtersSubject.next({ ...this.filtersSubject.value, ...filters });
  }

  clearFilters(): void {
    this.filtersSubject.next({ dateRange: null, state: null, category: null });
    this.clearCrossFilter();
  }

  setCrossFilter(state: CrossFilterState): void {
    this.crossFilterSubject.next(state);
  }

  clearCrossFilter(): void {
    this.crossFilterSubject.next({ source: null, filterType: null, filterValue: null });
  }

  getExecutiveDashboard(): Observable<DashboardData> {
    return this.api.getExecutiveDashboard();
  }

  getSalesDashboard(): Observable<DashboardData> {
    return this.api.getSalesDashboard();
  }
}
