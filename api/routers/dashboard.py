from fastapi import APIRouter, HTTPException
from cachetools import TTLCache

from database import execute_query
from config import settings

router = APIRouter(prefix='/api/dashboard', tags=['dashboard'])

cache = TTLCache(maxsize=32, ttl=settings.cache_ttl_seconds)

# ---------------------------------------------------------------------------
# SQL Queries — All reference dbt marts/intermediate models in Snowflake
# ---------------------------------------------------------------------------

EXECUTIVE_KPIS_SQL = """
WITH totals AS (
    SELECT
        ROUND(SUM(ORDER_TOTAL), 2)                                          AS total_revenue,
        COUNT(*)                                                             AS total_orders,
        ROUND(AVG(ORDER_TOTAL), 2)                                          AS avg_order_value,
        COUNT(DISTINCT CUSTOMER_UNIQUE_ID)                                   AS unique_customers,
        ROUND(AVG(AVG_REVIEW_SCORE), 2)                                     AS avg_review_score,
        ROUND(AVG(CASE WHEN IS_DELIVERED_ON_TIME THEN 1.0 ELSE 0.0 END)*100, 1)
                                                                             AS on_time_rate
    FROM MARTS.FCT_ORDERS
),
current_half AS (
    SELECT
        ROUND(SUM(ORDER_TOTAL), 2)            AS revenue,
        COUNT(*)                               AS orders,
        ROUND(AVG(ORDER_TOTAL), 2)            AS aov,
        COUNT(DISTINCT CUSTOMER_UNIQUE_ID)     AS customers,
        ROUND(AVG(AVG_REVIEW_SCORE), 2)       AS review,
        ROUND(AVG(CASE WHEN IS_DELIVERED_ON_TIME THEN 1.0 ELSE 0.0 END)*100, 1) AS on_time
    FROM MARTS.FCT_ORDERS
    WHERE ORDER_MONTH >= '2018-01-01'
),
previous_half AS (
    SELECT
        ROUND(SUM(ORDER_TOTAL), 2)            AS revenue,
        COUNT(*)                               AS orders,
        ROUND(AVG(ORDER_TOTAL), 2)            AS aov,
        COUNT(DISTINCT CUSTOMER_UNIQUE_ID)     AS customers,
        ROUND(AVG(AVG_REVIEW_SCORE), 2)       AS review,
        ROUND(AVG(CASE WHEN IS_DELIVERED_ON_TIME THEN 1.0 ELSE 0.0 END)*100, 1) AS on_time
    FROM MARTS.FCT_ORDERS
    WHERE ORDER_MONTH < '2018-01-01'
)
SELECT
    t.*,
    ROUND((c.revenue  - p.revenue)  * 100.0 / NULLIF(p.revenue, 0), 1)   AS revenue_change,
    ROUND((c.orders   - p.orders)   * 100.0 / NULLIF(p.orders, 0), 1)    AS orders_change,
    ROUND((c.aov      - p.aov)      * 100.0 / NULLIF(p.aov, 0), 1)      AS aov_change,
    ROUND((c.customers- p.customers)* 100.0 / NULLIF(p.customers, 0), 1) AS customers_change,
    ROUND(c.review - p.review, 2)                                          AS review_change,
    ROUND(c.on_time - p.on_time, 1)                                        AS on_time_change
FROM totals t, current_half c, previous_half p
"""

REVENUE_TIME_SERIES_SQL = """
SELECT
    TO_CHAR(ORDER_MONTH, 'YYYY-MM')  AS date,
    TO_CHAR(ORDER_MONTH, 'Mon YYYY') AS label,
    ROUND(SUM(ORDER_TOTAL), 2)       AS value
FROM MARTS.FCT_ORDERS
GROUP BY ORDER_MONTH
ORDER BY ORDER_MONTH
"""

ORDER_STATUSES_SQL = """
SELECT
    INITCAP(ORDER_STATUS)                                       AS status,
    COUNT(*)                                                     AS count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1)          AS percentage
FROM MARTS.FCT_ORDERS
GROUP BY ORDER_STATUS
ORDER BY count DESC
"""

