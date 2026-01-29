"""
Load Brazilian E-Commerce CSV files to Snowflake RAW layer
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, TypedDict

import pandas as pd

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ecommerce_analytics.snowflake.connector import SnowflakeConnector


class LoadResult(TypedDict, total=False):
    """Type definition for load operation results."""
    status: str
    reason: str
    rows: int
    columns: int
    error: str


class EcommerceDataLoader:
    """Load e-commerce CSV files to Snowflake."""

    # Map CSV files to Snowflake table names
    FILE_TABLE_MAPPING: dict[str, str] = {
        'olist_customers_dataset.csv': 'CUSTOMERS',
        'olist_geolocation_dataset.csv': 'GEOLOCATION',
        'olist_order_items_dataset.csv': 'ORDER_ITEMS',
        'olist_order_payments_dataset.csv': 'ORDER_PAYMENTS',
        'olist_order_reviews_dataset.csv': 'ORDER_REVIEWS',
        'olist_orders_dataset.csv': 'ORDERS',
        'olist_products_dataset.csv': 'PRODUCTS',
        'olist_sellers_dataset.csv': 'SELLERS',
        'product_category_name_translation.csv': 'PRODUCT_CATEGORY_TRANSLATION'
    }

    def __init__(self, data_dir: str = 'data/raw') -> None:
        """
        Initialize the data loader.

        Args:
            data_dir: Path to directory containing CSV files.
        """
        self.data_dir: Path = Path(data_dir)
        self.sf: SnowflakeConnector = SnowflakeConnector(use_key_auth=True)
        self.file_table_mapping: dict[str, str] = self.FILE_TABLE_MAPPING.copy()

    def load_all_files(self, schema: str = 'RAW') -> dict[str, LoadResult]:
        """
        Load all CSV files to Snowflake.

        Args:
            schema: Target Snowflake schema. Defaults to 'RAW'.

        Returns:
            Dictionary mapping table names to their load results.
        """
        print(f"\nLoading Brazilian E-Commerce data to Snowflake...")
        print(f"Database: {self.sf.database}")
        print(f"Schema: {schema}")
        print(f"Data directory: {self.data_dir.absolute()}\n")

        if not self.data_dir.exists():
            print(f"✗ Data directory does not exist: {self.data_dir.absolute()}")
            print(f"  Please create it or download CSV files to this location")
            return {}

        results: dict[str, LoadResult] = {}

        for csv_file, table_name in self.file_table_mapping.items():
            file_path = self.data_dir / csv_file

            if not file_path.exists():
                print(f"⚠ File not found: {csv_file}")
                results[table_name] = {'status': 'skipped', 'reason': 'file not found'}
                continue

            try:
                print(f"Loading {csv_file} → {table_name}...")

                # Read CSV
                df: pd.DataFrame = pd.read_csv(file_path)
                print(f"  Rows: {len(df):,} | Columns: {len(df.columns)}")

                # Load to Snowflake
                success: bool = self.sf.load_csv_to_snowflake(
                    df=df,
                    table_name=table_name,
                    schema=schema,
                    if_exists='replace'
                )

                results[table_name] = {
                    'status': 'success' if success else 'failed',
                    'rows': len(df),
                    'columns': len(df.columns)
                }

            except Exception as e:
                print(f"✗ Error loading {csv_file}: {e}")
                results[table_name] = {'status': 'error', 'error': str(e)}

        # Print summary
        self._print_summary(results)

        return results

    def _print_summary(self, results: dict[str, LoadResult]) -> None:
        """
        Print a summary of load results.

        Args:
            results: Dictionary mapping table names to their load results.
        """
        print("\n" + "=" * 70)
        print("LOAD SUMMARY")
        print("=" * 70)
        for table, info in results.items():
            status = info['status']
            symbol = '✓' if status == 'success' else '✗'
            print(f"{symbol} {table}: {status}")
            if 'rows' in info:
                print(f"   {info['rows']:,} rows loaded")
        print("=" * 70)


def main() -> None:
    """Main execution entry point."""
    # Test connection
    sf = SnowflakeConnector(use_key_auth=True)
    if not sf.test_connection():
        print("Connection test failed. Please check your credentials.")
        return

    # Load data
    loader = EcommerceDataLoader(data_dir='data/raw')
    loader.load_all_files(schema='RAW')


if __name__ == "__main__":
    main()
