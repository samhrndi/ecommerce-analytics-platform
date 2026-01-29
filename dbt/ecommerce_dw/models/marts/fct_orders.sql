with orders_enriched as (

    select * from {{ ref('int_orders_enriched') }}

),

customers as (

    select * from {{ ref('stg_customers') }}

)

select
    o.order_id,
    o.customer_id,
    c.customer_unique_id,
    c.city as customer_city,
    c.state as customer_state,

    o.order_status,
    o.purchased_at,
    o.approved_at,
    o.delivered_to_carrier_at,
    o.delivered_to_customer_at,
    o.estimated_delivery_at,

    -- Timing
    o.hours_to_approve,
    o.days_to_deliver,
    o.delivery_vs_estimate_days,
    o.is_delivered_on_time,

    -- Order values
    o.item_count,
    o.distinct_product_count,
    o.distinct_seller_count,
    o.items_subtotal,
    o.freight_total,
    o.order_total,

    -- Payment
    o.payment_count,
    o.payment_total,
    o.primary_payment_type,
    o.max_installments,

    -- Reviews
    o.avg_review_score,
    o.review_count,

    -- Date dimensions
    date_trunc('day', o.purchased_at)::date as order_date,
    date_trunc('month', o.purchased_at)::date as order_month,
    dayofweek(o.purchased_at) as order_day_of_week,
    hour(o.purchased_at) as order_hour

from orders_enriched o
left join customers c on o.customer_id = c.customer_id