TOP_STATES_SQL = """
SELECT
    CUSTOMER_STATE                             AS state,
    ROUND(SUM(ORDER_TOTAL), 2)                AS revenue,
    COUNT(*)                                   AS orders,
    COUNT(DISTINCT CUSTOMER_UNIQUE_ID)         AS customers
FROM MARTS.FCT_ORDERS
WHERE CUSTOMER_STATE IS NOT NULL
GROUP BY CUSTOMER_STATE
ORDER BY revenue DESC
LIMIT 10
"""

PAYMENT_TYPES_SQL = """
SELECT
    INITCAP(REPLACE(PRIMARY_PAYMENT_TYPE, '_', ' ')) AS type,
    COUNT(*)                                          AS count,
    ROUND(SUM(PAYMENT_TOTAL), 2)                     AS value,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS percentage
FROM MARTS.FCT_ORDERS
WHERE PRIMARY_PAYMENT_TYPE IS NOT NULL
GROUP BY PRIMARY_PAYMENT_TYPE
ORDER BY count DESC
"""

REVIEW_DISTRIBUTION_SQL = """
SELECT
    ROUND(AVG_REVIEW_SCORE)::INT                                AS score,
    COUNT(*)                                                     AS count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1)          AS percentage
FROM MARTS.FCT_ORDERS
WHERE AVG_REVIEW_SCORE IS NOT NULL
GROUP BY ROUND(AVG_REVIEW_SCORE)
ORDER BY score DESC
"""

DELIVERY_METRICS_SQL = """
SELECT
    ROUND(AVG(CASE WHEN IS_DELIVERED_ON_TIME THEN 1.0 ELSE 0.0 END)*100, 1)     AS on_time_rate,
    ROUND(AVG(DAYS_TO_DELIVER), 1)                                                AS avg_delivery_days,
    SUM(CASE WHEN IS_DELIVERED_ON_TIME = FALSE AND DAYS_TO_DELIVER IS NOT NULL
        THEN 1 ELSE 0 END)                                                        AS late_deliveries,
    SUM(CASE WHEN IS_DELIVERED_ON_TIME THEN 1 ELSE 0 END)                         AS early_deliveries
FROM MARTS.FCT_ORDERS
WHERE ORDER_STATUS = 'delivered'
"""

# --- Sales Analytics queries ------------------------------------------------

SALES_KPIS_SQL = """
SELECT
    SUM(ITEM_COUNT)                                               AS total_products_sold,
    (SELECT COUNT(DISTINCT CATEGORY)
     FROM MARTS.DIM_PRODUCTS WHERE TOTAL_ORDERS > 0)             AS active_categories,
    (SELECT COUNT(*)
     FROM MARTS.DIM_SELLERS WHERE TOTAL_ORDERS > 0)              AS total_sellers,
    ROUND(AVG(AVG_REVIEW_SCORE), 2)                              AS avg_review_score
FROM MARTS.FCT_ORDERS
WHERE AVG_REVIEW_SCORE IS NOT NULL
"""

SALES_TREND_SQL = """
SELECT
    TO_CHAR(ORDER_MONTH, 'YYYY-MM')  AS date,
    TO_CHAR(ORDER_MONTH, 'Mon YYYY') AS label,
    ROUND(SUM(ORDER_TOTAL), 2)       AS value
FROM MARTS.FCT_ORDERS
GROUP BY ORDER_MONTH
ORDER BY ORDER_MONTH
"""

TOP_PRODUCTS_SQL = """
SELECT
    ROW_NUMBER() OVER (ORDER BY TOTAL_REVENUE DESC) AS rank,
    PRODUCT_ID                                       AS product_id,
    COALESCE(CATEGORY, 'Unknown')                    AS category,
    ROUND(TOTAL_REVENUE, 2)                          AS revenue,
    TOTAL_ORDERS                                     AS orders,
    ROUND(COALESCE(AVG_PRICE, 0), 2)                AS avg_price,
    ROUND(COALESCE(AVG_REVIEW_SCORE, 0), 1)         AS avg_review
FROM MARTS.DIM_PRODUCTS
WHERE TOTAL_ORDERS > 0
ORDER BY TOTAL_REVENUE DESC
LIMIT 10
"""

