import assert from "node:assert/strict";
import { test } from "node:test";
import { getHomeSection, homeSectionHref, homeSections, normalizeHomeSearch } from "../../lib/home/navigation";

test("home: mantém a ordem e os sete destinos solicitados", () => {
  assert.deepEqual(homeSections.map(({ label }) => label), ["Home", "Vídeos recentes", "Vídeos em alta", "Mais vistos", "Shorts", "Arquivos", "Ajuda"]);
  for (const section of homeSections) {
    assert.equal(getHomeSection(section.id).id, section.id);
    assert.ok(homeSectionHref(section.id).startsWith("/"));
  }
});

test("home: seções inválidas retornam ao início, sem destinos externos", () => {
  for (const value of [undefined, null, "", "unknown", "https://example.com", "__proto__"]) {
    assert.equal(getHomeSection(value).id, "home");
  }
  assert.equal(homeSectionHref("home"), "/");
  assert.equal(homeSectionHref("recentes"), "/?secao=recentes");
  assert.equal(homeSectionHref("em-alta"), "/?secao=em-alta");
});

test("home: busca normalizada, limitada e sem interpretar conteúdo como HTML", () => {
  assert.equal(normalizeHomeSearch(undefined), "");
  assert.equal(normalizeHomeSearch(null), "");
  assert.equal(normalizeHomeSearch("   "), "");
  assert.equal(normalizeHomeSearch("  integração e vendas  "), "integração e vendas");
  assert.equal(normalizeHomeSearch("x".repeat(121)).length, 120);
  assert.equal(normalizeHomeSearch("<script>alert(1)</script>"), "<script>alert(1)</script>");
});
