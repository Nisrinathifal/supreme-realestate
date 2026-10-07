# About section and one-pager content brief

Research 2026-10-07 (agent-reach: Jina Reader on supremerealestate.nl, Exa web search). For the About section of the
one-pager and the boss's notes (renters/tenants, how we treat them, properties, "ideal landlord", what we really do,
bank perspective: is the company legit).

Status: **draft**. Every line of new copy below is adapted, not verbatim from PRD/DESIGN, so it goes into
`copy.*.ts` wrapped in `draft()` until the owner approves it (CLAUDE.md rule 1).

---

## 1. What the current site says (source facts)

| Topic | What supremerealestate.nl says (paraphrased) | Page |
|---|---|---|
| What they do | Develops extra turnkey homes by redeveloping existing buildings, also ones with overdue maintenance; build-ups and extensions; delivers several homes a month with reliable partners | Home |
| Speciality | Splitting larger buildings into multiple independent apartments, for rent and for sale; turnkey, modern timeless interior, high-quality finish | Home |
| Region | Metropolitan region Amsterdam (MRA); shortage of turnkey furnished homes; demand from knowledge migrants | Home |
| Mission | Contribute to reducing the housing shortage by redeveloping existing property: old offices, larger homes, neglected buildings on A-locations | Over ons |
| Design focus | Future resident's wishes at the centre; comfort, design, usability; warm sense of home; (3D) visualisations; good proportions, durable materials, clean design | Over ons |
| Team | Fixed build and design team; fixed contractor; involved with designers and site staff | Over ons |
| Process (verbatim, NL) | "Kopen, Ontwerpen, Uittekenen, Vergunningsaanvraag, Bouwvoorbereiding, Installatie, Afbouw." | Over ons |
| Partners | Private owners, municipalities, brokers, investors | Samenwerking |
| Projects | 11 listed with street, m², unit count, rental status (incl. the four featured ones) | Projecten |

Third-party listing (Exa place data, **unverified**): Supreme Real Estate B.V., Haarlem (Conradweg), category real-estate
development. Use only as a lead: PRD §7 requires every company field to match the **KvK extract exactly**. Not
filled into `content/company.json`.

No reviews, press or tenant-facing content about Supreme were found online. Search results for "reviews" returned
other agencies only.

---

## 2. Boss's notes vs. the disclosure policy (needs an owner decision)

PRD §6.2 currently forbids: tenants or recognisable residents; rents, financing, lenders, investors; units, m²,
portfolio size; properties beyond the four featured projects. Several notes collide with it.

| Boss's note | PRD today | Proposal | Decision needed |
|---|---|---|---|
| "Supreme has renters, tenants" | ✗ no tenants, no unit counts | Speak of **residents** as a group, never numbers or people: "the people who live in our homes" | Allow residents as a group? |
| "How we treat tenants" | ✗ (operations) | A **For residents** section of promises Supreme can keep (quality, contact, maintenance). The old site has no such content, so the owner must supply the facts | Which promises are true? (see §4) |
| "Properties" | ✓ four featured projects by name, city, category only | Keep the projects deck; no m², units or status ("verhuurd") | None, unless more projects are wanted |
| "Ideal landlord, what we really do" | ✓ principles, focus on existing homes | About copy below (§3): develop, renew, keep and look after | Approve wording |
| "Bank perspective: is it legit" | ✓ PRD §8 is exactly this | **Company details** block: legal name, KvK, VAT, office address, phone, company e-mail, management; plus legal pages | Supply verified KvK data (§5) |

Do **not** reuse from the old site: m², unit counts, rental/sale status, project names beyond the four, "investors…
passende rente", "several homes a month" (a volume figure), the policy opinion about government and permits.

---

## 3. About section copy (draft)

Built from the facts in §1, in the brand's tone (DESIGN: calm, precise, no hype). NL is the default language.

**Label** · NL: Over ons · EN: About

**Title** · NL: Van oud naar waardevol. · EN: From old to valuable. *(brand promise, already approved)*

**Lead**
- NL: Supreme Real Estate geeft bestaande gebouwen in de regio Amsterdam een nieuwe toekomst. We kopen panden die
  hun beste tijd achter zich hebben, ontwerpen ze opnieuw en maken er zelfstandige, sleutelklare woningen van.
- EN: Supreme Real Estate gives existing buildings in the Amsterdam region a new future. We acquire properties that
  have seen better days, redesign them and turn them into independent, turnkey homes.

**Body**
- NL: Elk ontwerp begint bij de mensen die er gaan wonen: comfort, licht, goede verhoudingen en duurzame materialen.
  We werken met een vast bouw- en designteam, van de eerste schets tot de laatste afwerking. En als het werk klaar is,
  blijven we betrokken: we houden en beheren wat we maken, voor de lange termijn.
