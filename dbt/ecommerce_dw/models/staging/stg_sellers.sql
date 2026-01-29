with source as (

    select * from {{ source('raw', 'sellers') }}

),

renamed as (

    select
        "seller_id" as seller_id,
        "seller_zip_code_prefix"::varchar as zip_code_prefix,
        initcap(trim("seller_city")) as city,
        upper(trim("seller_state")) as state

    from source

)

select * from renamed
