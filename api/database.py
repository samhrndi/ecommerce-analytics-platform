import os
from contextlib import contextmanager
from typing import Any, Generator

import snowflake.connector
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from snowflake.connector import SnowflakeConnection

from config import settings

os.environ['SF_OCSP_FAIL_OPEN'] = 'true'


def _load_private_key() -> bytes:
    with open(settings.snowflake_private_key_path, 'rb') as f:
        p_key = serialization.load_pem_private_key(
            f.read(), password=None, backend=default_backend()
        )
    return p_key.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )


@contextmanager
def get_connection(schema: str = 'MARTS') -> Generator[SnowflakeConnection, None, None]:
    conn = snowflake.connector.connect(
        user=settings.snowflake_user,
        account=settings.snowflake_account,
        warehouse=settings.snowflake_warehouse,
        database=settings.snowflake_database,
        schema=schema,
        role=settings.snowflake_role,
        private_key=_load_private_key(),
        insecure_mode=True,
    )
    try:
        yield conn
    finally:
        conn.close()


def execute_query(query: str, schema: str = 'MARTS') -> list[dict[str, Any]]:
    with get_connection(schema) as conn:
        cur = conn.cursor()
        cur.execute(query)
        columns = [desc[0] for desc in cur.description]
        rows = cur.fetchall()
        cur.close()
    return [dict(zip(columns, row)) for row in rows]
