import { Routes } from '@angular/router';
import { ExecutiveDashboardComponent } from './features/dashboard/executive-dashboard/executive-dashboard.component';
import { SalesAnalyticsDashboardComponent } from './features/dashboard/sales-analytics-dashboard/sales-analytics-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/executive', pathMatch: 'full' },
  { path: 'executive', component: ExecutiveDashboardComponent },
  { path: 'sales', component: SalesAnalyticsDashboardComponent },
  { path: '**', redirectTo: '/executive' },
];
