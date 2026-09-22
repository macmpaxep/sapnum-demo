-- The "participants can read participant list" policy queried
-- conversation_participants from within its own policy, causing
-- "infinite recursion detected in policy for relation conversation_participants".
-- A SECURITY DEFINER function breaks the recursion.

create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = p_conversation_id and user_id = auth.uid()
  );
$$;

drop policy "participants can read participant list" on public.conversation_participants;
create policy "participants can read participant list" on public.conversation_participants
  for select using (public.is_conversation_participant(conversation_id));
