import assert from "node:assert/strict";
import { test } from "node:test";
import {
  categoryHref,
  getHomeSection,
  homeSectionHref,
  homeSections,
  normalizeHomeSearch,
  videoWatchHref,
} from "../../lib/home/navigation";

test("home: mantém a ordem e os destinos solicitados", () => {
  assert.deepEqual(
    homeSections.map(({ label }) => label),
    ["Home", "Categoria", "Shorts", "Biblioteca", "Ajuda"],
  );
  for (const section of homeSections) {
    assert.equal(getHomeSection(section.id).id, section.id);
    assert.ok(homeSectionHref(section.id).startsWith("/"));
  }
});

test("home: seções inválidas retornam ao início, sem destinos externos", () => {
  for (const value of [
    undefined,
    null,
    "",
    "unknown",
    "https://example.com",
    "__proto__",
  ]) {
    assert.equal(getHomeSection(value).id, "home");
  }
  assert.equal(homeSectionHref("home"), "/");
  assert.equal(homeSectionHref("categoria"), "/?secao=categoria");
  assert.equal(homeSectionHref("biblioteca"), "/?secao=biblioteca");
  assert.equal(categoryHref({ slug: "vendas" }), "/categoria-vendas");
  assert.equal(
    categoryHref({ slug: "integração" }),
    "/categoria-integra%C3%A7%C3%A3o",
  );
  assert.equal(
    videoWatchHref({ slug: "vendas" }, { vimeoId: "1131716018" }),
    "/categoria-vendas/watch?v=1131716018",
  );
  assert.equal(
    videoWatchHref({ slug: "vendas" }, { vimeoId: null }),
    "/categoria-vendas",
  );
});

test("home: busca normalizada, limitada e sem interpretar conteúdo como HTML", () => {
  assert.equal(normalizeHomeSearch(undefined), "");
  assert.equal(normalizeHomeSearch(null), "");
  assert.equal(normalizeHomeSearch("   "), "");
  assert.equal(
    normalizeHomeSearch("  integração e vendas  "),
    "integração e vendas",
  );
  assert.equal(normalizeHomeSearch("x".repeat(121)).length, 120);
  assert.equal(
    normalizeHomeSearch("<script>alert(1)</script>"),
    "<script>alert(1)</script>",
  );
});
