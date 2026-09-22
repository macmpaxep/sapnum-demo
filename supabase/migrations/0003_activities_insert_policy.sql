-- activities only had a SELECT policy (recipient-only) — likes/comments/reposts/
-- follows need to log activity as the acting user.
create policy "users can log activity as the actor" on public.activities
  for insert to authenticated with check (auth.uid() = actor_id);
