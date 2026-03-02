DO $$
DECLARE
    v_admin_id uuid;
    v_league_id uuid := gen_random_uuid();
    v_p1 uuid := gen_random_uuid();
    v_p2 uuid := gen_random_uuid();
    v_p3 uuid := gen_random_uuid();
    v_m1 uuid := gen_random_uuid();
    v_m2 uuid := gen_random_uuid();
BEGIN
    SELECT id INTO v_admin_id FROM auth.users LIMIT 1;
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Nessun utente trovato. Registrati prima sul sito web.';
    END IF;

    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES 
    (v_p1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'messi@test.com', 'fake', now(), '{"full_name": "Lionel Messi"}', now(), now()),
    (v_p2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cr7@test.com', 'fake', now(), '{"full_name": "Cristiano Ronaldo"}', now(), now()),
    (v_p3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mbappe@test.com', 'fake', now(), '{"full_name": "Kylian Mbappé"}', now(), now());

    INSERT INTO public.profiles (id, full_name) VALUES (v_p1, 'Lionel Messi') ON CONFLICT DO NOTHING;
    INSERT INTO public.profiles (id, full_name) VALUES (v_p2, 'Cristiano Ronaldo') ON CONFLICT DO NOTHING;
    INSERT INTO public.profiles (id, full_name) VALUES (v_p3, 'Kylian Mbappé') ON CONFLICT DO NOTHING;

    INSERT INTO public.leagues (id, name, join_code, admin_id)
    VALUES (v_league_id, 'Champions Calcetto', 'MOCK88', v_admin_id);

    INSERT INTO public.league_members (league_id, user_id) VALUES 
    (v_league_id, v_p1),
    (v_league_id, v_p2),
    (v_league_id, v_p3);

    INSERT INTO public.matches (id, league_id, match_date) VALUES 
    (v_m1, v_league_id, current_date - interval '7 days'),
    (v_m2, v_league_id, current_date);

    INSERT INTO public.match_stats (match_id, player_id, goals, assists, vote) VALUES 
    (v_m1, v_admin_id, 2, 1, 7.5),
    (v_m1, v_p1, 3, 0, 8.5),
    (v_m1, v_p2, 1, 1, 7.0),
    (v_m1, v_p3, 0, 2, 6.5),
    (v_m2, v_admin_id, 1, 2, 7.0),
    (v_m2, v_p1, 1, 0, 6.5),
    (v_m2, v_p2, 2, 0, 7.5),
    (v_m2, v_p3, 3, 1, 9.0);

END $$;
