create policy "users can update their own participant row" on public.conversation_participants
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