TOP_SELLERS_SQL = """
SELECT
    s.SELLER_ID                                        AS seller_id,
    INITCAP(s.CITY)                                    AS city,
    s.STATE                                            AS state,
    ROUND(s.TOTAL_REVENUE, 2)                          AS revenue,
    s.TOTAL_ORDERS                                     AS orders,
    ROUND(COALESCE(s.AVG_REVIEW_SCORE, 0), 1)         AS avg_rating,
    ROUND(
        COUNT(CASE WHEN oi.ORDER_STATUS = 'delivered' THEN 1 END) * 100.0
        / NULLIF(COUNT(*), 0), 1
    )                                                   AS fulfillment_rate
FROM MARTS.DIM_SELLERS s
LEFT JOIN INTERMEDIATE.INT_ORDER_ITEMS_ENRICHED oi
    ON s.SELLER_ID = oi.SELLER_ID
WHERE s.TOTAL_ORDERS > 0
GROUP BY s.SELLER_ID, s.CITY, s.STATE,
         s.TOTAL_REVENUE, s.TOTAL_ORDERS, s.AVG_REVIEW_SCORE
ORDER BY revenue DESC
LIMIT 10
"""

CATEGORY_METRICS_SQL = """
SELECT
    CATEGORY                          AS category,
    ROUND(SUM(TOTAL_REVENUE), 2)     AS revenue,
    SUM(TOTAL_ORDERS)                 AS orders,
    ROUND(AVG(AVG_PRICE), 2)         AS avg_price,
    COUNT(*)                          AS product_count
FROM MARTS.DIM_PRODUCTS
WHERE CATEGORY IS NOT NULL AND TOTAL_ORDERS > 0
GROUP BY CATEGORY
ORDER BY revenue DESC
LIMIT 10
"""

CUSTOMER_SEGMENTS_SQL = """
SELECT
    CASE ENGAGEMENT_TIER
        WHEN 'high'   THEN 'Champions'
        WHEN 'medium' THEN 'Loyal Customers'
        WHEN 'low'    THEN 'One-Time Buyers'
    END                                     AS segment,
    COUNT(*)                                AS count,
    ROUND(SUM(LIFETIME_VALUE), 2)          AS revenue,
    ROUND(AVG(AVG_ORDER_VALUE), 2)         AS avg_order_value
FROM MARTS.DIM_CUSTOMERS
GROUP BY ENGAGEMENT_TIER
ORDER BY revenue DESC
"""

SEGMENT_COLORS = {
    'Champions': '#4CAF50',
    'Loyal Customers': '#2196F3',
    'One-Time Buyers': '#FF9800',
}


# ---------------------------------------------------------------------------
# Helper — build KPI dicts for the Angular frontend
# ---------------------------------------------------------------------------

