create policy "users can mark their own activity as read" on public.activities
  for update to authenticated using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.messages;
