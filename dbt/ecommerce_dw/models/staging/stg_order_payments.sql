with source as (

    select * from {{ source('raw', 'order_payments') }}

),

renamed as (

    select
        "order_id" as order_id,
        "payment_sequential"::int as payment_sequential,
        lower(trim("payment_type")) as payment_type,
        "payment_installments"::int as payment_installments,
        "payment_value"::decimal(10, 2) as payment_value

    from source

)

select * from renamed
