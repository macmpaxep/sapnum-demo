create policy "users can add themselves as company member" on public.company_members
  for insert to authenticated with check (user_id = auth.uid());

-- Self-service role grants are limited to "simple"/"business": investor/admin
-- status shouldn't be self-assignable without a verification step later.
create policy "users can self-grant simple or business role" on public.user_roles
  for insert to authenticated with check (
    user_id = auth.uid() and role in ('simple', 'business')
  );
