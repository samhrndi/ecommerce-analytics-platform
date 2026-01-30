import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { RowClickEvent } from '../../../core/models/ecommerce.models';

export interface TableColumn {
  key: string;
  label: string;
  format?: 'text' | 'currency' | 'number' | 'percent' | 'rating';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatSortModule, MatPaginatorModule, MatCardModule, CurrencyPipe, DecimalPipe, PercentPipe],
  template: `
    <mat-card class="table-card">
      <mat-card-header>
        <mat-card-title class="table-title">{{ title }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="table-container">
          <table mat-table [dataSource]="dataSource" matSort class="data-table">
            @for (col of columns; track col.key) {
              <ng-container [matColumnDef]="col.key">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ col.label }}</th>
                <td mat-cell *matCellDef="let row">
                  @switch (col.format) {
                    @case ('currency') { {{ row[col.key] | currency:'BRL':'symbol':'1.0-0' }} }
                    @case ('number') { {{ row[col.key] | number:'1.0-0' }} }
                    @case ('percent') { {{ row[col.key] | number:'1.1-1' }}% }
                    @case ('rating') { {{ row[col.key] | number:'1.1-1' }} / 5.0 }
                    @default { {{ row[col.key] }} }
                  }
                </td>
              </ng-container>
            }
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                (click)="onRowClick(row)"
                [class.highlighted-row]="highlightPredicate ? highlightPredicate(row) : false"
                class="clickable-row">
            </tr>
          </table>
        </div>
        @if (paginated) {
          <mat-paginator [pageSize]="5" [pageSizeOptions]="[5, 10]" showFirstLastButtons></mat-paginator>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .table-card { height: 100%; }
    .table-title { font-size: 16px; font-weight: 600; color: #1a1a2e; }
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; }
    th.mat-mdc-header-cell { font-weight: 600; color: #555; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    td.mat-mdc-cell { font-size: 14px; }
    tr.clickable-row { cursor: pointer; }
    tr.clickable-row:hover { background-color: #e3f2fd; }
    tr.highlighted-row { background-color: #e8eaf6; font-weight: 500; }
  `]
})
export class DataTableComponent implements AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @Input() title = '';
  @Input() columns: TableColumn[] = [];
  @Input() set data(value: any[]) { this.dataSource.data = value; }
  @Input() paginated = false;
  @Input() highlightPredicate: ((row: any) => boolean) | null = null;
  @Output() rowClick = new EventEmitter<RowClickEvent>();

  dataSource = new MatTableDataSource<any>();

  get displayedColumns(): string[] {
    return this.columns.map(c => c.key);
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    if (this.paginated) {
      this.dataSource.paginator = this.paginator;
    }
  }

  onRowClick(row: any): void {
    this.rowClick.emit({ row });
  }
}
