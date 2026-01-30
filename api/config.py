import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))


class Settings(BaseSettings):
    snowflake_account: str = os.getenv('SNOWFLAKE_ACCOUNT', '')
    snowflake_user: str = os.getenv('SNOWFLAKE_USER', '')
    snowflake_role: str = os.getenv('SNOWFLAKE_ROLE', 'ACCOUNTADMIN')
    snowflake_warehouse: str = os.getenv('SNOWFLAKE_WAREHOUSE', 'COMPUTE_WH')
    snowflake_database: str = os.getenv('SNOWFLAKE_DATABASE_PROD', 'ECOMMERCE_PROD')
    snowflake_private_key_path: str = os.getenv(
        'SNOWFLAKE_PRIVATE_KEY_PATH',
        os.path.join(os.path.dirname(__file__), '..', 'rsa_key.p8')
    )
    cors_origins: list[str] = ['http://localhost:4200', 'http://localhost:8000']
    cache_ttl_seconds: int = 300


settings = Settings()
