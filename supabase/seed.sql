insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'ana@luzenred.app',
    crypt('Password123!', gen_salt('bf')),
    timezone('utc'::text, now()),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Ana Sofía"}',
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'rebecca@luzenred.app',
    crypt('Password123!', gen_salt('bf')),
    timezone('utc'::text, now()),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Rebeca Luz"}',
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'marta@luzenred.app',
    crypt('Password123!', gen_salt('bf')),
    timezone('utc'::text, now()),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Marta Esperanza"}',
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    '',
    '',
    '',
    ''
  )
on conflict (id) do nothing;

update public.profiles
set
  display_name = case id
    when '11111111-1111-1111-1111-111111111111' then 'Ana Sofía'
    when '22222222-2222-2222-2222-222222222222' then 'Rebeca Luz'
    when '33333333-3333-3333-3333-333333333333' then 'Marta Esperanza'
    else display_name
  end,
  username = case id
    when '11111111-1111-1111-1111-111111111111' then 'ana.sofia'
    when '22222222-2222-2222-2222-222222222222' then 'rebeca.luz'
    when '33333333-3333-3333-3333-333333333333' then 'marta.esperanza'
    else username
  end,
  bio = case id
    when '11111111-1111-1111-1111-111111111111' then 'Aprendiendo a caminar en fe, gracia y verdad cada día.'
    when '22222222-2222-2222-2222-222222222222' then 'Mamá, emprendedora y amante de los estudios bíblicos con café.'
    when '33333333-3333-3333-3333-333333333333' then 'Sirviendo con gozo, acompañando procesos de sanidad y oración.'
    else bio
  end,
  denomination = case id
    when '11111111-1111-1111-1111-111111111111' then 'Cristiana evangélica'
    when '22222222-2222-2222-2222-222222222222' then 'Bautista'
    when '33333333-3333-3333-3333-333333333333' then 'Pentecostal'
    else denomination
  end,
  church_name = case id
    when '11111111-1111-1111-1111-111111111111' then 'Casa de Gracia'
    when '22222222-2222-2222-2222-222222222222' then 'Luz para las Naciones'
    when '33333333-3333-3333-3333-333333333333' then 'Río de Vida'
    else church_name
  end,
  location = case id
    when '11111111-1111-1111-1111-111111111111' then 'Buenos Aires, Argentina'
    when '22222222-2222-2222-2222-222222222222' then 'Córdoba, Argentina'
    when '33333333-3333-3333-3333-333333333333' then 'Santiago, Chile'
    else location
  end,
  favorite_verse = case id
    when '11111111-1111-1111-1111-111111111111' then 'Salmo 46:10'
    when '22222222-2222-2222-2222-222222222222' then 'Proverbios 3:5-6'
    when '33333333-3333-3333-3333-333333333333' then 'Isaías 41:10'
    else favorite_verse
  end,
  interests = case id
    when '11111111-1111-1111-1111-111111111111' then array['oración', 'estudios bíblicos', 'sanidad interior']
    when '22222222-2222-2222-2222-222222222222' then array['maternidad', 'emprendimiento con fe', 'propósito']
    when '33333333-3333-3333-3333-333333333333' then array['oración', 'liderazgo', 'servicio']
    else interests
  end,
  avatar_url = case id
    when '11111111-1111-1111-1111-111111111111' then 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'
    when '22222222-2222-2222-2222-222222222222' then 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
    when '33333333-3333-3333-3333-333333333333' then 'https://images.unsplash.com/photo-1542204625-de293a2f8ff0?auto=format&fit=crop&w=300&q=80'
    else avatar_url
  end,
  role = case id
    when '33333333-3333-3333-3333-333333333333' then 'moderator'::public.user_role
    else role
  end,
  is_onboarding_complete = true
where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

insert into public.groups (id, slug, name, description, interest_tag, is_private, created_by, cover_image_url)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'mujeres-de-oracion',
    'Mujeres de oración',
    'Un refugio para interceder juntas, sostenernos en fe y celebrar respuestas del Señor.',
    'oración',
    false,
    '33333333-3333-3333-3333-333333333333',
    'https://images.unsplash.com/photo-1516589091380-5d8e87df6992?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'emprendedoras-con-fe',
    'Emprendedoras con fe',
    'Ideas, trabajo, propósito y negocio con valores del Reino.',
    'emprendimiento con fe',
    false,
    '22222222-2222-2222-2222-222222222222',
    'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'sanidad-y-restauracion',
    'Sanidad y restauración',
    'Grupo cuidado para acompañarnos con gracia, verdad y esperanza.',
    'sanidad interior',
    true,
    '33333333-3333-3333-3333-333333333333',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
  )
