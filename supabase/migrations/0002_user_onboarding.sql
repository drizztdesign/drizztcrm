-- Per-user onboarding: when a user signs up, seed their workspace with
-- templates, automations and scoring rules (personalizable).

create or replace function public.seed_user_defaults(uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.scoring_rules (owner_id, name, description_es, description_en, weight, enabled, predicate) values
    (uid, 'Tiene web propia', 'Señal de madurez digital.', 'Digital maturity signal.', 10, true, '{"kind":"hasWebsite"}'::jsonb),
    (uid, 'Viene por referido o cliente anterior', 'Cuentan con confianza previa.', 'Prior trust baked in.', 20, true, '{"kind":"sourceIn","values":["referido","cliente_ant"]}'::jsonb),
    (uid, 'Proyecto premium o ecommerce', 'Ticket alto, márgenes mejores.', 'High ticket, better margins.', 15, true, '{"kind":"projectTypeIn","values":["premium","ecommerce"]}'::jsonb),
    (uid, 'Presupuesto estimado ≥ 4.000€', 'Filtra tire-kickers.', 'Filters tire-kickers.', 15, true, '{"kind":"priceEstimatedMin","min":4000}'::jsonb),
    (uid, 'Dolor de ventas', 'Motivación fuerte para pagar.', 'Strong pay-to-solve motivation.', 12, true, '{"kind":"hasPain","values":["no_contactos","vender_mas"]}'::jsonb),
    (uid, 'Sector premium', 'Clínica, inmobiliaria, legal.', 'Healthcare, real estate, legal.', 8, true, '{"kind":"sectorIn","values":["Salud","Inmobiliaria","Legal","Finanzas"]}'::jsonb),
    (uid, 'Actividad en los últimos 7 días', 'Conversación en caliente.', 'Hot conversation.', 10, true, '{"kind":"recentTouch","days":7}'::jsonb),
    (uid, 'Tag "Recurrente"', 'Cliente ya probado.', 'Proven client.', 10, true, '{"kind":"tagContains","value":"Recurrente"}'::jsonb);

  insert into public.automations (owner_id, name, description_es, description_en, icon, enabled, trigger, action) values
    (uid, 'Follow-up a 2 días sin respuesta', 'Lead en Contactado > 2 días sin respuesta → crea tarea.', 'Lead in Contacted > 2 days → follow-up task.', '⏱', true, '{"kind":"noTouchFor","days":2,"stage":"contactado"}'::jsonb, '{"kind":"createTask","taskKind":"whatsapp","taskTitle":"Follow-up de contacto"}'::jsonb),
    (uid, 'Alerta lead caliente sin próxima acción', 'Lead caliente sin acción → marcar URGENTE.', 'Hot lead no action → URGENT.', '🔥', true, '{"kind":"leadOpened","tempMin":"hot"}'::jsonb, '{"kind":"markUrgent"}'::jsonb),
    (uid, 'Recordar propuesta a 3 días', 'Propuesta enviada hace 3 días sin respuesta.', 'Proposal sent 3 days ago without reply.', '📬', true, '{"kind":"daysInStage","stage":"propuesta","days":3}'::jsonb, '{"kind":"suggestTemplate"}'::jsonb),
    (uid, 'Detectar lead estancado', 'Lead > 10 días en misma etapa.', 'Lead > 10 days in same stage.', '🚧', true, '{"kind":"stageAge","days":10}'::jsonb, '{"kind":"markUrgent"}'::jsonb),
    (uid, 'Probabilidad auto por etapa', 'Ajusta probabilidad al cambiar de etapa.', 'Adjust probability on stage change.', '📊', true, '{"kind":"stageEnter"}'::jsonb, '{"kind":"adjustProbability"}'::jsonb),
    (uid, 'Ofrecer mantenimiento post-entrega', 'Tarea en 30 días para ofrecer mantenimiento.', 'Maintenance pitch task in 30 days.', '🛠', true, '{"kind":"postStageEnter","postStage":"entregada"}'::jsonb, '{"kind":"createTask","taskKind":"email","taskTitle":"Ofrecer mantenimiento"}'::jsonb),
    (uid, 'Pedir reseña a cliente satisfecho', 'Cliente entregado > 14 días.', 'Delivered client > 14 days.', '⭐', true, '{"kind":"postStageEnter","postStage":"entregada","days":14}'::jsonb, '{"kind":"suggestTemplate"}'::jsonb),
    (uid, 'Pedir referido a cliente recurrente', 'Cliente en mantenimiento > 90 días.', 'Client in maintenance > 90 days.', '🤝', true, '{"kind":"postStageEnter","postStage":"mantenimiento","days":90}'::jsonb, '{"kind":"suggestTemplate"}'::jsonb),
    (uid, 'IA · siguiente mejor acción', 'Al abrir ficha, IA sugiere próximo paso.', 'On lead open, AI suggests next step.', '✨', false, '{"kind":"leadOpened"}'::jsonb, '{"kind":"appendTimeline"}'::jsonb),
    (uid, 'Archivar leads muertos', 'Sin actividad 21 días → Perdido.', 'No activity 21 days → Lost.', '❄', true, '{"kind":"noTouchFor","days":21}'::jsonb, '{"kind":"moveStage","stage":"lost"}'::jsonb);

  insert into public.templates (owner_id, stage, channel, lang, title, subject, body) values
    (uid, 'lead','whatsapp','es','Primer contacto — negocio SIN web', null, 'Hola {{contacto}}, soy Drizzt de Drizzt Design.'||E'\n\n'||'Vi el Instagram de {{empresa}} y me flipa lo que hacéis offline. Pero no tenéis web — y cada semana estáis perdiendo clientes que os buscan en Google y no os encuentran.'||E'\n\n'||'Tengo un hueco este mes para una landing que convierta. ¿Te mando 2 ejemplos similares?'),
    (uid, 'lead','email','es','Primer contacto — web ANTIGUA','Tu web de {{empresa}} (con cariño)','Hola {{contacto}},'||E'\n\n'||'Soy Drizzt, diseño webs para negocios como el tuyo. Estuve en {{web}} y con todo el cariño: se nota que tiene unos años.'||E'\n\n'||'Lo importante no es que sea "fea" — es que te está costando clientes:'||E'\n\n'||'→ {{problema_1}}'||E'\n'||'→ {{problema_2}}'||E'\n'||'→ {{problema_3}}'||E'\n\n'||'Te grabé un Loom de 2 min con el detalle. Si te encaja, presupuesto cerrado en 48h.'),
    (uid, 'contactado','whatsapp','es','Seguimiento WhatsApp sin respuesta', null, '{{contacto}}, sé que estás liado 🙏'||E'\n\n'||'Si ahora no es el momento, dímelo con un "no" y dejo de molestar. Si es "más adelante", te escribo en 30 días.'||E'\n\n'||'Si te lo pensaste y sigue sonando bien, te mando el link de Calendly para vernos 20 min.'),
    (uid, 'interesado','whatsapp','es','Cerrar reunión de descubrimiento', null, '¡Perfecto {{contacto}}! 🙌'||E'\n\n'||'Para hacerte una propuesta ajustada necesito 25 min por Meet. Te mando 3 huecos:'||E'\n\n'||'• {{slot_1}}'||E'\n'||'• {{slot_2}}'||E'\n'||'• {{slot_3}}'||E'\n\n'||'Si no te cuadra ninguno, mándame 2 tuyos.'),
    (uid, 'propuesta','email','es','Envío de propuesta','Propuesta {{empresa}} — {{presupuesto}}€','Hola {{contacto}},'||E'\n\n'||'Adjunto la propuesta. En una línea:'||E'\n\n'||'💡 Web nueva en 3 semanas, enfocada en {{objetivo}}, por {{presupuesto}}€ (pago 50/50).'||E'\n\n'||'La propuesta es válida 7 días. Si tienes dudas, llámame al {{telefono}}.'),
    (uid, 'propuesta','email','es','Seguimiento post-propuesta (3 días)','¿Te faltan datos para decidir sobre {{empresa}}?','Hola {{contacto}},'||E'\n\n'||'Vi que abriste la propuesta pero no hemos hablado. Los 3 bloqueos más habituales:'||E'\n\n'||'1. Precio → te enseño ROI proyectado'||E'\n'||'2. Plazos → slot libre en 2 semanas'||E'\n'||'3. Alcance → lo parto en fases'||E'\n\n'||'¿Cuál es el tuyo? Lo resolvemos en 15 min.'),
    (uid, 'negociacion','whatsapp','es','Pedir decisión final (cierre suave)', null, '{{contacto}}, para bloquearte el slot de arranque necesito decisión esta semana.'||E'\n\n'||'Si cerramos hoy:'||E'\n'||'✓ Arrancamos el lunes (en vez de en 3 semanas)'||E'\n'||'✓ Mantengo precio de {{presupuesto}}€'||E'\n\n'||'¿Contrato por DocuSign o lo dejamos para más adelante?'),
    (uid, 'negociacion','email','es','Cliente dice «es caro» (elegante)','Re: Inversión de {{empresa}}','Hola {{contacto}},'||E'\n\n'||'Entiendo la preocupación. Una web mal hecha sale carísima — te cuesta clientes cada mes.'||E'\n\n'||'Una buena web trabaja 24/7 sin quejarse. Si en 6 meses te trae 10 clientes extra de {{ticket}}€, ya se paga sola.'||E'\n\n'||'Te propongo 3 caminos:'||E'\n\n'||'1. Partir el proyecto en 2 fases (inversión menor al arranque)'||E'\n'||'2. Versión «esencial» a 70% del precio, con menos alcance'||E'\n'||'3. Plan de 12 meses: 50% ahora, 50% en 6 cuotas'||E'\n\n'||'¿Cuál te encaja mejor?'),
    (uid, 'cerrado','email','es','Bienvenida + kickoff','🎉 Bienvenida a Drizzt Design','Hola {{contacto}},'||E'\n\n'||'¡Oficialmente a bordo! Próxima semana:'||E'\n\n'||'📅 Lunes 10:00 — Kickoff (45 min)'||E'\n'||'📝 Miércoles — Brief creativo'||E'\n'||'🎨 Viernes — Referencias de estilo'||E'\n\n'||'Te envié: Notion compartido, Slack, factura 1/2.'),
    (uid, 'cerrado','email','es','Ofrecer mantenimiento post-entrega','La web está viva — ahora viene lo importante','Hola {{contacto}},'||E'\n\n'||'Enhorabuena por el lanzamiento. Ahora es cuando empieza lo que de verdad mueve la aguja.'||E'\n\n'||'Una web sin mantenimiento envejece rápido: se rompe, baja en Google y deja de convertir.'||E'\n\n'||'Mi plan: {{mantenimiento}}€/mes. Incluye:'||E'\n'||'✓ Actualizaciones de seguridad semanales'||E'\n'||'✓ Backup diario + monitorización'||E'\n'||'✓ 1h de cambios al mes'||E'\n'||'✓ Reporte mensual de tráfico y conversiones'),
    (uid, 'cerrado','email','es','Pedir reseña (cliente satisfecho)','Un favor pequeño 🙏','Hola {{contacto}},'||E'\n\n'||'Espero que la web esté trayendo lo que esperabas. Un favor rápido:'||E'\n\n'||'Si te sientes cómodo, ¿me dejarías una reseña en Google? Son 2 minutos y para mí es oro.'||E'\n\n'||'Link directo: {{link_resena}}'),
    (uid, 'cerrado','whatsapp','es','Pedir referido', null, '{{contacto}} 👋 pregunta rápida:'||E'\n\n'||'¿Conoces a alguien que esté rediseñando la web? Me ayudaría muchísimo que nos presentes.'||E'\n\n'||'Por cada referido que cierre, tú te llevas 150€ de descuento o 1 mes de mantenimiento gratis.'),
    (uid, 'lead','instagram','es','DM — visto vuestro post', null, 'Hey {{contacto}} 👋'||E'\n\n'||'Vi vuestro post ({{post}}) y me flipó. Entro en la bio y {{web}} no le hace justicia.'||E'\n\n'||'¿Te interesa un teardown de 2 min de qué cambiaría? Sin compromiso.'),
    (uid, 'propuesta','whatsapp','es','Follow-up breve post-propuesta', null, '{{contacto}} ¿has podido mirarlo? No quiero ser pesado, solo saber si seguimos.'||E'\n\n'||'Si necesitas otra versión (más barata, por fases, con más alcance), dímelo y la monto en 24h.'),
    (uid, 'interesado','email','es','Auditoría rápida con 3 fixes','3 cambios que subirían tus conversiones','Hola {{contacto}},'||E'\n\n'||'He mirado {{web}} con ojo de diseñador. Los 3 cambios con más impacto:'||E'\n\n'||'1. {{fix_1}} — impacto alto, esfuerzo bajo'||E'\n'||'2. {{fix_2}} — necesario antes de lanzar campañas'||E'\n'||'3. {{fix_3}} — lo que está dejando dinero sobre la mesa'||E'\n\n'||'¿Hablamos 20 min esta semana?'),
    (uid, 'reunion','email','es','Confirmación de reunión + brief','Confirmado: {{fecha}} — ¿qué trabajamos?','Hola {{contacto}},'||E'\n\n'||'Confirmo nuestra call el {{fecha}}. 25 min, por Google Meet.'||E'\n\n'||'Para aprovechar, dime antes:'||E'\n\n'||'1. ¿Qué problema te duele más ahora mismo con tu web?'||E'\n'||'2. ¿Tienes un presupuesto orientativo pensado?'||E'\n'||'3. ¿Cuándo te gustaría tenerla lista?'),
    (uid, 'any','whatsapp','es','Reactivar lead frío (genérica)', null, 'Hola {{contacto}} 👋'||E'\n\n'||'Sé que hace tiempo no hablamos. No te quiero molestar — solo checking in.'||E'\n\n'||'Si el proyecto sigue en el radar, seguimos. Si ya no encaja, dímelo con un "no" y te dejo tranquilo.'),
    (uid, 'propuesta','linkedin','es','LinkedIn — propuesta B2B', null, '{{contacto}}, gracias por el rato.'||E'\n\n'||'Como te comentaba, adjunto propuesta por LinkedIn:'||E'\n\n'||'→ Alcance: {{alcance}}'||E'\n'||'→ Inversión: {{presupuesto}}€'||E'\n'||'→ Plazo: {{plazo}}'||E'\n\n'||'Quedo pendiente de tus comentarios.'),
    (uid, 'lead','email','es','Primer contacto — con referido','{{referente}} me dijo que te escribiera','Hola {{contacto}},'||E'\n\n'||'{{referente}} me comentó que estabais rediseñando la web de {{empresa}} y que os podría encajar.'||E'\n\n'||'Cuento: diseño webs para {{sector}} en España. Últimos tres: {{cliente_1}}, {{cliente_2}}, {{cliente_3}}.'||E'\n\n'||'¿Una call de 20 min esta semana para ver si tiene sentido seguir?');
end $$;

-- Trigger on new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.seed_user_defaults(new.id);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
