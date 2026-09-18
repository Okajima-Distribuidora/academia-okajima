-- Copy the initial Academy catalog from the validated development dataset.
-- This migration is idempotent: it only adds missing rows and resolves videos by
-- their stable legacy videos.video_id, never by environment-specific numeric IDs.

INSERT IGNORE INTO academy_categories
  (name, slug, description, sort_order, is_active, created_at, updated_at)
VALUES
  ('Industria', 'industria', NULL, '10', '1', '2026-09-08 19:31:28', '2026-09-08 19:31:28'),
  ('Bees', 'bees', NULL, '20', '1', '2026-09-08 19:31:28', '2026-09-08 19:31:28'),
  ('Integração', 'integracao', NULL, '30', '1', '2026-09-08 19:31:28', '2026-09-08 19:31:28'),
  ('Okacast', 'okacast', NULL, '40', '1', '2026-09-08 19:31:28', '2026-09-08 19:31:28');

INSERT IGNORE INTO academy_subcategories
  (category_id, name, slug, description, sort_order, is_active, created_at, updated_at)
SELECT category.id, source.name, source.slug, source.description, source.sort_order, source.is_active, source.created_at, source.updated_at
FROM (
  SELECT 'industria' AS category_slug, 'Farmax / Hidraderm' AS name, 'farmax-hidraderm' AS slug, NULL AS description, '10' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'industria' AS category_slug, 'Farmax / Sunless' AS name, 'farmax-sunless' AS slug, NULL AS description, '20' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'industria' AS category_slug, 'Farmax / Moskitoff' AS name, 'farmax-moskitoff' AS slug, NULL AS description, '30' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'industria' AS category_slug, 'Farmax / Óleos' AS name, 'farmax-oleos' AS slug, NULL AS description, '40' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'industria' AS category_slug, 'Farmax / Básicos' AS name, 'farmax-basicos' AS slug, NULL AS description, '50' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'industria' AS category_slug, 'Bombril' AS name, 'bombril' AS slug, NULL AS description, '60' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'industria' AS category_slug, 'L''Oréal' AS name, 'loreal' AS slug, NULL AS description, '70' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'industria' AS category_slug, 'Panasonic' AS name, 'panasonic' AS slug, NULL AS description, '80' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'industria' AS category_slug, 'Grendene' AS name, 'grendene' AS slug, NULL AS description, '90' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'bees' AS category_slug, 'Introdução ao BEES' AS name, 'introducao-ao-bees' AS slug, NULL AS description, '10' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'bees' AS category_slug, 'BEES Force' AS name, 'bees-force' AS slug, NULL AS description, '20' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'bees' AS category_slug, 'BEES Link' AS name, 'bees-link' AS slug, NULL AS description, '30' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'bees' AS category_slug, 'BEES Customer' AS name, 'bees-customer' AS slug, NULL AS description, '40' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'bees' AS category_slug, 'Blitz BEES' AS name, 'blitz-bees' AS slug, NULL AS description, '50' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'integracao' AS category_slug, 'Integração Geral' AS name, 'integracao-geral' AS slug, NULL AS description, '10' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'integracao' AS category_slug, 'Integração Supervisores' AS name, 'integracao-supervisores' AS slug, NULL AS description, '20' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'okacast' AS category_slug, 'Institucional' AS name, 'institucional' AS slug, NULL AS description, '10' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'okacast' AS category_slug, 'Eventos' AS name, 'eventos' AS slug, NULL AS description, '20' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'okacast' AS category_slug, 'Histórias para Inspirar' AS name, 'historias-para-inspirar' AS slug, NULL AS description, '30' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'okacast' AS category_slug, 'Comunicados' AS name, 'comunicados' AS slug, NULL AS description, '40' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
  UNION ALL SELECT 'okacast' AS category_slug, 'Conteúdos Okacast' AS name, 'conteudos-okacast' AS slug, NULL AS description, '50' AS sort_order, '1' AS is_active, '2026-09-08 19:31:28' AS created_at, '2026-09-08 19:31:28' AS updated_at
) AS source
JOIN academy_categories AS category ON category.slug = source.category_slug;

