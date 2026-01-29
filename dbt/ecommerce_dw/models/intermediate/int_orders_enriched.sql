with orders as (

    select * from {{ ref('stg_orders') }}

),

items_summary as (

    select
        order_id,
        count(*) as item_count,
        count(distinct product_id) as distinct_product_count,
        count(distinct seller_id) as distinct_seller_count,
        sum(price) as items_subtotal,
        sum(freight_value) as freight_total,
        sum(total_item_value) as items_total

    from {{ ref('stg_order_items') }}
    group by order_id

),

payments_summary as (

    select
        order_id,
        count(*) as payment_count,
        sum(payment_value) as payment_total,
        max(payment_type) as primary_payment_type,
        max(payment_installments) as max_installments

    from {{ ref('stg_order_payments') }}
    group by order_id

),

reviews_summary as (

    select
        order_id,
        avg(review_score)::decimal(3, 2) as avg_review_score,
        count(*) as review_count

    from {{ ref('stg_order_reviews') }}
    group by order_id

)

select
    o.order_id,
    o.customer_id,
    o.order_status,
    o.purchased_at,
    o.approved_at,
    o.delivered_to_carrier_at,
    o.delivered_to_customer_at,
    o.estimated_delivery_at,

    -- Timing metrics
    datediff('hour', o.purchased_at, o.approved_at) as hours_to_approve,
    datediff('day', o.purchased_at, o.delivered_to_customer_at) as days_to_deliver,
    datediff('day', o.delivered_to_customer_at, o.estimated_delivery_at) as delivery_vs_estimate_days,
    case
        when o.delivered_to_customer_at <= o.estimated_delivery_at then true
        else false
    end as is_delivered_on_time,

    -- Items
    coalesce(i.item_count, 0) as item_count,
    coalesce(i.distinct_product_count, 0) as distinct_product_count,
    coalesce(i.distinct_seller_count, 0) as distinct_seller_count,
    coalesce(i.items_subtotal, 0) as items_subtotal,
    coalesce(i.freight_total, 0) as freight_total,
    coalesce(i.items_total, 0) as order_total,

    -- Payments
    coalesce(p.payment_count, 0) as payment_count,
    coalesce(p.payment_total, 0) as payment_total,
    p.primary_payment_type,
    coalesce(p.max_installments, 0) as max_installments,

    -- Reviews
    r.avg_review_score,
    coalesce(r.review_count, 0) as review_count

from orders o
left join items_summary i on o.order_id = i.order_id
left join payments_summary p on o.order_id = p.order_id
left join reviews_summary r on o.order_id = r.order_id
