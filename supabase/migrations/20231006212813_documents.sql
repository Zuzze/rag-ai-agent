-- Enable pgvector and pg_net extensions to connect to vector database

-- pg_net allows us to make HTTP requests to the Supabase Functions endpoint
create extension if not exists pg_net with schema extensions;
-- vector allows us to use vector search
create extension if not exists vector with schema extensions;

-- raw documents data with the metadata of the document (created_by, created_at, storage_object_id, etc.)
create table documents (
  id bigint primary key generated always as identity,
  name text not null,
  storage_object_id uuid not null references storage.objects (id),
  created_by uuid not null references auth.users (id) default auth.uid(),
  created_at timestamp with time zone not null default now()
);

-- Cross-schema view to make it easier to access multiple tables at once
create view documents_with_storage_path
with (security_invoker=true)
as
  select documents.*, storage.objects.name as storage_object_path
  from documents
  join storage.objects
    on storage.objects.id = documents.storage_object_id;

-- document_sections table to store the chunks of the document and its corresponding vector embedding
create table document_sections (
  id bigint primary key generated always as identity,
  document_id bigint not null references documents (id),
  content text not null,
  -- embedding 384 comes from the used embedding model gte-small https://huggingface.co/Supabase/gte-small
  -- Currently this is the only model supported by the Supabase Edge Function
  -- https://supabase.com/docs/guides/ai/quickstarts/generate-text-embeddings
  -- It's tiny in size (0.07 GB) and has 512 sequence length
  embedding vector (384)
);

-- on delete cascade ensures lifecycle of document_sections is tied to their respective document
alter table document_sections
drop constraint document_sections_document_id_fkey,
add constraint document_sections_document_id_fkey
  foreign key (document_id)
  references documents(id)
  on delete cascade;

-- create index on document_sections using HNSW (Hierarchical Navigable Small Worlds);
-- This is more efficient than older ivfflat and also creates index immediately, even in empty table
-- HNSW https://www.pinecone.io/learn/series/faiss/hnsw/
-- embedding = embedding from the document_sections table
-- vector_ip_ops is the operation to use for the index
create index on document_sections using hnsw (embedding vector_ip_ops);

-- Enable RSL to ensure that only the user who created the document can access it
alter table documents enable row level security;
alter table document_sections enable row level security;

-- Permissions (use RLS to ensure that only the user who created the document can access it)
create policy "Users can insert documents"
on documents for insert to authenticated with check (
  auth.uid() = created_by
);

create policy "Users can query their own documents"
on documents for select to authenticated using (
  auth.uid() = created_by
);

create policy "Users can insert document sections"
on document_sections for insert to authenticated with check (
  document_id in (
    select id
    from documents
    where created_by = auth.uid()
  )
);

create policy "Users can update their own document sections"
on document_sections for update to authenticated using (
  document_id in (
    select id
    from documents
    where created_by = auth.uid()
  )
) with check (
  document_id in (
    select id
    from documents
    where created_by = auth.uid()
  )
);

create policy "Users can query their own document sections"
on document_sections for select to authenticated using (
  document_id in (
    select id
    from documents
    where created_by = auth.uid()
  )
);

-- Function to get the decrypted supabase url from the vault
create function supabase_url()
returns text
language plpgsql
security definer
as $$
declare
  secret_value text;
begin
  select decrypted_secret into secret_value from vault.decrypted_secrets where name = 'supabase_url';
  return secret_value;
end;
$$;

-- Function to trigger everytime when a file is uploaded to the storage bucket this function will run
create function private.handle_storage_update() 
returns trigger 
language plpgsql
as $$
declare
  document_id bigint;
  result int;
begin
  insert into documents (name, storage_object_id, created_by)
    values (new.path_tokens[2], new.id, new.owner)
    returning id into document_id;

  select
    net.http_post(
      -- Supabase Edge Function URL that processes the uploaded document
      url := supabase_url() || '/functions/v1/process',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        -- JWT token from supabase auth is used to authenticate the request to the edge function and inherit user permissions
        'Authorization', current_setting('request.headers')::json->>'authorization'
      ),
      body := jsonb_build_object(
        'document_id', document_id
      )
    )
  into result;

  return null;
end;
$$;

create trigger on_file_upload
  after insert on storage.objects
  for each row
  execute procedure private.handle_storage_update();
