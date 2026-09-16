import assert from "node:assert/strict";
import { test } from "node:test";

import {
  decodeLegacyText,
  extractVimeoId,
  formatPublishedAt,
  formatViews,
  normalizeCategoryRoute,
  normalizeCategoryVideoSort,
  normalizeRecentVideosPage,
  normalizeVimeoWatchId,
} from "../../lib/home/catalog";
import {
  createLibraryExcerpt,
  stripLegacyContent,
} from "../../lib/home/library";

test("home: identifica vídeos Vimeo nos dois formatos usados pelo legado", () => {
  assert.equal(extractVimeoId("1131716018", ""), "1131716018");
  assert.equal(
    extractVimeoId("", "https%3A%2F%2Fplayer.vimeo.com%2Fvideo%2F1131716018"),
    "1131716018",
  );
  assert.equal(
    extractVimeoId("", "https://player.vimeo.com/video/1131716018?autoplay=1"),
    "1131716018",
  );
});

test("home: normaliza a página de vídeos recentes", () => {
  assert.equal(normalizeRecentVideosPage(undefined), 1);
  assert.equal(normalizeRecentVideosPage(""), 1);
  assert.equal(normalizeRecentVideosPage("0"), 1);
  assert.equal(normalizeRecentVideosPage("-2"), 1);
  assert.equal(normalizeRecentVideosPage("2.5"), 1);
  assert.equal(normalizeRecentVideosPage("3"), 3);
  assert.equal(normalizeRecentVideosPage("999999999999999999999"), 1);
});

test("home: normaliza rotas e ordenação de categorias", () => {
  assert.equal(normalizeCategoryRoute("categoria-vendas"), "vendas");
  assert.equal(
    normalizeCategoryRoute("categoria-integra%C3%A7%C3%A3o"),
    "integração",
  );
  assert.equal(normalizeCategoryRoute("vendas"), null);
  assert.equal(normalizeCategoryRoute("categoria-"), null);
  assert.equal(normalizeCategoryRoute("categoria-a%2Fb"), null);
  assert.equal(normalizeCategoryRoute("categoria-%ZZ"), null);
  assert.equal(normalizeCategoryRoute(`categoria-${"x".repeat(161)}`), null);

  assert.equal(normalizeCategoryVideoSort(undefined), "data-desc");
  assert.equal(normalizeCategoryVideoSort("nome-asc"), "nome-asc");
  assert.equal(normalizeCategoryVideoSort("duracao-desc"), "duracao-desc");
  assert.equal(normalizeCategoryVideoSort("featured"), "data-desc");

  assert.equal(normalizeVimeoWatchId("1131716018"), "1131716018");
  assert.equal(normalizeVimeoWatchId(" abc "), null);
  assert.equal(normalizeVimeoWatchId("123 OR 1=1"), null);
});

test("home: recusa fontes externas e valores Vimeo malformados", () => {
  assert.equal(
    extractVimeoId("abc", "https://youtube.com/watch?v=1131716018"),
    null,
  );
  assert.equal(extractVimeoId("", "https%ZZplayer.vimeo.com/video/123"), null);
  assert.equal(extractVimeoId("123 OR 1=1", ""), null);
});

test("home: apresenta metadados legados sem expor HTML", () => {
  assert.equal(
    decodeLegacyText("L&#039;Oréal &amp; companhia"),
    "L'Oréal & companhia",
  );
  assert.equal(formatViews(1), "1 visualização");
  assert.equal(formatViews(1250), "1.250 visualizações");
  assert.equal(formatPublishedAt(1_700_000_000, 1_700_000_000), "hoje");
  assert.equal(
    formatPublishedAt(1_700_000_000, 1_700_000_000 + 60 * 86_400),
    "há 2 meses",
  );
});

test("home: biblioteca resume páginas customizadas sem HTML legado", () => {
  assert.equal(
    stripLegacyContent(
      "<h1>Guia</h1><script>alert(1)</script><p>L&#039;Oréal&nbsp;&amp; vendas</p>",
    ),
    "Guia L'Oréal & vendas",
  );
  assert.equal(
    createLibraryExcerpt("palavra ".repeat(60), 40),
    "palavra palavra palavra palavra...",
  );
});
