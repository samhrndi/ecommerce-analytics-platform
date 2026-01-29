import pandas as pd
import os

# Set data directory
data_dir = "data/raw"

# List all CSV files
csv_files = [f for f in os.listdir(data_dir) if f.endswith(".csv")]

print("Dataset Overview\n" + "=" * 50)

for file in csv_files:
    df = pd.read_csv(os.path.join(data_dir, file))
    print(f"\n{file}")
    print(f"Rows: {len(df):,} | Columns: {len(df.columns)}")
    print(f"Columns: {', '.join(df.columns[:5])}...")
    print(f"Memory: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")

# Check relationships
orders = pd.read_csv(os.path.join(data_dir, "olist_orders_dataset.csv"))
order_items = pd.read_csv(os.path.join(data_dir, "olist_order_items_dataset.csv"))
customers = pd.read_csv(os.path.join(data_dir, "olist_customers_dataset.csv"))

print("\n\nKey Metrics\n" + "=" * 50)
print(f"Total Orders: {len(orders):,}")
print(f"Total Order Items: {len(order_items):,}")
print(f"Unique Customers: {customers['customer_unique_id'].nunique():,}")
print(
    f"Date Range: {orders['order_purchase_timestamp'].min()} to {orders['order_purchase_timestamp'].max()}"
)
