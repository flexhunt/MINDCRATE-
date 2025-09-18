/* 2025-06-22 Add summary column for SEO & previews */
alter table articles
add column if not exists summary text;

comment on column articles.summary is
'150-160 char snippet shown on previews / meta description';
