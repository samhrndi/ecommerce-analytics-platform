with sellers as (

    select * from {{ ref('stg_sellers') }}

),

seller_performance as (

    select
        seller_id,
        count(distinct order_id) as total_orders,
        count(*) as total_items_sold,
        sum(price) as total_revenue,
        sum(freight_value) as total_freight,
        avg(price)::decimal(10, 2) as avg_item_price,
        min(shipping_limit_at) as first_sale_at,
        max(shipping_limit_at) as last_sale_at

    from {{ ref('stg_order_items') }}
    group by seller_id

),

seller_reviews as (

    select
        oi.seller_id,
        avg(r.review_score)::decimal(3, 2) as avg_review_score,
        count(r.review_id) as review_count

    from {{ ref('stg_order_items') }} oi
    inner join {{ ref('stg_order_reviews') }} r on oi.order_id = r.order_id
    group by oi.seller_id

),

seller_categories as (

    select
        oi.seller_id,
        count(distinct p.category_name_en) as category_count

    from {{ ref('stg_order_items') }} oi
    inner join {{ ref('stg_products') }} p on oi.product_id = p.product_id
    group by oi.seller_id

)

select
    s.seller_id,
    s.city,
    s.state,
    s.zip_code_prefix,

    -- Sales metrics
    coalesce(sp.total_orders, 0) as total_orders,
    coalesce(sp.total_items_sold, 0) as total_items_sold,
    coalesce(sp.total_revenue, 0) as total_revenue,
    coalesce(sp.total_freight, 0) as total_freight,
    sp.avg_item_price,
    sp.first_sale_at,
    sp.last_sale_at,

    -- Review metrics
    r.avg_review_score,
    coalesce(r.review_count, 0) as review_count,

    -- Diversity
    coalesce(sc.category_count, 0) as category_count

from sellers s
left join seller_performance sp on s.seller_id = sp.seller_id
left join seller_reviews r on s.seller_id = r.seller_id
left join seller_categories sc on s.seller_id = sc.seller_id
