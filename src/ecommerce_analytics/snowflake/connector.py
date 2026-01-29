"""
Snowflake connection utility for E-Commerce Analytics Platform
"""
from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Any, Generator, Literal

import pandas as pd
import snowflake.connector
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from dotenv import load_dotenv
from snowflake.connector import SnowflakeConnection

# Load environment variables
load_dotenv()


class SnowflakeConnector:
    """Manages Snowflake connections for the e-commerce analytics platform."""

    def __init__(self, use_key_auth: bool = True) -> None:
        """
        Initialize the Snowflake connector.

        Args:
            use_key_auth: If True, use RSA key-pair authentication.
                         If False, use password authentication.
        """
        self.user: str = os.getenv('SNOWFLAKE_USER', 'samhrndi')
        self.account: str = os.getenv('SNOWFLAKE_ACCOUNT', 'ulvbqxp-aqb04355')
        self.warehouse: str = os.getenv('SNOWFLAKE_WAREHOUSE', 'COMPUTE_WH')
        self.database_dev: str = os.getenv('SNOWFLAKE_DATABASE_DEV', 'ECOMMERCE_DEV')
        self.database_prod: str = os.getenv('SNOWFLAKE_DATABASE_PROD', 'ECOMMERCE_PROD')
        self.schema: str = os.getenv('SNOWFLAKE_SCHEMA', 'RAW')
        self.role: str = os.getenv('SNOWFLAKE_ROLE', 'ACCOUNTADMIN')
        self.use_key_auth: bool = use_key_auth

        if use_key_auth:
            self.private_key_path: str = os.getenv(
                'SNOWFLAKE_PRIVATE_KEY_PATH',
                os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'rsa_key.p8')
            )
        else:
            self.password: str | None = os.getenv('SNOWFLAKE_PASSWORD')

        self.database: str = self.database_dev

    def _load_private_key(self) -> bytes:
        """
        Load and return the private key in DER format.

        Returns:
            The private key bytes in DER format.
        """
        with open(self.private_key_path, "rb") as key_file:
            p_key = serialization.load_pem_private_key(
                key_file.read(),
                password=None,
                backend=default_backend()
            )

        return p_key.private_bytes(
            encoding=serialization.Encoding.DER,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )

    def get_connection(
        self,
        database: str | None = None,
        schema: str | None = None
    ) -> SnowflakeConnection:
        """
        Create and return a Snowflake connection.

        Args:
            database: Database to connect to. Defaults to instance database.
            schema: Schema to use. Defaults to instance schema.

        Returns:
            An active Snowflake connection.
        """
        conn_params: dict[str, Any] = {
            'user': self.user,
            'account': self.account,
            'warehouse': self.warehouse,
            'database': database or self.database,
            'schema': schema or self.schema,
            'role': self.role
        }

        if self.use_key_auth:
            conn_params['private_key'] = self._load_private_key()
        else:
            conn_params['password'] = self.password

        return snowflake.connector.connect(**conn_params)

    @contextmanager
    def connection(
        self,
        database: str | None = None,
        schema: str | None = None
    ) -> Generator[SnowflakeConnection, None, None]:
        """
        Context manager for Snowflake connections.

        Args:
            database: Database to connect to. Defaults to instance database.
            schema: Schema to use. Defaults to instance schema.

        Yields:
            An active Snowflake connection that will be closed on exit.
        """
        conn = self.get_connection(database, schema)
        try:
            yield conn
        finally:
            conn.close()

    def execute_query(
        self,
        query: str,
        params: dict[str, Any] | None = None,
        fetch: bool = True
    ) -> list[tuple[Any, ...]] | None:
        """
        Execute a query and optionally return results.

        Args:
            query: SQL query to execute.
            params: Query parameters. Defaults to empty dict.
            fetch: If True, fetch and return results. Defaults to True.

        Returns:
            List of result tuples if fetch=True, None otherwise.
        """
        with self.connection() as conn:
            cur = conn.cursor()
            cur.execute(query, params or {})
            results = cur.fetchall() if fetch else None
            cur.close()
            return results

    def load_csv_to_snowflake(
        self,
        df: pd.DataFrame,
        table_name: str,
        schema: str | None = None,
        if_exists: Literal['replace', 'append'] = 'replace'
    ) -> bool:
        """
        Load a pandas DataFrame to Snowflake.

        Args:
            df: DataFrame to load.
            table_name: Target table name.
            schema: Target schema. Defaults to instance schema.
            if_exists: Behavior if table exists ('replace' or 'append').

        Returns:
            True if load was successful, False otherwise.
        """
        from snowflake.connector.pandas_tools import write_pandas

        with self.connection(schema=schema) as conn:
            success, nchunks, nrows, _ = write_pandas(
                conn=conn,
                df=df,
                table_name=table_name.upper(),
                auto_create_table=True,
                overwrite=(if_exists == 'replace')
            )

            if success:
                print(f"✓ Loaded {nrows} rows to {table_name}")
            else:
                print(f"✗ Failed to load {table_name}")

            return success

    def test_connection(self) -> bool:
        """
        Test the connection and print details.

        Returns:
            True if connection successful, False otherwise.
        """
        try:
            with self.connection() as conn:
                cur = conn.cursor()
                cur.execute("""
                    SELECT
                        CURRENT_USER(),
                        CURRENT_ACCOUNT(),
                        CURRENT_WAREHOUSE(),
                        CURRENT_DATABASE(),
                        CURRENT_SCHEMA(),
                        CURRENT_ROLE()
                """)
                result = cur.fetchone()
                cur.close()

                print("=" * 70)
                print("✓ Snowflake Connection Successful")
                print("=" * 70)
                print(f"User:      {result[0]}")
                print(f"Account:   {result[1]}")
                print(f"Warehouse: {result[2]}")
                print(f"Database:  {result[3]}")
                print(f"Schema:    {result[4]}")
                print(f"Role:      {result[5]}")
                print("=" * 70)
                return True

        except Exception as e:
            print("=" * 70)
            print("✗ Connection Failed")
            print("=" * 70)
            print(f"Error: {e}")
            print("=" * 70)
            return False


if __name__ == "__main__":
    sf = SnowflakeConnector(use_key_auth=True)
    sf.test_connection()
