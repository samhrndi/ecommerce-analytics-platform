"""
Unit tests for SnowflakeConnector class.
"""
import pytest
from unittest.mock import MagicMock, patch, mock_open


class TestSnowflakeConnector:
    """Tests for SnowflakeConnector."""

    @patch('src.ecommerce_analytics.snowflake.connector.load_dotenv')
    def test_connector_initialization_with_key_auth(self, mock_dotenv, mock_env_vars):
        """Test connector initializes with RSA key authentication."""
        from src.ecommerce_analytics.snowflake.connector import SnowflakeConnector

        connector = SnowflakeConnector(use_key_auth=True)

        assert connector.user == 'test_user'
        assert connector.account == 'test_account'
        assert connector.warehouse == 'COMPUTE_WH'
        assert connector.database_dev == 'ECOMMERCE_DEV'
        assert connector.database_prod == 'ECOMMERCE_PROD'
        assert connector.schema == 'RAW'
        assert connector.role == 'ACCOUNTADMIN'
        assert connector.use_key_auth is True

    @patch('src.ecommerce_analytics.snowflake.connector.load_dotenv')
    def test_connector_initialization_with_password_auth(self, mock_dotenv, mock_env_vars, monkeypatch):
        """Test connector initializes with password authentication."""
        monkeypatch.setenv('SNOWFLAKE_PASSWORD', 'test_password')
        from src.ecommerce_analytics.snowflake.connector import SnowflakeConnector

        connector = SnowflakeConnector(use_key_auth=False)

        assert connector.use_key_auth is False
        assert connector.password == 'test_password'

    @patch('src.ecommerce_analytics.snowflake.connector.load_dotenv')
    @patch('src.ecommerce_analytics.snowflake.connector.snowflake.connector.connect')
    def test_get_connection_with_password(self, mock_connect, mock_dotenv, mock_env_vars, monkeypatch):
        """Test get_connection creates connection with correct parameters."""
        monkeypatch.setenv('SNOWFLAKE_PASSWORD', 'test_password')
        from src.ecommerce_analytics.snowflake.connector import SnowflakeConnector

        mock_conn = MagicMock()
        mock_connect.return_value = mock_conn

        connector = SnowflakeConnector(use_key_auth=False)
        conn = connector.get_connection()

        mock_connect.assert_called_once()
        call_kwargs = mock_connect.call_args[1]
        assert call_kwargs['user'] == 'test_user'
        assert call_kwargs['account'] == 'test_account'
        assert call_kwargs['warehouse'] == 'COMPUTE_WH'
        assert call_kwargs['password'] == 'test_password'

    @patch('src.ecommerce_analytics.snowflake.connector.load_dotenv')
    @patch('src.ecommerce_analytics.snowflake.connector.snowflake.connector.connect')
    def test_connection_context_manager(self, mock_connect, mock_dotenv, mock_env_vars, monkeypatch):
        """Test connection context manager properly opens and closes connection."""
        monkeypatch.setenv('SNOWFLAKE_PASSWORD', 'test_password')
        from src.ecommerce_analytics.snowflake.connector import SnowflakeConnector

        mock_conn = MagicMock()
        mock_connect.return_value = mock_conn

        connector = SnowflakeConnector(use_key_auth=False)

        with connector.connection() as conn:
            assert conn == mock_conn

        mock_conn.close.assert_called_once()

    @patch('src.ecommerce_analytics.snowflake.connector.load_dotenv')
    @patch('src.ecommerce_analytics.snowflake.connector.snowflake.connector.connect')
    def test_execute_query(self, mock_connect, mock_dotenv, mock_env_vars, monkeypatch):
        """Test execute_query runs query and returns results."""
        monkeypatch.setenv('SNOWFLAKE_PASSWORD', 'test_password')
        from src.ecommerce_analytics.snowflake.connector import SnowflakeConnector

        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [('result1',), ('result2',)]
        mock_conn = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn

        connector = SnowflakeConnector(use_key_auth=False)
        results = connector.execute_query("SELECT * FROM test_table")

        mock_cursor.execute.assert_called_once_with("SELECT * FROM test_table", {})
        assert results == [('result1',), ('result2',)]

    @patch('src.ecommerce_analytics.snowflake.connector.load_dotenv')
    @patch('src.ecommerce_analytics.snowflake.connector.snowflake.connector.connect')
    def test_execute_query_no_fetch(self, mock_connect, mock_dotenv, mock_env_vars, monkeypatch):
        """Test execute_query with fetch=False doesn't return results."""
        monkeypatch.setenv('SNOWFLAKE_PASSWORD', 'test_password')
        from src.ecommerce_analytics.snowflake.connector import SnowflakeConnector

        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn

        connector = SnowflakeConnector(use_key_auth=False)
        result = connector.execute_query("INSERT INTO test_table VALUES (1)", fetch=False)

        assert result is None
        mock_cursor.fetchall.assert_not_called()

    @patch('src.ecommerce_analytics.snowflake.connector.load_dotenv')
    @patch('src.ecommerce_analytics.snowflake.connector.snowflake.connector.connect')
    def test_test_connection_success(self, mock_connect, mock_dotenv, mock_env_vars, monkeypatch, capsys):
        """Test test_connection returns True on successful connection."""
        monkeypatch.setenv('SNOWFLAKE_PASSWORD', 'test_password')
        from src.ecommerce_analytics.snowflake.connector import SnowflakeConnector

        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = (
            'test_user', 'test_account', 'COMPUTE_WH',
            'ECOMMERCE_DEV', 'RAW', 'ACCOUNTADMIN'
        )
        mock_conn = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn

        connector = SnowflakeConnector(use_key_auth=False)
        result = connector.test_connection()

        assert result is True
        captured = capsys.readouterr()
        assert 'Connection Successful' in captured.out

    @patch('src.ecommerce_analytics.snowflake.connector.load_dotenv')
    @patch('src.ecommerce_analytics.snowflake.connector.snowflake.connector.connect')
    def test_test_connection_failure(self, mock_connect, mock_dotenv, mock_env_vars, monkeypatch, capsys):
        """Test test_connection returns False on connection failure."""
        monkeypatch.setenv('SNOWFLAKE_PASSWORD', 'test_password')
        from src.ecommerce_analytics.snowflake.connector import SnowflakeConnector

        mock_connect.side_effect = Exception("Connection failed")

        connector = SnowflakeConnector(use_key_auth=False)
        result = connector.test_connection()

        assert result is False
        captured = capsys.readouterr()
        assert 'Connection Failed' in captured.out