on conflict (id) do nothing;

insert into public.group_members (group_id, user_id, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'owner'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'member'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'member'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'owner'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'member'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'owner'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'member')
on conflict (group_id, user_id) do nothing;

insert into public.follows (follower_id, following_id)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111')
on conflict (follower_id, following_id) do nothing;

insert into public.posts (id, author_id, group_id, type, content, image_url, bible_verse, category)
values
  (
    'd1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    null,
    'reflection',
    'Hoy recordé que la quietud también es obediencia. A veces Dios no nos pide correr, sino descansar en Su fidelidad.',
    'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80',
    'Salmo 46:10',
    'Reflexión'
  ),
  (
    'd2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'testimony',
    'Abrí mi pequeño proyecto con temor, pero Dios fue abriendo puertas una a una. Hoy solo puedo decir: Su provisión nunca llega tarde.',
    null,
    'Filipenses 4:19',
    'Testimonio'
  ),
  (
    'd3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'short_devotional',
    'Cuando el corazón se cansa, volver a la Palabra no es una tarea más: es volver al hogar.',
    null,
    'Mateo 11:28',
    'Devocional corto'
  )
on conflict (id) do nothing;

insert into public.post_comments (post_id, author_id, content)
values
  ('d1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Gracias por compartir esto. Justo necesitaba volver a ese descanso.'),
  ('d3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Qué palabra tan precisa. Me abrazó el alma.')
on conflict do nothing;

insert into public.post_reactions (post_id, user_id, reaction)
values
  ('d1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'amen'),
  ('d1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'inspired'),
  ('d2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'with_you')
on conflict (post_id, user_id) do update
set reaction = excluded.reaction;

insert into public.saved_posts (post_id, user_id)
values
  ('d3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111')
on conflict (post_id, user_id) do nothing;

insert into public.prayer_requests (id, author_id, group_id, title, description, visibility, status, is_sensitive)
values
  (
    'e1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    null,
    'Oración por dirección y paz',
    'Estoy tomando una decisión importante de trabajo y necesito paz, claridad y obediencia para caminar donde Dios quiera.',
    'public',
    'active',
    false
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Fortaleza en proceso de sanidad',
    'Acompañemos a una hermana del grupo que está atravesando una etapa sensible. Oremos con cuidado, discreción y esperanza.',
    'group',
    'active',
    true
  )
on conflict (id) do nothing;

insert into public.prayer_support (prayer_request_id, user_id)
values
  ('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('e1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333'),
  ('e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111')
on conflict (prayer_request_id, user_id) do nothing;

insert into public.prayer_comments (prayer_request_id, author_id, content)
values
  ('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Estoy orando para que el Señor te confirme cada paso con Su paz.'),
  ('e1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Que Dios abra lo correcto y cierre con amor lo que no conviene.')
on conflict do nothing;

insert into public.devotional_content (id, title, excerpt, body, kind, verse_reference, image_url, published_on, is_featured, created_by)
values
  (
    'f1111111-1111-1111-1111-111111111111',
    'Versículo del día',
    'El Señor pelea por vos aun cuando tu alma está cansada.',
    'A veces la fe se ve como silencio confiado. Hoy, antes de resolver todo, elegí reposar en la presencia de Dios y dejar que Él ordene tus pasos.',
    'verse_of_day',
    'Éxodo 14:14',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80',
    current_date,
    true,
    '33333333-3333-3333-3333-333333333333'
  ),
  (
    'f2222222-2222-2222-2222-222222222222',
    'Desafío espiritual semanal',
    'Elegí una hermana y sostenela en oración durante siete días.',
    'Escribí su nombre, orá con intención y mandale una palabra de aliento. El Reino también se construye en lo secreto.',
    'weekly_challenge',
    'Gálatas 6:2',
    null,
    current_date,
    false,
    '33333333-3333-3333-3333-333333333333'
  )
on conflict (id) do nothing;

insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id, message, is_read)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'new_follower',
    'profile',
    '22222222-2222-2222-2222-222222222222',
    'Rebeca Luz comenzó a seguirte.',
    false
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'prayer_response',
    'prayer_request',
    'e1111111-1111-1111-1111-111111111111',
    'Marta Esperanza indicó que está orando por vos.',
    false
  )
on conflict do nothing;

insert into public.reports (reporter_id, post_id, reason, details, status)
values
  (
    '33333333-3333-3333-3333-333333333333',
    'd2222222-2222-2222-2222-222222222222',
    'Revisar lenguaje',
    'Seed de ejemplo para que el panel admin tenga datos.',
    'pending'
  )
on conflict do nothing;