- EN: Every design starts with the people who will live there: comfort, light, good proportions and durable
  materials. We work with a fixed build and design team, from the first sketch to the final finish. And when the work
  is done, we stay involved: we keep and manage what we make, for the long term.

> "We keep and manage what we make" follows the approved Prinsen Bolwerk outcome ("retained within Supreme's managed
> portfolio — held for the long term"). Confirm it is true for the company in general before publishing.

**How we work** (one line per step; the steps are the old site's own list)
| # | NL | EN |
|---|---|---|
| 01 | Aankoop: we zien wat een pand kan worden. | Acquisition: we see what a building can become. |
| 02 | Ontwerp: plannen en (3D-)visualisaties rond de toekomstige bewoner. | Design: plans and (3D) visualisations around the future resident. |
| 03 | Vergunningen: zorgvuldig aangevraagd, binnen de regels. | Permits: applied for carefully, within the rules. |
| 04 | Realisatie: met een vaste aannemer en een vast team. | Realisation: with a fixed contractor and a fixed team. |
| 05 | Oplevering: sleutelklaar, modern en tijdloos ingericht. | Delivery: turnkey, with a modern, timeless interior. |
| 06 | Beheer: we blijven eigenaar en aanspreekpunt. *(confirm)* | Management: we remain owner and point of contact. *(confirm)* |

This overlaps the homepage Steps band (Reimagine / Divide / Deliver). Choose one: keep Steps as the short version and
put this list on the About page, or replace Steps with it.

---

## 4. For residents (new section; facts needed from the owner)

The boss wants to show how Supreme treats the people who live in its homes. Nothing on the old site or online
supports specific promises, so this section is a **structure with questions**, not copy to publish.

Proposed title · NL: Voor bewoners · EN: For residents
Proposed lead (draft, grounded in the old site's design focus) ·
- NL: Een woning van Supreme is af als je erin trekt: sleutelklaar, goed afgewerkt en met aandacht ontworpen.
- EN: A Supreme home is finished when you move in: turnkey, well finished and designed with care.

Three promise cards, each only if the owner confirms it is true:
1. **One point of contact** (who residents call or e-mail; office hours) → needs: phone/e-mail, availability.
2. **Maintenance handled** (how repairs are reported and how fast they are picked up) → needs: process, response time.
3. **Homes kept up for the long term** (investment in upkeep, not a quick sale) → needs: confirmation.

Never show: names, photos or quotes of residents, rents, occupancy, number of homes.

---

## 5. Company details (the bank / due-diligence section)

PRD §8 is the checklist a bank or notary runs. The block itself already exists in the design (Bedrijfsgegevens); it
shows nothing yet because `content/company.json` is empty, and empty rows are hidden by design.

Needed from the owner, **exactly as on the KvK extract**: legal name, KvK number, VAT number, visiting address (a real
office), company-domain e-mail, phone answered in office hours, management names and roles (decision: show or not),
LinkedIn company page.

Add near it one short trust line (draft):
- NL: Supreme Real Estate B.V. is ingeschreven bij de Kamer van Koophandel. Alle gegevens hieronder komen overeen
  met die inschrijving.
- EN: Supreme Real Estate B.V. is registered with the Netherlands Chamber of Commerce. All details below match that
  registration.

---

## 6. Recommended one-pager order

| # | Section | Status | Answers |
|---|---|---|---|
| 1 | Hero film | built | First impression, brand |
| 2 | Projects deck (four featured) | built | "Properties" |
| 3 | Shelf statement | built | What we unlock |
| 4 | **About** (§3) | to build | "What we really do", "ideal landlord" |
| 5 | Steps / How we work | built (or §3 list) | Process |
| 6 | **For residents** (§4) | needs owner facts | "How we treat tenants" |
| 7 | Collaboration ring | built | Partners: architects, builders, designers |
| 8 | **Company details** (§5) | built, empty | "Bank perspective: is it legit" |
| 9 | Contact + footer | built | Reachability |

Optional later: **Working with us** (from the old Samenwerking page: property owners, municipalities, brokers),
without the investor part, which §6.2 forbids.

---

## 7. Open questions for the owner

1. May the site speak of residents/tenants as a group (PRD §6.2 change)?
2. Which resident promises are true (contact, maintenance, response time)?
3. Is "we keep and manage what we make" true for the company in general?
4. KvK extract: legal name, KvK, VAT, visiting address (is it Haarlem?), phone, e-mail.
5. Show management names on the site?
6. Steps band or the six-step list: which one stays?
