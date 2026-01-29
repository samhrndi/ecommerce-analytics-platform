# E-Commerce Analytics Platform

A modern data analytics platform built on Snowflake using the medallion/lakehouse architecture for analyzing Brazilian e-commerce data.

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│   RAW       │ →  │   STAGING   │ →  │  INTERMEDIATE   │ →  │    MARTS    │
│  (Source)   │    │  (Cleansed) │    │   (Derived)     │    │  (Business) │
└─────────────┘    └─────────────┘    └─────────────────┘    └─────────────┘
```

- **RAW**: Raw CSV data ingested from source
- **STAGING**: Data cleansing and type casting
- **INTERMEDIATE**: Derived datasets and aggregations
- **MARTS**: Business-ready analytics tables

## Tech Stack

- **Python 3.11**: Primary language
- **Snowflake**: Cloud data warehouse
- **dbt 1.7**: Data transformation
- **Pandas/PyArrow**: Data manipulation

## Project Structure

```
ecommerce-analytics-platform/
├── src/
│   └── ecommerce_analytics/
│       ├── snowflake/           # Snowflake connectivity
│       │   └── connector.py
│       └── data_loader/         # Data ingestion
│           └── load_to_snowflake.py
├── data/
│   └── raw/                     # Brazilian e-commerce CSVs
├── snowflake/
│   └── setup/                   # SQL initialization scripts
├── dbt/
│   └── ecommerce_dw/            # dbt transformation project
├── tests/                       # Unit tests
└── .github/workflows/           # CI/CD pipelines
```

## Dataset

Brazilian E-Commerce Public Dataset (Olist):
- ~100K orders from 2016-2018
- 9 related CSV files
- ~1.5M total records

| Table | Records | Description |
|-------|---------|-------------|
| CUSTOMERS | 99,441 | Customer information |
| GEOLOCATION | 1,000,163 | Location data |
| ORDER_ITEMS | 112,650 | Order line items |
| ORDER_PAYMENTS | 103,886 | Payment details |
| ORDER_REVIEWS | 104,719 | Customer reviews |
| ORDERS | 99,441 | Order headers |
| PRODUCTS | 32,951 | Product catalog |
| SELLERS | 3,095 | Seller information |
| PRODUCT_CATEGORY_TRANSLATION | 70 | Category translations |

## Quick Start

### Prerequisites

- Python 3.11+
- Snowflake account
- RSA key pair for authentication

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ecommerce-analytics-platform
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt

# For development:
pip install -r requirements-dev.txt
```

4. Configure environment:
```bash
cp .env.example .env
# Edit .env with your Snowflake credentials
```

5. Generate RSA key pair (if needed):
```bash
openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out rsa_key.p8 -nocrypt
openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub
```

6. Set up Snowflake:
```bash
# Run the SQL setup script in Snowflake
# snowflake/setup/01_create_databases.sql
```

### Usage

**Test Snowflake Connection:**
```bash
python test_snowflake_connection.py
```

**Load Data to Snowflake:**
```bash
python -m src.ecommerce_analytics.data_loader.load_to_snowflake
```

**Run Tests:**
```bash
pytest tests/ -v
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SNOWFLAKE_USER` | Snowflake username | - |
| `SNOWFLAKE_ACCOUNT` | Snowflake account identifier | - |
| `SNOWFLAKE_WAREHOUSE` | Compute warehouse | `COMPUTE_WH` |
| `SNOWFLAKE_DATABASE_DEV` | Development database | `ECOMMERCE_DEV` |
| `SNOWFLAKE_DATABASE_PROD` | Production database | `ECOMMERCE_PROD` |
| `SNOWFLAKE_SCHEMA` | Default schema | `RAW` |
| `SNOWFLAKE_ROLE` | Snowflake role | `ACCOUNTADMIN` |
| `SNOWFLAKE_PRIVATE_KEY_PATH` | Path to RSA private key | `./rsa_key.p8` |

## Development

### Code Quality

```bash
# Format code
black src/ tests/

# Lint
flake8 src/ tests/
pylint src/

# Type check
mypy src/
```

### Running Tests

```bash
# Run all tests
pytest

# With coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_connector.py -v
```

## Security Notes

- Never commit RSA keys or `.env` files
- Use environment variables for all credentials
- The `.gitignore` excludes sensitive files by default

## License

MIT
