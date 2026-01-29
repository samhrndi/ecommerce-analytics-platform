import snowflake.connector
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization

# Load your private key
private_key_path = "/Users/hessamharandi/Desktop/ecommerce-analytics-platform/rsa_key.p8"

with open(private_key_path, "rb") as key_file:
    p_key = serialization.load_pem_private_key(
        key_file.read(),
        password=None,
        backend=default_backend()
    )

pkb = p_key.private_bytes(
    encoding=serialization.Encoding.DER,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

# From your URL: https://app.snowflake.com/ulvbqxp/aqb04355/
# Format is: orgname-accountname
try:
    conn = snowflake.connector.connect(
        user='samhrndi',
        account='ulvbqxp-aqb04355',  # orgname-accountname format
        private_key=pkb,
    )
    
    cur = conn.cursor()
    cur.execute("SELECT CURRENT_USER(), CURRENT_ACCOUNT(), CURRENT_REGION(), CURRENT_WAREHOUSE()")
    result = cur.fetchone()
    
    print("=" * 60)
    print("✓ Connected to Snowflake successfully!")
    print("=" * 60)
    print(f"User:      {result[0]}")
    print(f"Account:   {result[1]}")
    print(f"Region:    {result[2]}")
    print(f"Warehouse: {result[3]}")
    print("=" * 60)
    
    cur.close()
    conn.close()
    
except Exception as e:
    print("=" * 60)
    print("✗ Connection failed")
    print("=" * 60)
    print(f"Error: {e}")
    print("=" * 60)
    print("\nTroubleshooting:")
    print("1. Verify public key is set in Snowflake:")
    print("   DESC USER samhrndi;")
    print("2. Check if you have a default warehouse assigned")
