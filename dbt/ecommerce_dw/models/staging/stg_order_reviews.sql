with source as (

    select * from {{ source('raw', 'order_reviews') }}

),

renamed as (

    select
        "review_id" as review_id,
        "order_id" as order_id,
        "review_score"::int as review_score,
        nullif(trim("review_comment_title"), '') as review_title,
        nullif(trim("review_comment_message"), '') as review_message,
        "review_creation_date"::timestamp_ntz as review_created_at,
        "review_answer_timestamp"::timestamp_ntz as review_answered_at

    from source

)

select * from renamed