def _build_executive_kpis(row: dict) -> list[dict]:
    return [
        {
            'label': 'Total Revenue',
            'value': float(row['TOTAL_REVENUE']),
            'change': float(row.get('REVENUE_CHANGE', 0) or 0),
            'trend': 'up' if float(row.get('REVENUE_CHANGE', 0) or 0) > 0 else 'down',
            'icon': 'attach_money',
            'format': 'currency',
        },
        {
            'label': 'Total Orders',
            'value': int(row['TOTAL_ORDERS']),
            'change': float(row.get('ORDERS_CHANGE', 0) or 0),
            'trend': 'up' if float(row.get('ORDERS_CHANGE', 0) or 0) > 0 else 'down',
            'icon': 'shopping_cart',
            'format': 'number',
        },
        {
            'label': 'Avg Order Value',
            'value': float(row['AVG_ORDER_VALUE']),
            'change': float(row.get('AOV_CHANGE', 0) or 0),
            'trend': 'up' if float(row.get('AOV_CHANGE', 0) or 0) > 0 else 'down',
            'icon': 'trending_up',
            'format': 'currency',
        },
        {
            'label': 'Unique Customers',
            'value': int(row['UNIQUE_CUSTOMERS']),
            'change': float(row.get('CUSTOMERS_CHANGE', 0) or 0),
            'trend': 'up' if float(row.get('CUSTOMERS_CHANGE', 0) or 0) > 0 else 'down',
            'icon': 'people',
            'format': 'number',
        },
        {
            'label': 'Customer Satisfaction',
            'value': float(row['AVG_REVIEW_SCORE']),
            'change': float(row.get('REVIEW_CHANGE', 0) or 0),
            'trend': 'up' if float(row.get('REVIEW_CHANGE', 0) or 0) > 0 else ('down' if float(row.get('REVIEW_CHANGE', 0) or 0) < 0 else 'neutral'),
            'icon': 'star',
            'format': 'rating',
        },
        {
            'label': 'On-Time Delivery',
            'value': float(row['ON_TIME_RATE']),
            'change': float(row.get('ON_TIME_CHANGE', 0) or 0),
            'trend': 'up' if float(row.get('ON_TIME_CHANGE', 0) or 0) > 0 else ('down' if float(row.get('ON_TIME_CHANGE', 0) or 0) < 0 else 'neutral'),
            'icon': 'local_shipping',
            'format': 'percent',
        },
    ]


def _build_sales_kpis(row: dict) -> list[dict]:
    return [
        {
            'label': 'Total Products Sold',
            'value': int(row['TOTAL_PRODUCTS_SOLD']),
            'change': 0,
            'trend': 'neutral',
            'icon': 'inventory_2',
            'format': 'number',
        },
        {
            'label': 'Active Categories',
            'value': int(row['ACTIVE_CATEGORIES']),
            'change': 0,
            'trend': 'neutral',
            'icon': 'category',
            'format': 'number',
        },
        {
            'label': 'Total Sellers',
            'value': int(row['TOTAL_SELLERS']),
            'change': 0,
            'trend': 'neutral',
            'icon': 'store',
            'format': 'number',
        },
        {
            'label': 'Avg Review Score',
            'value': float(row['AVG_REVIEW_SCORE']),
            'change': 0,
            'trend': 'neutral',
            'icon': 'reviews',
            'format': 'rating',
        },
    ]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get('/executive')
def get_executive_dashboard():
    if 'executive' in cache:
        return cache['executive']

    try:
        kpi_rows = execute_query(EXECUTIVE_KPIS_SQL)
        revenue_ts = execute_query(REVENUE_TIME_SERIES_SQL)
        order_statuses = execute_query(ORDER_STATUSES_SQL)
        top_states = execute_query(TOP_STATES_SQL)
        payment_types = execute_query(PAYMENT_TYPES_SQL)
        reviews = execute_query(REVIEW_DISTRIBUTION_SQL)
        delivery = execute_query(DELIVERY_METRICS_SQL)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Snowflake query error: {e}')

    kpi_row = kpi_rows[0] if kpi_rows else {}
    delivery_row = delivery[0] if delivery else {}

    result = {
        'kpis': _build_executive_kpis(kpi_row),
        'salesMetrics': {
            'totalRevenue': float(kpi_row.get('TOTAL_REVENUE', 0)),
            'totalOrders': int(kpi_row.get('TOTAL_ORDERS', 0)),
            'averageOrderValue': float(kpi_row.get('AVG_ORDER_VALUE', 0)),
            'revenueGrowth': float(kpi_row.get('REVENUE_CHANGE', 0) or 0),
            'orderGrowth': float(kpi_row.get('ORDERS_CHANGE', 0) or 0),
        },
        'revenueTimeSeries': [
            {'date': r['DATE'], 'value': float(r['VALUE']), 'label': r['LABEL']}
            for r in revenue_ts
        ],
        'orderStatuses': [
            {'status': r['STATUS'], 'count': int(r['COUNT']),
             'percentage': float(r['PERCENTAGE'])}
            for r in order_statuses
        ],
        'topStates': [
            {'state': r['STATE'], 'revenue': float(r['REVENUE']),
             'orders': int(r['ORDERS']), 'customers': int(r['CUSTOMERS'])}
            for r in top_states
        ],
        'paymentTypes': [
            {'type': r['TYPE'], 'count': int(r['COUNT']),
             'value': float(r['VALUE']), 'percentage': float(r['PERCENTAGE'])}
            for r in payment_types
        ],
        'reviewDistribution': [
            {'score': int(r['SCORE']), 'count': int(r['COUNT']),
             'percentage': float(r['PERCENTAGE'])}
            for r in reviews
        ],
        'deliveryMetrics': {
            'onTimeRate': float(delivery_row.get('ON_TIME_RATE', 0) or 0),
            'avgDeliveryDays': float(delivery_row.get('AVG_DELIVERY_DAYS', 0) or 0),
            'lateDeliveries': int(delivery_row.get('LATE_DELIVERIES', 0) or 0),
            'earlyDeliveries': int(delivery_row.get('EARLY_DELIVERIES', 0) or 0),
        },
        'topProducts': [],
        'topSellers': [],
        'categoryMetrics': [],
        'customerSegments': [],
        'salesTrend': [],
    }

    cache['executive'] = result
    return result


