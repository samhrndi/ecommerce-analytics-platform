with customers as (

    select * from {{ ref('stg_customers') }}

),

orders as (

    select * from {{ ref('int_orders_enriched') }}

),

customer_orders as (

    select
        c.customer_unique_id,
        min(c.city) as city,
        min(c.state) as state,
        min(c.zip_code_prefix) as zip_code_prefix,
        count(distinct o.order_id) as total_orders,
        min(o.purchased_at) as first_order_at,
        max(o.purchased_at) as last_order_at,
        sum(o.order_total) as lifetime_value,
        avg(o.order_total)::decimal(10, 2) as avg_order_value,
        avg(o.avg_review_score)::decimal(3, 2) as avg_review_score,
        sum(o.item_count) as total_items_purchased

    from customers c
    left join orders o on c.customer_id = o.customer_id
    group by c.customer_unique_id

)

select
    customer_unique_id,
    city,
    state,
    zip_code_prefix,
    total_orders,
    first_order_at,
    last_order_at,
    lifetime_value,
    avg_order_value,
    avg_review_score,
    total_items_purchased,
    case
        when total_orders >= 3 then 'high'
        when total_orders = 2 then 'medium'
        else 'low'
    end as engagement_tier

from customer_orders
