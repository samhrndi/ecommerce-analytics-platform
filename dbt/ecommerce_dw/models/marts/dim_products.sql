with products as (

    select * from {{ ref('stg_products') }}

),

product_sales as (

    select
        product_id,
        count(distinct order_id) as total_orders,
        sum(price) as total_revenue,
        sum(freight_value) as total_freight,
        avg(price)::decimal(10, 2) as avg_price

    from {{ ref('stg_order_items') }}
    group by product_id

),

product_reviews as (

    select
        oi.product_id,
        avg(r.review_score)::decimal(3, 2) as avg_review_score,
        count(r.review_id) as review_count

    from {{ ref('stg_order_items') }} oi
    inner join {{ ref('stg_order_reviews') }} r on oi.order_id = r.order_id
    group by oi.product_id

)

select
    p.product_id,
    p.category_name_en as category,
    p.category_name_pt as category_pt,
    p.name_length,
    p.description_length,
    p.photos_qty,
    p.weight_grams,
    p.length_cm,
    p.height_cm,
    p.width_cm,
    p.volume_cm3,

    -- Sales metrics
    coalesce(s.total_orders, 0) as total_orders,
    coalesce(s.total_revenue, 0) as total_revenue,
    coalesce(s.total_freight, 0) as total_freight,
    s.avg_price,

    -- Review metrics
    r.avg_review_score,
    coalesce(r.review_count, 0) as review_count

from products p
left join product_sales s on p.product_id = s.product_id
left join product_reviews r on p.product_id = r.product_id
