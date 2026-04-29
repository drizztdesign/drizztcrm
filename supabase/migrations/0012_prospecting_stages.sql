-- Add prospecting stages: leads imported from the buscador (lead finder)
-- are now segmented into 3 pre-pipeline stages based on available data.
-- prospecto_email: has scraped email → ready for automated cold email
-- prospecto_web  : has website but no email found → need to find contact
-- prospecto_frio : no website and no email → cold, WhatsApp-only approach

alter type lead_stage add value if not exists 'prospecto_email';
alter type lead_stage add value if not exists 'prospecto_web';
alter type lead_stage add value if not exists 'prospecto_frio';