INSERT IGNORE INTO academy_video_subcategories
  (video_id, subcategory_id)
SELECT video.id, subcategory.id
FROM (
  SELECT '1MtcWavXuKQCJ8u' AS video_id, 'bees' AS category_slug, 'bees-link' AS subcategory_slug
  UNION ALL SELECT '2DRbHYWnevwVFFs' AS video_id, 'industria' AS category_slug, 'grendene' AS subcategory_slug
  UNION ALL SELECT '2EtHrNhyPGvRzPN' AS video_id, 'industria' AS category_slug, 'farmax-moskitoff' AS subcategory_slug
  UNION ALL SELECT '2jCF41psB7NXiRN' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT '2psBoIwPcRQyCSe' AS video_id, 'industria' AS category_slug, 'grendene' AS subcategory_slug
  UNION ALL SELECT '2R6INCLAa7e9WRN' AS video_id, 'bees' AS category_slug, 'blitz-bees' AS subcategory_slug
  UNION ALL SELECT '2W5OKgPLZVC8WzR' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT '3HGDaZmkIxdVR4r' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT '3w4uKjNSXqqWhC9' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT '3ZjtJGJqivrpWGZ' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT '4ipUT455OkeDIyr' AS video_id, 'bees' AS category_slug, 'blitz-bees' AS subcategory_slug
  UNION ALL SELECT '5lq2QPgQ648FGxA' AS video_id, 'okacast' AS category_slug, 'eventos' AS subcategory_slug
  UNION ALL SELECT '63l3WoZshomaaWY' AS video_id, 'bees' AS category_slug, 'bees-link' AS subcategory_slug
  UNION ALL SELECT '6CRWBfhFVuazLPh' AS video_id, 'industria' AS category_slug, 'panasonic' AS subcategory_slug
  UNION ALL SELECT '6H4D2Spx1d3mnnL' AS video_id, 'integracao' AS category_slug, 'integracao-geral' AS subcategory_slug
  UNION ALL SELECT '6jR1Kgn5V2tb8eT' AS video_id, 'bees' AS category_slug, 'introducao-ao-bees' AS subcategory_slug
  UNION ALL SELECT '7KaAadETUYAxwK1' AS video_id, 'industria' AS category_slug, 'loreal' AS subcategory_slug
  UNION ALL SELECT 'A9EX7UZqK3tY9Jt' AS video_id, 'integracao' AS category_slug, 'integracao-geral' AS subcategory_slug
  UNION ALL SELECT 'aivpnpjYglFE8oI' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'B2dgeUe5E4VOHmG' AS video_id, 'industria' AS category_slug, 'farmax-sunless' AS subcategory_slug
  UNION ALL SELECT 'BbVLhtTDMkynDgb' AS video_id, 'bees' AS category_slug, 'blitz-bees' AS subcategory_slug
  UNION ALL SELECT 'bbvw6pbXgTsMv8l' AS video_id, 'okacast' AS category_slug, 'eventos' AS subcategory_slug
  UNION ALL SELECT 'bcW39ewuP3kBosk' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'BdD61Cih9hgB1ce' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'bnzqBsncR2QQUBR' AS video_id, 'industria' AS category_slug, 'farmax-sunless' AS subcategory_slug
  UNION ALL SELECT 'bZArakOzYT6Izlg' AS video_id, 'okacast' AS category_slug, 'eventos' AS subcategory_slug
  UNION ALL SELECT 'c6j1XJJryQmPH9Z' AS video_id, 'industria' AS category_slug, 'panasonic' AS subcategory_slug
  UNION ALL SELECT 'cisEQHs85inyTNu' AS video_id, 'okacast' AS category_slug, 'eventos' AS subcategory_slug
  UNION ALL SELECT 'd9LdfiqEl5qBBO2' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'DaPbojtebO4oH7E' AS video_id, 'industria' AS category_slug, 'loreal' AS subcategory_slug
  UNION ALL SELECT 'DhYCrxEVy57aqaa' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'DVo3TwzA6UC7fob' AS video_id, 'industria' AS category_slug, 'farmax-sunless' AS subcategory_slug
  UNION ALL SELECT 'EjSL6lV3byuJf8v' AS video_id, 'industria' AS category_slug, 'loreal' AS subcategory_slug
  UNION ALL SELECT 'eMEPcDKzWVEW92I' AS video_id, 'industria' AS category_slug, 'farmax-basicos' AS subcategory_slug
  UNION ALL SELECT 'eOo2SjhuGdrWeVo' AS video_id, 'industria' AS category_slug, 'loreal' AS subcategory_slug
  UNION ALL SELECT 'ePCZVCKfUDPcz83' AS video_id, 'industria' AS category_slug, 'bombril' AS subcategory_slug
  UNION ALL SELECT 'fClgpUZdmoPpoqM' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'FDGys5S5IOXtbhL' AS video_id, 'industria' AS category_slug, 'farmax-sunless' AS subcategory_slug
  UNION ALL SELECT 'feARvSDl2ZVyj43' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'fJLzKjWRFb4ANXA' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'FkrwpG5cFSxLrti' AS video_id, 'integracao' AS category_slug, 'integracao-supervisores' AS subcategory_slug
  UNION ALL SELECT 'GpB41XWWPMEn4rW' AS video_id, 'bees' AS category_slug, 'blitz-bees' AS subcategory_slug
  UNION ALL SELECT 'hOq3R3tSTxBeaKg' AS video_id, 'industria' AS category_slug, 'farmax-hidraderm' AS subcategory_slug
  UNION ALL SELECT 'HPxGfUdXiutWRRr' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'IzIa61fTzpcDWsI' AS video_id, 'integracao' AS category_slug, 'integracao-geral' AS subcategory_slug
  UNION ALL SELECT 'izIkUdotG8oJIG4' AS video_id, 'industria' AS category_slug, 'farmax-hidraderm' AS subcategory_slug
  UNION ALL SELECT 'J6PYLdrAHBqTkXP' AS video_id, 'okacast' AS category_slug, 'comunicados' AS subcategory_slug
  UNION ALL SELECT 'Jm8izmRtCzoQx77' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'jwUh3GLVQ1Skb3G' AS video_id, 'industria' AS category_slug, 'farmax-hidraderm' AS subcategory_slug
  UNION ALL SELECT 'KCAszZe5JnORuHd' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'kw9ZGnPKGsYTvxS' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'kXbE1NsrrLKrqSP' AS video_id, 'bees' AS category_slug, 'bees-customer' AS subcategory_slug
  UNION ALL SELECT 'L4Tp7TfcLISLeTg' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'lJ49e9jzSr4iRWe' AS video_id, 'industria' AS category_slug, 'bombril' AS subcategory_slug
  UNION ALL SELECT 'Lj4PkdDQPpw7jaQ' AS video_id, 'industria' AS category_slug, 'grendene' AS subcategory_slug
  UNION ALL SELECT 'mfx6JAR5FjNovUK' AS video_id, 'industria' AS category_slug, 'loreal' AS subcategory_slug
  UNION ALL SELECT 'MGdEnwLQWy9ioN7' AS video_id, 'bees' AS category_slug, 'bees-force' AS subcategory_slug
  UNION ALL SELECT 'mrOHiBp8U4SvugN' AS video_id, 'okacast' AS category_slug, 'eventos' AS subcategory_slug
  UNION ALL SELECT 'nEbeErYgCuRaBvv' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'NvaNGkUVCwAwGQZ' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'ou9T9eesVKPBdSf' AS video_id, 'industria' AS category_slug, 'farmax-basicos' AS subcategory_slug
  UNION ALL SELECT 'PJ7CVQoChq3lRV8' AS video_id, 'okacast' AS category_slug, 'comunicados' AS subcategory_slug
  UNION ALL SELECT 'PTv87pVJUymExG6' AS video_id, 'integracao' AS category_slug, 'integracao-geral' AS subcategory_slug
  UNION ALL SELECT 'PvgiwZVVEkuIdrh' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'qK4UgkritEeAJXp' AS video_id, 'industria' AS category_slug, 'grendene' AS subcategory_slug
  UNION ALL SELECT 'QvIZGSyun1XS2Fh' AS video_id, 'bees' AS category_slug, 'blitz-bees' AS subcategory_slug
  UNION ALL SELECT 'sblhJyLNXEBKsqY' AS video_id, 'bees' AS category_slug, 'bees-force' AS subcategory_slug
  UNION ALL SELECT 'sJ8XGxaYUJLK2mI' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'tI6QDWnWQ21C4Nx' AS video_id, 'okacast' AS category_slug, 'institucional' AS subcategory_slug
  UNION ALL SELECT 'u1OOUJbXTowH9kl' AS video_id, 'integracao' AS category_slug, 'integracao-supervisores' AS subcategory_slug
  UNION ALL SELECT 'u2qX2bohwA6O6ij' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'ukEqKnrzeRKR8Cz' AS video_id, 'integracao' AS category_slug, 'integracao-geral' AS subcategory_slug
  UNION ALL SELECT 'uOMVQWeAyt1e86o' AS video_id, 'industria' AS category_slug, 'grendene' AS subcategory_slug
  UNION ALL SELECT 'v5Pgo23wySgKa7x' AS video_id, 'okacast' AS category_slug, 'conteudos-okacast' AS subcategory_slug
  UNION ALL SELECT 'VbYbVqPUPAyluZT' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'vcnz8PNdRetsAU2' AS video_id, 'industria' AS category_slug, 'loreal' AS subcategory_slug
  UNION ALL SELECT 'vIb2fxisxHJIUin' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'vK8ReNfE7LHlDMF' AS video_id, 'okacast' AS category_slug, 'eventos' AS subcategory_slug
  UNION ALL SELECT 'W3vXWZd3uhbZQEp' AS video_id, 'industria' AS category_slug, 'bombril' AS subcategory_slug
  UNION ALL SELECT 'XheNf74vzyuYTny' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'XumpUJPJgv4OSr3' AS video_id, 'industria' AS category_slug, 'farmax-oleos' AS subcategory_slug
  UNION ALL SELECT 'xX66BiYSEy5TWEC' AS video_id, 'industria' AS category_slug, 'farmax-sunless' AS subcategory_slug
  UNION ALL SELECT 'xXwlMNQZWojFLuE' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'Y5ozOWSwZGkFQJ8' AS video_id, 'integracao' AS category_slug, 'integracao-supervisores' AS subcategory_slug
  UNION ALL SELECT 'YhNCRuhAAiBNyWb' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'YOrVxLV8WHeWYep' AS video_id, 'industria' AS category_slug, 'farmax-sunless' AS subcategory_slug
  UNION ALL SELECT 'zPQZeDXvs3s1dai' AS video_id, 'integracao' AS category_slug, 'integracao-geral' AS subcategory_slug
  UNION ALL SELECT 'ZpTnSCbvTXN62F7' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'ZuXQCwrnn42WCZt' AS video_id, 'okacast' AS category_slug, 'historias-para-inspirar' AS subcategory_slug
  UNION ALL SELECT 'zZwpYG1rLBdrDJf' AS video_id, 'industria' AS category_slug, 'panasonic' AS subcategory_slug
) AS source
JOIN videos AS video ON video.video_id = source.video_id
JOIN academy_categories AS category ON category.slug = source.category_slug
JOIN academy_subcategories AS subcategory
  ON subcategory.category_id = category.id
  AND subcategory.slug = source.subcategory_slug;


