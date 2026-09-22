-- conversations/conversation_participants only had SELECT policies, so
-- authenticated users couldn't start a new 1:1 conversation. Message-level
-- RLS (participants-only read/insert) still protects actual content.

create policy "authenticated users can start conversations" on public.conversations
  for insert to authenticated with check (true);

create policy "authenticated users can add conversation participants" on public.conversation_participants
  for insert to authenticated with check (true);
