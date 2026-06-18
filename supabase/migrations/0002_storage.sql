-- =============================================================================
-- Trodplas — Storage: public bucket for listing images.
--
-- Path convention used by the upload code: `{owner_id}/{listing_id}/{filename}`.
-- The first path segment is the owner's user id, so we can scope writes to the
-- authenticated owner while keeping reads public.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Anyone can read (the bucket is public; this makes the intent explicit).
create policy "Listing images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'listing-images');

-- Authenticated users can upload into their own top-level folder ({uid}/...).
create policy "Users can upload to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own objects"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own objects"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
