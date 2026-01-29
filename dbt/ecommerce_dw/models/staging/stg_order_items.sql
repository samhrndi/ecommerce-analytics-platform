with source as (

    select * from {{ source('raw', 'order_items') }}

),

renamed as (

    select
        "order_id" as order_id,
        "order_item_id"::int as order_item_id,
        "product_id" as product_id,
        "seller_id" as seller_id,
        "shipping_limit_date"::timestamp_ntz as shipping_limit_at,
        "price"::decimal(10, 2) as price,
        "freight_value"::decimal(10, 2) as freight_value,
        ("price" + "freight_value")::decimal(10, 2) as total_item_value

    from source

)

select * from renamed
