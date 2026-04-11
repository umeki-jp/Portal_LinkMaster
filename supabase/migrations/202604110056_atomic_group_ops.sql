create unique index if not exists lm_groups_one_main_per_user_idx
  on public.lm_groups (user_id)
  where is_main = true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.lm_categories'::regclass
      and contype = 'f'
      and pg_get_constraintdef(oid) like 'FOREIGN KEY (group_id) REFERENCES lm_groups(id) ON DELETE CASCADE%'
  ) then
    alter table public.lm_categories
      add constraint lm_categories_group_id_fkey
      foreign key (group_id) references public.lm_groups(id) on delete cascade;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.lm_links'::regclass
      and contype = 'f'
      and pg_get_constraintdef(oid) like 'FOREIGN KEY (group_id) REFERENCES lm_groups(id) ON DELETE CASCADE%'
  ) then
    alter table public.lm_links
      add constraint lm_links_group_id_fkey
      foreign key (group_id) references public.lm_groups(id) on delete cascade;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.lm_links'::regclass
      and contype = 'f'
      and pg_get_constraintdef(oid) like 'FOREIGN KEY (category_id) REFERENCES lm_categories(id) ON DELETE CASCADE%'
  ) then
    alter table public.lm_links
      add constraint lm_links_category_id_fkey
      foreign key (category_id) references public.lm_categories(id) on delete cascade;
  end if;
end
$$;

create or replace function public.lm_set_main_group(target_group_id uuid)
returns public.lm_groups
language plpgsql
security invoker
set search_path = public
as $$
declare
  updated_group public.lm_groups;
begin
  if target_group_id is null then
    raise exception 'target_group_id is required';
  end if;

  if not exists (
    select 1
    from public.lm_groups
    where id = target_group_id
      and user_id = auth.uid()
  ) then
    raise exception 'group not found or not accessible';
  end if;

  update public.lm_groups
  set is_main = false
  where user_id = auth.uid()
    and id <> target_group_id
    and is_main = true;

  update public.lm_groups
  set is_main = true
  where id = target_group_id
    and user_id = auth.uid()
  returning * into updated_group;

  return updated_group;
end;
$$;

create or replace function public.lm_delete_group(target_group_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  deleted_group_id uuid;
begin
  if target_group_id is null then
    raise exception 'target_group_id is required';
  end if;

  delete from public.lm_groups
  where id = target_group_id
    and user_id = auth.uid()
  returning id into deleted_group_id;

  if deleted_group_id is null then
    raise exception 'group not found or not accessible';
  end if;

  return deleted_group_id;
end;
$$;

grant execute on function public.lm_set_main_group(uuid) to authenticated;
grant execute on function public.lm_delete_group(uuid) to authenticated;
