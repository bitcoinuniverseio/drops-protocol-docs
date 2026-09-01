# Contributing

Thank you for wanting to improve the Drops documentation. This repository is small and has
no build step, so contributing is mostly a matter of editing HTML and checking your work in
a browser.

## Ground rules

**Facts come from code, not from memory.** Every rule, constant and error message on this
site was read out of the Bitcoin Universe implementation, its interface definition, or the
capability registry. If you change a factual statement, say in the pull request where the
new fact comes from. If you cannot point at a source, do not state it.

**Do not claim capability that is not wired up.** Code existing is not the same as a feature
being released. Where support could not be verified, this site says so or omits the claim.
Keep it that way.

**Attribute honestly.** Only Drops and OP_DROP originated at Bitcoin Universe. Other
protocols mentioned here originated elsewhere and are described as their own ecosystems
define them.

**Do not duplicate the OP_DROP specification.** This repository owns the Drops application
protocol: artifacts, pacts and lifecycle. The carrier specification is owned by
[bitcoinuniverseio/op-drop](https://github.com/bitcoinuniverseio/op-drop). Cross-link
generously and let each side own its own rules.

## Style

- No em dash characters anywhere, in content, code, comments or commit messages. Use commas,
  colons, periods or parentheses.
- When describing a definitive version, write "authoritative", "owning", "official", or
  "the source of truth". The one place the other spelling belongs is the required HTML
  attribute value `rel="canonical"`.
- Plain, direct writing. No filler, no unsupported superlatives, no manufactured urgency, no
  placeholder sections, no "coming soon".
- Prefer a diagram or a table to a wall of text.
- State limits and boundaries as plainly as capabilities.

## Technical constraints

These are deliberate and a pull request that breaks one will be asked to change.

- Static hand-authored HTML, CSS and vanilla JavaScript. No build step, no framework, no
  package manager, no external CDN, no web fonts, no trackers.
- Every page must work with JavaScript disabled. JavaScript enhances; it never gates content.
- Both themes must meet WCAG 2.2 AA contrast. Colours come from the custom properties at the
  top of `assets/drops.css`; add a token rather than a hard-coded colour.
- Responsive to 320px with no horizontal page overflow. Wide tables and code blocks scroll
  inside their own container.
- Semantic landmarks, a skip link, visible focus, correct heading order, real alt text on
  every image, and everything operable by keyboard.
- Diagrams are inline SVG with a `<title>` and a `<desc>`, using the `d-` classes so they
  stay legible in both themes.
- Budgets: CSS under 50KB, all JavaScript under 60KB, no image over 200KB.

## Adding or changing a page

1. Edit the HTML directly. Copy the `<head>`, masthead and footer from a neighbouring page so
   the furniture stays identical.
2. Give the page a unique `<title>`, a `meta name="description"`, a `link rel="canonical"`
   and Open Graph tags.
3. Fill in the footer provenance block: source path, specification revision, lifecycle,
   chain and networks, last-verified commit, and the edit-on-GitHub link.
4. Add the page to `sitemap.xml`, `llms.txt`, the site map on `index.html`, and the footer
   navigation on every page.
5. Add its sections to `search-index.json`: one entry per heading, with `title`, `heading`,
   `url` including the anchor, a short `text` snippet, and `aliases` for the page's first
   entry. Aliases should include tickers, abbreviations and likely misspellings.

## Changing a normative rule

Rules are numbered and referenced from several pages, so a change is never local.

1. Update the rule on
   [the specification page](https://bitcoinuniverseio.github.io/drops-protocol-docs/pages/drops-specification.html)
   and keep the existing number if the meaning is unchanged.
2. Add or update a test vector that distinguishes the old behaviour from the new one.
3. Update the matching conformance requirement.
4. Update the decoder or verifier if the rule is one they check.
5. Record it under **Protocol rules** in `changelog.html`, not under document revisions.

## Checking your work

There is nothing to build. Open the page in a browser, or serve the directory with any
static file server, then check:

- the page in both light and dark themes, and at a 320px viewport width;
- keyboard navigation through the page, including the skip link and the search box;
- that the search box finds your new content after you have updated the index;
- that any test vector you added produces the stated result in the decoder or verifier;
- that no link on the page is broken.

## Pull requests

Keep the change focused. Say what you changed and why, and name the source for any new
factual claim. End commit messages with the trailer the repository uses for co-authorship.

Security findings do not belong in a pull request. See [SECURITY.md](SECURITY.md).
