begin;
insert into auth.users(id,email) values
 ('5a3d26ab-53b7-4ec1-8db3-8fa68a946f01','study-test-a@example.invalid'),
 ('5a3d26ab-53b7-4ec1-8db3-8fa68a946f02','study-test-b@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub','5a3d26ab-53b7-4ec1-8db3-8fa68a946f01',true);
select public.save_study_workspace('{"version":1,"profiles":[]}',0);
select set_config('request.jwt.claim.sub','5a3d26ab-53b7-4ec1-8db3-8fa68a946f02',true);
do $$
declare denied boolean := false;
begin
 if exists(select 1 from public.study_workspaces where user_id='5a3d26ab-53b7-4ec1-8db3-8fa68a946f01') then raise exception 'FAIL: cross-user read'; end if;
 begin
  insert into public.study_workspaces(user_id,document) values('5a3d26ab-53b7-4ec1-8db3-8fa68a946f01','{"version":1,"profiles":[]}');
 exception when insufficient_privilege then denied := true;
 end;
 if not denied then raise exception 'FAIL: cross-user insert'; end if;
 if public.save_study_workspace('{"version":1,"profiles":[]}',0) <> 1 then raise exception 'FAIL: own save'; end if;
 if public.save_study_workspace('{"version":1,"profiles":[]}',1) <> 2 then raise exception 'FAIL: own update'; end if;
 denied := false;
 begin
  perform public.save_study_workspace('{"version":1,"profiles":[]}',1);
 exception when serialization_failure then denied := true;
 end;
 if not denied then raise exception 'FAIL: stale revision overwrite'; end if;
end $$;
reset role;
rollback;
select 'PASS: own saves work; cross-user reads and writes are blocked; stale saves cannot overwrite newer data; test data rolled back' as verification;
