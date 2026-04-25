-- seed_demo_data() — callable RPC. Populates demo leads/contacts/companies for the current user.
create or replace function public.seed_demo_data()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
declare c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid; c7 uuid; c8 uuid;
declare c9 uuid; c10 uuid; c11 uuid; c12 uuid; c13 uuid; c14 uuid; c15 uuid; c16 uuid;
declare p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; p6 uuid; p7 uuid; p8 uuid;
declare p9 uuid; p10 uuid; p11 uuid; p12 uuid; p13 uuid; p14 uuid; p15 uuid; p16 uuid;
declare d1 uuid; d2 uuid; d3 uuid; d4 uuid; d5 uuid; d6 uuid; d7 uuid; d8 uuid;
declare d9 uuid; d10 uuid; d11 uuid; d12 uuid; d13 uuid; d14 uuid; d15 uuid; d16 uuid;
begin
  if uid is null then raise exception 'must be authenticated'; end if;

  -- Clear previous demo data only (keep user's personal edits gone clean)
  delete from public.timeline_events where owner_id = uid;
  delete from public.tasks           where owner_id = uid;
  delete from public.proposals       where owner_id = uid;
  delete from public.deals           where owner_id = uid;
  delete from public.contacts        where owner_id = uid;
  delete from public.companies       where owner_id = uid;

  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'Sakura Ramen Bar',       'sakuraramen.es',      'Restauración', 'Madrid',    '+34 612 455 118') returning id into c1;
  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'Clínica Dental Peña',    'dentalpena.com',      'Salud',        'Valencia',  '+34 654 902 771') returning id into c2;
  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'Forn de Gràcia',         '',                    'Panadería',    'Barcelona', '+34 699 320 445') returning id into c3;
  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'AutoGlass Vallés',       'autoglassvalles.es',  'Automoción',   'Sabadell',  '+34 671 118 002') returning id into c4;
  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'Estudio Pilates Mar',    'pilatesmar.com',      'Fitness',      'Málaga',    '+34 688 771 299') returning id into c5;
  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'Taberna El Rincón',      'elrincontaberna.es',  'Restauración', 'Sevilla',   '+34 655 008 441') returning id into c6;
  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'Vinoteca Rueda',         'vinotecarueda.com',   'E-commerce',   'Valladolid','+34 645 772 113') returning id into c7;
  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'Academia Lingua',        'academialingua.com',  'Educación',    'Zaragoza',  '+34 636 445 881') returning id into c8;
  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'Óptica Vives',           'opticavives.cat',     'Retail',       'Girona',    '+34 610 220 994') returning id into c9;
  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'Fincas Benítez',         'fincasbenitez.es',    'Inmobiliaria', 'Alicante',  '+34 678 993 104') returning id into c10;
  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'Barbería Odín',          'barberiaodin.com',    'Belleza',      'Bilbao',    '+34 649 003 225') returning id into c11;
  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'Estudio Yoga Prana',     'yogaprana.es',        'Fitness',      'Palma',     '+34 687 441 002') returning id into c12;
  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'Restaurante Costa',      'rcosta.es',           'Restauración', 'Cádiz',     '') returning id into c13;
  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'Ferretería Martín',      '',                    'Retail',       'León',      '') returning id into c14;
  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'Gimnasio Atlas',         'gimatlas.es',         'Fitness',      'Madrid',    '+34 611 223 445') returning id into c15;
  insert into public.companies (owner_id, name, website, sector, city, phone) values
    (uid, 'Cafetería Lumen',        'cafelumen.es',        'Restauración', 'Granada',   '+34 622 114 889') returning id into c16;

  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c1,  'Marta Delgado',    'Propietaria',        'marta@sakuraramen.es',    '+34 612 455 118', 'MD') returning id into p1;
  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c2,  'Dr. Javier Peña',  'Director',           'jpena@dentalpena.com',    '+34 654 902 771', 'JP') returning id into p2;
  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c3,  'Núria Bosch',      'Propietaria',        'hola@forndegracia.cat',   '+34 699 320 445', 'NB') returning id into p3;
  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c4,  'Raúl Jiménez',     'Gerente',            'raul@autoglassvalles.es', '+34 671 118 002', 'RJ') returning id into p4;
  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c5,  'Carla Ríos',       'Fundadora',          'carla@pilatesmar.com',    '+34 688 771 299', 'CR') returning id into p5;
  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c6,  'Pepe Aguilar',     'Dueño',              'pepe@elrincontaberna.es', '+34 655 008 441', 'PA') returning id into p6;
  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c7,  'Inés Cordero',     'E-commerce manager', 'ines@vinotecarueda.com',  '+34 645 772 113', 'IC') returning id into p7;
  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c8,  'Óscar Ferrer',     'Director',           'oscar@academialingua.com','+34 636 445 881', 'OF') returning id into p8;
  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c9,  'Laia Vives',       'Propietaria',        'laia@opticavives.cat',    '+34 610 220 994', 'LV') returning id into p9;
  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c10, 'Andrés Benítez',   'Socio',              'andres@fincasbenitez.es', '+34 678 993 104', 'AB') returning id into p10;
  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c11, 'Marcos Herrera',   'Dueño',              'hola@barberiaodin.com',   '+34 649 003 225', 'MH') returning id into p11;
  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c12, 'Elena Mota',       'Fundadora',          'elena@yogaprana.es',      '+34 687 441 002', 'EM') returning id into p12;
  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c13, 'Luis García',      'Gerente',            'luis@rcosta.es',          '',                 'LG') returning id into p13;
  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c14, 'Juan Martín',      'Dueño',              'juan@ferremartin.es',     '',                 'JM') returning id into p14;
  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c15, 'Sergio Ruiz',      'Dueño',              'sergio@gimatlas.es',      '+34 611 223 445', 'SR') returning id into p15;
  insert into public.contacts (owner_id, company_id, name, role, email, phone, avatar) values (uid, c16, 'Ana Gil',          'Fundadora',          'ana@cafelumen.es',        '+34 622 114 889', 'AG') returning id into p16;

  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, temp, score, price_estimated, price_offered, cost_estimated, pay_state, source, project_type, pain, problems, notes, entered_at, first_contact_at, last_touch, stage_entered_at, next_action, next_action_date, next_action_channel, next_action_status, tags)
    values (uid, 'L-041', c1, p1, 'Sakura Ramen Bar — Web corporativa', 'negociacion', 'superhot', 92, 4500, 4200, 1100, 'senal', 'instagram', 'corporativa', 'no_contactos',
      ARRAY['Web lenta (4.2s LCP)','No reservas online','No indexada en Google'],
      'Quiere lanzar antes del Mercado del Motor (22 mayo). Decisora directa.',
      '2026-03-14','2026-03-14','2026-04-24','2026-04-22','Enviar contrato firmado','Hoy 18:00','email','urgent', ARRAY['Ramen']) returning id into d1;
  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, temp, score, price_estimated, price_offered, cost_estimated, pay_state, source, project_type, pain, problems, notes, entered_at, first_contact_at, last_touch, stage_entered_at, next_action, next_action_date, next_action_channel, next_action_status, tags)
    values (uid, 'L-040', c2, p2, 'Clínica Dental Peña — Web premium', 'propuesta', 'hot', 79, 7200, 6800, 1800, 'pendiente', 'referido', 'premium', 'web_antigua',
      ARRAY['Web de 2017, no responsive','Sin sistema de citas','SEO competidores mejor'],
      'Tiene 2 clínicas. Decisión con su mujer (socia).',
      '2026-03-28','2026-03-28','2026-04-23','2026-04-23','Follow-up de propuesta','Mañana 10:00','email','ok', ARRAY['2 sedes']) returning id into d2;
  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, temp, score, price_estimated, cost_estimated, pay_state, source, project_type, pain, problems, notes, entered_at, first_contact_at, last_touch, stage_entered_at, next_action, next_action_date, next_action_channel, next_action_status, tags)
    values (uid, 'L-039', c3, p3, 'Forn de Gràcia — Landing', 'reunion', 'warm', 64, 2400, 600, 'pendiente', 'email_frio', 'landing', 'no_web',
      ARRAY['No tiene web','Solo Instagram','Pierde pedidos fin de semana'],
      'Negocio familiar, 3ª generación.',
      '2026-04-08','2026-04-08','2026-04-21','2026-04-21','Videocall descubrimiento','Jue 25 · 11:30','reunion','ok', ARRAY['Familiar']) returning id into d3;
  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, temp, score, price_estimated, cost_estimated, pay_state, source, project_type, pain, problems, notes, entered_at, first_contact_at, last_touch, stage_entered_at, next_action, next_action_date, next_action_channel, next_action_status, tags)
    values (uid, 'L-038', c4, p4, 'AutoGlass Vallés — Corporativa', 'interesado', 'warm', 58, 3500, 900, 'pendiente', 'google', 'corporativa', 'no_contactos',
      ARRAY['Web no capta leads','No tiene formulario'],
      'Reactivo. Primero quiere ver portfolio similar.',
      '2026-04-02','2026-04-03','2026-04-19','2026-04-10','Enviar 3 casos de estudio','Hoy','email','urgent', ARRAY['Taller']) returning id into d4;
  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, temp, score, price_estimated, cost_estimated, pay_state, source, project_type, pain, problems, notes, entered_at, first_contact_at, last_touch, stage_entered_at, next_action, next_action_date, next_action_channel, next_action_status, tags)
    values (uid, 'L-037', c5, p5, 'Pilates Mar — Rediseño', 'contactado', 'warm', 52, 2900, 750, 'pendiente', 'linkedin', 'redisenio', 'no_confianza',
      ARRAY['Web con plantilla','No diferenciación'],
      'Abrió mi email 4 veces en 2 días.',
      '2026-04-10','2026-04-11','2026-04-22','2026-04-11','Seguimiento WhatsApp','Hoy 17:00','whatsapp','urgent', ARRAY['Wellness']) returning id into d5;
  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, temp, score, price_estimated, cost_estimated, pay_state, source, project_type, pain, problems, notes, entered_at, last_touch, stage_entered_at, next_action_status, tags)
    values (uid, 'L-036', c6, p6, 'Taberna El Rincón — Landing', 'lead', 'cold', 31, 1800, 450, 'pendiente', 'networking', 'landing', 'web_antigua',
      ARRAY['Web antigua Flash','No aparece en Maps'],
      'Lo vi caminando. Dejé tarjeta.',
      '2026-04-16','2026-04-16','2026-04-16','missing', ARRAY['Tapas']) returning id into d6;
  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, post_stage, temp, score, price_estimated, price_offered, price_closed, cost_estimated, pay_state, source, project_type, pain, problems, notes, entered_at, first_contact_at, last_touch, stage_entered_at, next_action, next_action_date, next_action_channel, next_action_status, tags)
    values (uid, 'L-035', c7, p7, 'Vinoteca Rueda — E-commerce', 'cerrado', 'desarrollo', 'hot', 92, 10000, 9500, 9500, 2400, 'parcial', 'referido', 'ecommerce', 'vender_mas',
      ARRAY['Shopify mal configurado','No envío internacional'],
      'Cerrado el 18 abr. Pago 50/50. Arranca 5 mayo.',
      '2026-02-20','2026-02-21','2026-04-18','2026-04-18','Kickoff call','5 may 10:00','reunion','ok', ARRAY['Shopify']) returning id into d7;
  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, temp, score, price_estimated, price_offered, cost_estimated, pay_state, source, project_type, pain, problems, notes, entered_at, first_contact_at, last_touch, stage_entered_at, next_action, next_action_date, next_action_channel, next_action_status, tags)
    values (uid, 'L-034', c8, p8, 'Academia Lingua — Corporativa', 'propuesta', 'warm', 61, 5800, 5400, 1400, 'pendiente', 'email_frio', 'corporativa', 'no_contactos',
      ARRAY['Sin CRM integrado','No captura leads'],
      'Comparando con otro proveedor.',
      '2026-03-30','2026-03-31','2026-04-20','2026-04-18','Llamar para cerrar dudas','Mañana 12:00','llamada','ok', ARRAY['Cursos']) returning id into d8;
  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, temp, score, price_estimated, cost_estimated, pay_state, source, project_type, pain, problems, notes, entered_at, last_touch, stage_entered_at, next_action, next_action_date, next_action_channel, next_action_status, tags)
    values (uid, 'L-033', c9, p9, 'Óptica Vives — Rediseño', 'lead', 'cold', 28, 2200, 550, 'pendiente', 'web', 'redisenio', 'no_contactos',
      ARRAY['Web estática','Sin reserva de cita'],
      'Rellenó formulario pidiendo info.',
      '2026-04-22','2026-04-23','2026-04-22','Responder al formulario','Hoy','email','urgent', ARRAY['Retail']) returning id into d9;
  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, temp, score, price_estimated, cost_estimated, pay_state, source, project_type, pain, problems, notes, entered_at, first_contact_at, last_touch, stage_entered_at, next_action, next_action_date, next_action_channel, next_action_status, tags)
    values (uid, 'L-032', c10, p10, 'Fincas Benítez — Web premium', 'interesado', 'hot', 76, 8000, 2000, 'pendiente', 'linkedin', 'premium', 'no_contactos',
      ARRAY['Portal obsoleto','No integración Idealista'],
      'Mencionó presupuesto directamente. Urgencia temporada alta.',
      '2026-04-18','2026-04-18','2026-04-23','2026-04-21','Agendar call 30min','Mañana','llamada','ok', ARRAY['Costa']) returning id into d10;
  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, temp, score, price_estimated, cost_estimated, pay_state, source, project_type, pain, problems, notes, entered_at, first_contact_at, last_touch, stage_entered_at, next_action, next_action_date, next_action_channel, next_action_status, tags)
    values (uid, 'L-031', c11, p11, 'Barbería Odín — Landing', 'contactado', 'cold', 40, 1600, 400, 'pendiente', 'instagram', 'landing', 'web_antigua',
      ARRAY['Web muy básica','Reservas por DM'],
      'Respondió un emoji 👀.',
      '2026-04-11','2026-04-11','2026-04-18','2026-04-11','Último intento WhatsApp','Hoy','whatsapp','urgent', ARRAY['Barbería']) returning id into d11;
  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, temp, score, price_estimated, price_offered, cost_estimated, pay_state, source, project_type, pain, problems, notes, entered_at, first_contact_at, last_touch, stage_entered_at, next_action, next_action_date, next_action_channel, next_action_status, tags)
    values (uid, 'L-030', c12, p12, 'Yoga Prana — Corporativa', 'negociacion', 'hot', 83, 4000, 3800, 950, 'pendiente', 'referido', 'corporativa', 'vender_mas',
      ARRAY['Web no convierte','Quiere membresía online'],
      'Pide descuento 10%.',
      '2026-03-22','2026-03-22','2026-04-24','2026-04-23','Responder contrapropuesta','Hoy','email','urgent', ARRAY['Yoga']) returning id into d12;
  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, temp, score, price_estimated, price_offered, cost_estimated, pay_state, source, project_type, pain, problems, notes, entered_at, first_contact_at, last_touch, stage_entered_at, lost_reason, lost_at, next_action_status, tags)
    values (uid, 'L-029', c13, p13, 'Restaurante Costa (LOST)', 'lost', 'lost', 0, 3200, 3000, 800, 'pendiente', 'email_frio', 'corporativa', 'web_antigua',
      ARRAY['Web muy antigua'], 'Dijo que el precio era alto.',
      '2026-02-10','2026-02-10','2026-03-15','2026-03-15','precio','2026-03-15','none', ARRAY[]::text[]) returning id into d13;
  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, temp, score, price_estimated, cost_estimated, pay_state, source, project_type, pain, notes, entered_at, first_contact_at, last_touch, stage_entered_at, lost_reason, lost_at, next_action_status, tags)
    values (uid, 'L-028', c14, p14, 'Ferretería Martín (LOST)', 'lost', 'lost', 0, 2400, 600, 'pendiente', 'llamada', 'landing', 'no_web',
      'No volvió a responder WhatsApp.',
      '2026-02-28','2026-03-01','2026-03-20','2026-03-20','no_responde','2026-04-01','none', ARRAY[]::text[]) returning id into d14;
  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, post_stage, temp, score, price_estimated, price_offered, price_closed, cost_estimated, pay_state, source, project_type, pain, notes, entered_at, first_contact_at, last_touch, stage_entered_at, next_action, next_action_date, next_action_channel, next_action_status, tags)
    values (uid, 'L-021', c15, p15, 'Gimnasio Atlas — Corporativa', 'cerrado', 'mantenimiento', 'hot', 100, 5500, 5500, 5500, 1200, 'pagado', 'referido', 'corporativa', 'no_contactos',
      'Web entregada enero. Mantenimiento 150€/mes activo.',
      '2025-11-15','2025-11-15','2026-04-10','2026-01-10','Pedir reseña Google','Esta semana','email','ok', ARRAY['Recurrente']) returning id into d15;
  insert into public.deals (owner_id, code, company_id, contact_id, title, stage, post_stage, temp, score, price_estimated, price_offered, price_closed, cost_estimated, pay_state, source, project_type, pain, notes, entered_at, first_contact_at, last_touch, stage_entered_at, next_action, next_action_date, next_action_channel, next_action_status, tags)
    values (uid, 'L-020', c16, p16, 'Cafetería Lumen — Landing', 'cerrado', 'entregada', 'warm', 100, 2800, 2800, 2800, 650, 'pagado', 'web', 'landing', 'no_confianza',
      'Entregada 5 abril. Pendiente pedir referido.',
      '2026-02-01','2026-02-02','2026-04-05','2026-03-20','Ofrecer mantenimiento','Esta semana','email','ok', ARRAY['Café']) returning id into d16;

  insert into public.timeline_events (owner_id, deal_id, t, occurred_at, kind, who, body) values
    (uid, d1, 'Hace 2h',    now() - interval '2 hours',  'note',     'Tú',    'Aceptó presupuesto de 4.200€. Pide factura a nombre de Sakura S.L.'),
    (uid, d1, 'Ayer 17:40', now() - interval '1 day',    'whatsapp', 'Marta', 'Vale lo hablamos mañana con mi socio, pero por mi parte adelante 🙌'),
    (uid, d1, 'Ayer 12:10', now() - interval '1 day 5 hours', 'proposal','Tú','Propuesta v2 enviada (4.200€, 3 semanas).'),
    (uid, d1, '17 abr',     '2026-04-17'::timestamptz,    'meeting',  'Tú',    'Videocall 45min.'),
    (uid, d1, '12 abr',     '2026-04-12'::timestamptz,    'email',    'Tú',    'Primer contacto. Respondió en 3h.'),
    (uid, d2, 'Hace 1d',    now() - interval '1 day',      'email',   'Tú',     'Propuesta enviada. 6.800€ + 180€/mes mantenimiento.'),
    (uid, d2, '19 abr',     '2026-04-19'::timestamptz,     'meeting', 'Tú',     'Visita presencial.'),
    (uid, d2, '16 abr',     '2026-04-16'::timestamptz,     'email',   'Javier', 'Me interesa. ¿Podemos vernos el sábado?'),
    (uid, d3, 'Hace 3d',    now() - interval '3 days',     'whatsapp','Núria',  'Perfecto, el jueves a las 11:30 🥖'),
    (uid, d3, 'Hace 4d',    now() - interval '4 days',     'whatsapp','Tú',     'Te mando enlace de Meet para el jueves.'),
    (uid, d4, 'Hace 5d',    now() - interval '5 days',     'email',   'Raúl',   'Mándame ejemplos similares antes de seguir.'),
    (uid, d5, 'Hace 2d',    now() - interval '2 days',     'email',   'Tú',     'Seguimiento 1. Aún sin respuesta.'),
    (uid, d6, 'Hace 8d',    now() - interval '8 days',     'note',    'Tú',     'Pasé por la taberna. Dejé tarjeta.'),
    (uid, d7, '18 abr',     '2026-04-18'::timestamptz,     'note',    'Tú',     '🎉 CERRADO. 9.500€.'),
    (uid, d8, 'Hace 4d',    now() - interval '4 days',     'email',   'Óscar',  'Estamos viendo otra opción también.'),
    (uid, d9, 'Hace 1d',    now() - interval '1 day',      'form',    'Laia',   'Formulario: Hola, me interesa rediseño. ¿Precio?'),
    (uid, d10,'Hace 1d',    now() - interval '1 day',      'linkedin','Andrés', 'Sí, tenemos 6-8k para web nueva. ¿Cuándo hablamos?'),
    (uid, d11,'Hace 6d',    now() - interval '6 days',     'dm',      'Marcos', '👀'),
    (uid, d12,'Hace 4h',    now() - interval '4 hours',    'email',   'Elena',  '¿Podrías ajustar a 3.400? Cerramos esta semana.');

  insert into public.tasks (owner_id, deal_id, title, kind, due, priority, done) values
    (uid, d1,  'Enviar contrato firmado Sakura Ramen',  'proposal', 'Hoy 18:00',     'high',   false),
    (uid, d2,  'Follow-up propuesta Dental Peña',       'email',    'Mañana 10:00',  'high',   false),
    (uid, d12, 'Responder contrapropuesta Yoga Prana',  'email',    'Hoy',           'high',   false),
    (uid, d3,  'Videocall Forn de Gràcia',              'meeting',  'Jue 25 · 11:30','normal', false),
    (uid, d4,  '3 casos de estudio a AutoGlass',        'email',    'Hoy',           'normal', false),
    (uid, d5,  'Seguimiento Pilates Mar',               'whatsapp', 'Hoy 17:00',     'normal', false),
    (uid, d6,  'Primer contacto Taberna El Rincón',     'whatsapp', 'Pendiente',     'low',    false),
    (uid, d9,  'Responder formulario Óptica Vives',     'email',    'Hoy',           'normal', false),
    (uid, d10, 'Agendar call Fincas Benítez',           'meeting',  'Mañana',        'high',   false),
    (uid, d11, 'Último intento Barbería Odín',          'whatsapp', 'Hoy',           'low',    false),
    (uid, d8,  'Llamar Academia Lingua',                'call',     'Mañana 12:00',  'high',   false),
    (uid, d7,  'Cobrar 50% restante Vinoteca Rueda',    'payment',  'Hoy',           'high',   false),
    (uid, d15, 'Pedir reseña Gimnasio Atlas',           'email',    'Esta semana',   'low',    false),
    (uid, d16, 'Ofrecer mantenimiento Cafetería Lumen', 'email',    'Esta semana',   'normal', false);
end $$;

revoke execute on function public.seed_demo_data() from public;
grant execute on function public.seed_demo_data() to authenticated;