@router.get('/sales')
def get_sales_dashboard():
    if 'sales' in cache:
        return cache['sales']

    try:
        kpi_rows = execute_query(SALES_KPIS_SQL)
        sales_trend = execute_query(SALES_TREND_SQL)
        top_products = execute_query(TOP_PRODUCTS_SQL)
        top_sellers = execute_query(TOP_SELLERS_SQL)
        categories = execute_query(CATEGORY_METRICS_SQL)
        segments = execute_query(CUSTOMER_SEGMENTS_SQL)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Snowflake query error: {e}')

    kpi_row = kpi_rows[0] if kpi_rows else {}

    result = {
        'kpis': _build_sales_kpis(kpi_row),
        'salesMetrics': {
            'totalRevenue': 0,
            'totalOrders': 0,
            'averageOrderValue': 0,
            'revenueGrowth': 0,
            'orderGrowth': 0,
        },
        'salesTrend': [
            {'date': r['DATE'], 'value': float(r['VALUE']), 'label': r['LABEL']}
            for r in sales_trend
        ],
        'topProducts': [
            {
                'rank': int(r['RANK']),
                'productId': r['PRODUCT_ID'],
                'category': r['CATEGORY'],
                'revenue': float(r['REVENUE']),
                'orders': int(r['ORDERS']),
                'avgPrice': float(r['AVG_PRICE']),
                'avgReview': float(r['AVG_REVIEW']),
            }
            for r in top_products
        ],
        'topSellers': [
            {
                'sellerId': r['SELLER_ID'],
                'city': r['CITY'],
                'state': r['STATE'],
                'revenue': float(r['REVENUE']),
                'orders': int(r['ORDERS']),
                'avgRating': float(r['AVG_RATING']),
                'fulfillmentRate': float(r.get('FULFILLMENT_RATE', 0) or 0),
            }
            for r in top_sellers
        ],
        'categoryMetrics': [
            {
                'category': r['CATEGORY'],
                'revenue': float(r['REVENUE']),
                'orders': int(r['ORDERS']),
                'avgPrice': float(r['AVG_PRICE']),
                'productCount': int(r['PRODUCT_COUNT']),
            }
            for r in categories
        ],
        'customerSegments': [
            {
                'segment': r['SEGMENT'],
                'count': int(r['COUNT']),
                'revenue': float(r['REVENUE']),
                'avgOrderValue': float(r['AVG_ORDER_VALUE']),
                'color': SEGMENT_COLORS.get(r['SEGMENT'], '#9E9E9E'),
            }
            for r in segments
        ],
        'revenueTimeSeries': [],
        'orderStatuses': [],
        'topStates': [],
        'paymentTypes': [],
        'reviewDistribution': [],
        'deliveryMetrics': {
            'onTimeRate': 0,
            'avgDeliveryDays': 0,
            'lateDeliveries': 0,
            'earlyDeliveries': 0,
        },
    }

    cache['sales'] = result
    return result
