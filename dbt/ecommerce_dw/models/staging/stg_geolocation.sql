with source as (

    select * from {{ source('raw', 'geolocation') }}

),

renamed as (

    select
        "geolocation_zip_code_prefix"::varchar as zip_code_prefix,
        "geolocation_lat"::decimal(18, 14) as latitude,
        "geolocation_lng"::decimal(18, 14) as longitude,
        initcap(trim("geolocation_city")) as city,
        upper(trim("geolocation_state")) as state

    from source

)

-- Deduplicate to one row per zip code (average coordinates)
select
    zip_code_prefix,
    avg(latitude)::decimal(18, 14) as latitude,
    avg(longitude)::decimal(18, 14) as longitude,
    max(city) as city,
    max(state) as state

from renamed
group by zip_code_prefix
