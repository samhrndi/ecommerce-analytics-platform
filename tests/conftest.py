"""
Pytest configuration and fixtures for e-commerce analytics tests.
"""
import pytest
from unittest.mock import MagicMock, patch
import pandas as pd


@pytest.fixture
def mock_snowflake_connection():
    """Mock Snowflake connection for testing."""
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.return_value = (
        'test_user',
        'test_account',
        'COMPUTE_WH',
        'ECOMMERCE_DEV',
        'RAW',
        'ACCOUNTADMIN'
    )
    mock_cursor.fetchall.return_value = []
    return mock_conn


@pytest.fixture
def sample_dataframe():
    """Sample DataFrame for testing data loading."""
    return pd.DataFrame({
        'customer_id': ['c1', 'c2', 'c3'],
        'customer_unique_id': ['u1', 'u2', 'u3'],
        'customer_zip_code_prefix': ['01234', '56789', '11111'],
        'customer_city': ['São Paulo', 'Rio de Janeiro', 'Brasília'],
        'customer_state': ['SP', 'RJ', 'DF']
    })


@pytest.fixture
def mock_env_vars(monkeypatch):
    """Set up mock environment variables."""
    monkeypatch.setenv('SNOWFLAKE_USER', 'test_user')
    monkeypatch.setenv('SNOWFLAKE_ACCOUNT', 'test_account')
    monkeypatch.setenv('SNOWFLAKE_WAREHOUSE', 'COMPUTE_WH')
    monkeypatch.setenv('SNOWFLAKE_DATABASE_DEV', 'ECOMMERCE_DEV')
    monkeypatch.setenv('SNOWFLAKE_DATABASE_PROD', 'ECOMMERCE_PROD')
    monkeypatch.setenv('SNOWFLAKE_SCHEMA', 'RAW')
    monkeypatch.setenv('SNOWFLAKE_ROLE', 'ACCOUNTADMIN')
