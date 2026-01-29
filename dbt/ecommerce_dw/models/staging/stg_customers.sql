with source as (

    select * from {{ source('raw', 'customers') }}

),

renamed as (

    select
        "customer_id" as customer_id,
        "customer_unique_id" as customer_unique_id,
        "customer_zip_code_prefix"::varchar as zip_code_prefix,
        initcap(trim("customer_city")) as city,
        upper(trim("customer_state")) as state

    from source

)

select * from renamed
