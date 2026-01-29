with order_items as (

    select * from {{ ref('stg_order_items') }}

),

orders as (

    select * from {{ ref('stg_orders') }}

),

products as (

    select * from {{ ref('stg_products') }}

),

sellers as (

    select * from {{ ref('stg_sellers') }}

)

select
    oi.order_id,
    oi.order_item_id,
    oi.product_id,
    oi.seller_id,
    oi.shipping_limit_at,
    oi.price,
    oi.freight_value,
    oi.total_item_value,

    -- Order context
    o.order_status,
    o.purchased_at,
    o.delivered_to_customer_at,

    -- Product context
    p.category_name_en as product_category,
    p.weight_grams as product_weight_grams,
    p.volume_cm3 as product_volume_cm3,

    -- Seller context
    s.city as seller_city,
    s.state as seller_state

from order_items oi
left join orders o on oi.order_id = o.order_id
left join products p on oi.product_id = p.product_id
left join sellers s on oi.seller_id = s.seller_id
