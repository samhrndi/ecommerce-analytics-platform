with source as (

    select * from {{ source('raw', 'products') }}

),

translations as (

    select * from {{ source('raw', 'product_category_translation') }}

),

renamed as (

    select
        p."product_id" as product_id,
        lower(trim(p."product_category_name")) as category_name_pt,
        lower(trim(t."product_category_name_english")) as category_name_en,
        p."product_name_lenght"::int as name_length,
        p."product_description_lenght"::int as description_length,
        p."product_photos_qty"::int as photos_qty,
        p."product_weight_g"::decimal(10, 2) as weight_grams,
        p."product_length_cm"::decimal(10, 2) as length_cm,
        p."product_height_cm"::decimal(10, 2) as height_cm,
        p."product_width_cm"::decimal(10, 2) as width_cm,
        (p."product_length_cm" * p."product_height_cm" * p."product_width_cm")::decimal(12, 2) as volume_cm3

    from source p
    left join translations t
        on p."product_category_name" = t."product_category_name"

)

select * from renamed
