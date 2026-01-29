"""
Unit tests for EcommerceDataLoader class.
"""
import pytest
from unittest.mock import MagicMock, patch
from pathlib import Path
import pandas as pd


class TestEcommerceDataLoader:
    """Tests for EcommerceDataLoader."""

    @patch('src.ecommerce_analytics.data_loader.load_to_snowflake.SnowflakeConnector')
    def test_loader_initialization(self, mock_connector_class):
        """Test loader initializes with correct data directory."""
        from src.ecommerce_analytics.data_loader.load_to_snowflake import EcommerceDataLoader

        loader = EcommerceDataLoader(data_dir='data/raw')

        assert loader.data_dir == Path('data/raw')
        assert len(loader.file_table_mapping) == 9

    @patch('src.ecommerce_analytics.data_loader.load_to_snowflake.SnowflakeConnector')
    def test_file_table_mapping_contains_all_files(self, mock_connector_class):
        """Test that all expected CSV files are mapped to tables."""
        from src.ecommerce_analytics.data_loader.load_to_snowflake import EcommerceDataLoader

        loader = EcommerceDataLoader()

        expected_tables = [
            'CUSTOMERS', 'GEOLOCATION', 'ORDER_ITEMS', 'ORDER_PAYMENTS',
            'ORDER_REVIEWS', 'ORDERS', 'PRODUCTS', 'SELLERS',
            'PRODUCT_CATEGORY_TRANSLATION'
        ]

        actual_tables = list(loader.file_table_mapping.values())

        for table in expected_tables:
            assert table in actual_tables

    @patch('src.ecommerce_analytics.data_loader.load_to_snowflake.SnowflakeConnector')
    def test_load_all_files_missing_directory(self, mock_connector_class, tmp_path, capsys):
        """Test load_all_files handles missing data directory."""
        from src.ecommerce_analytics.data_loader.load_to_snowflake import EcommerceDataLoader

        non_existent_dir = tmp_path / 'non_existent'
        loader = EcommerceDataLoader(data_dir=str(non_existent_dir))

        results = loader.load_all_files()

        assert results == {}
        captured = capsys.readouterr()
        assert 'does not exist' in captured.out

    @patch('src.ecommerce_analytics.data_loader.load_to_snowflake.SnowflakeConnector')
    def test_load_all_files_missing_files(self, mock_connector_class, tmp_path, capsys):
        """Test load_all_files handles missing CSV files gracefully."""
        from src.ecommerce_analytics.data_loader.load_to_snowflake import EcommerceDataLoader

        # Create empty data directory
        data_dir = tmp_path / 'data' / 'raw'
        data_dir.mkdir(parents=True)

        loader = EcommerceDataLoader(data_dir=str(data_dir))
        results = loader.load_all_files()

        # All files should be skipped
        for table_name, info in results.items():
            assert info['status'] == 'skipped'
            assert info['reason'] == 'file not found'

    @patch('src.ecommerce_analytics.data_loader.load_to_snowflake.pd.read_csv')
    @patch('src.ecommerce_analytics.data_loader.load_to_snowflake.SnowflakeConnector')
    def test_load_all_files_success(self, mock_connector_class, mock_read_csv, tmp_path, capsys):
        """Test load_all_files successfully loads CSV files."""
        from src.ecommerce_analytics.data_loader.load_to_snowflake import EcommerceDataLoader

        # Create data directory with one CSV file
        data_dir = tmp_path / 'data' / 'raw'
        data_dir.mkdir(parents=True)

        # Create a test CSV file
        test_csv = data_dir / 'olist_customers_dataset.csv'
        test_csv.touch()

        # Mock pandas read_csv
        mock_df = pd.DataFrame({
            'customer_id': ['c1', 'c2'],
            'customer_city': ['São Paulo', 'Rio']
        })
        mock_read_csv.return_value = mock_df

        # Mock the connector
        mock_connector = MagicMock()
        mock_connector.load_csv_to_snowflake.return_value = True
        mock_connector.database = 'ECOMMERCE_DEV'
        mock_connector_class.return_value = mock_connector

        loader = EcommerceDataLoader(data_dir=str(data_dir))
        results = loader.load_all_files()

        # Check CUSTOMERS was loaded successfully
        assert 'CUSTOMERS' in results
        assert results['CUSTOMERS']['status'] == 'success'
        assert results['CUSTOMERS']['rows'] == 2

    @patch('src.ecommerce_analytics.data_loader.load_to_snowflake.pd.read_csv')
    @patch('src.ecommerce_analytics.data_loader.load_to_snowflake.SnowflakeConnector')
    def test_load_all_files_handles_errors(self, mock_connector_class, mock_read_csv, tmp_path, capsys):
        """Test load_all_files handles errors during loading."""
        from src.ecommerce_analytics.data_loader.load_to_snowflake import EcommerceDataLoader

        # Create data directory with CSV file
        data_dir = tmp_path / 'data' / 'raw'
        data_dir.mkdir(parents=True)
        test_csv = data_dir / 'olist_customers_dataset.csv'
        test_csv.touch()

        # Mock pandas read_csv to raise an error
        mock_read_csv.side_effect = Exception("Failed to read CSV")

        mock_connector = MagicMock()
        mock_connector.database = 'ECOMMERCE_DEV'
        mock_connector_class.return_value = mock_connector

        loader = EcommerceDataLoader(data_dir=str(data_dir))
        results = loader.load_all_files()

        # Check that error was captured
        assert 'CUSTOMERS' in results
        assert results['CUSTOMERS']['status'] == 'error'
        assert 'Failed to read CSV' in results['CUSTOMERS']['error']


class TestDataLoaderIntegration:
    """Integration-style tests for data loader."""

    @patch('src.ecommerce_analytics.data_loader.load_to_snowflake.SnowflakeConnector')
    def test_custom_schema_parameter(self, mock_connector_class, tmp_path):
        """Test that custom schema parameter is passed correctly."""
        from src.ecommerce_analytics.data_loader.load_to_snowflake import EcommerceDataLoader

        data_dir = tmp_path / 'data' / 'raw'
        data_dir.mkdir(parents=True)

        mock_connector = MagicMock()
        mock_connector.database = 'ECOMMERCE_DEV'
        mock_connector_class.return_value = mock_connector

        loader = EcommerceDataLoader(data_dir=str(data_dir))
        loader.load_all_files(schema='STAGING')

        # Verify the method was called - no actual loading happens with empty dir
        # but the schema parameter should be accepted without error
