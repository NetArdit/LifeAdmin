You are Codex, principal engineer and reviewer on LifeAdmin, working with Claude (the execution lead). Read-only; do not change files; do not open any `.env*` file (`.env.example` may be read). Read DOCUMENTS_UNIT_REVIEW.md (yours), then the local commit made since on branch postgres-netlify: `git show --stat HEAD` and `git diff 2daeecb..HEAD` (public/app/main.js is generated: skip it).

REVIEW REQUEST: THE FIXES FROM YOUR REVIEW OF THE DOCUMENTS UNIT (which you did not approve) AND OF UNIT 5

Nothing was deployed, the hosted database was not migrated, no real AI provider or push service was called. The owner's "no deploy until I say so" stands.

1. HIGH, a scan saved without its confirmation by calling it manual
- `source` from the client is no longer read. Each reading (POST /api/documents/scan) makes a TICKET: 24 random bytes given to the page, its SHA-256 stored in the new table `document_scans` with the person, the provider's name and the two dates that were offered. No picture and none of the words read are in that row.
- A document is saved "from a scan" only when it carries `scan: { ticket, confirmed: { details: true, expiresOn } }` (src/routes/documents.js `confirmedScan`): the ticket must be that person's, unused, at most 60 minutes old, and is used up in the same transaction (one UPDATE ... WHERE used_at IS NULL ... RETURNING); `details` must be the boolean true; and `confirmed.expiresOn` must be present and EQUAL to the `expiresOn` being saved (null for "this document has no last day"). So the date cannot change between the tick and the save, and a confirmation cannot be replayed for another date.
- A document without a ticket is 'manual', whatever else the request says. I state the limit plainly in the code: a person can read a suggestion and type it in by hand; that is typing, in their own account, and no software can know whether they looked. Say whether you accept that boundary.
- `documents.expiry_as_read` records, for a scanned document, whether the person kept the date the machine read (1) or corrected it (0).
- The page: two confirmations, "The name and the kind are right" and "The document is valid until <date in words> (<ISO date>): I checked this date on the document" (or "This document has no last day of validity: there will be no reminder"). Changing the date field afterwards removes the second tick.

2. HIGH, the picture goes to a third party
- GET /api/documents answers `scan.provider` ("Groq" or "Anthropic", `ai.providerName()`), and the page names it. Before "Read the document" can be pressed the person must tick: "Send this picture to <provider> to be read. Everything visible on it goes with it: on a passport or an identity card that is your name, your photograph and your numbers. LifeAdmin keeps none of it unless you save the document." Beside it: how to add the document by hand instead, with nothing sent anywhere.
- The server refuses POST /scan without `consent: true` (the boolean), before the picture goes anywhere. The ticket's row keeps which provider it was.
- NOT DONE, because they are the owner's: choosing the provider and reading its terms, the final consent wording, the privacy policy. I list them for the owner in the README and in my report. I did not disable identity scans: the warning names them. Rule again if you want them refused outright until the owner has decided.

3. MEDIUM
- One tick: now two, see 1.
- Prompt injection and names or numbers in the offered texts: `checkedSuggestion` removes runs of digits (a digit, four or more digits, spaces, dots, slashes or dashes, a digit) from title, issuer and the doubts before they are offered.
- PDF: the original is never stored. All PDF code is gone from the server (types, limits, the name scan, the attachment branch; the body limit on /api/documents is 2 MB again; the table's CHECKs allow pictures only). The page still draws a PDF's first page and that picture is what is read and kept; it refuses to open a PDF larger than 15 MB and says that only the first page is read.
- `reference` is removed: column, API, form. The note field says not to write the document's number there.
- The push deadline: `withDeadline` in src/lib/push.js races every call to a push service against a clock of 8 seconds, so the attempt ends then whatever the other end does; the comment says the abandoned call may still complete (at least once).
- Sign-in: a right password now `refund()`s its own try and no longer resets the row, so it cannot erase wrong tries made at the same moment. Wrong tries are forgotten when their window ends. Consequence, which I accept and state: somebody with seven wrong tries in fifteen minutes who then signs in correctly still has seven counted until the window ends.
- Not changed: the backup still holds the whole database in memory (with the documents' ceiling of 200 MB of pictures that is the largest part); renewal history, the dashboard and search are not built.

EVIDENCE
@@EVIDENCE@@
- IN A REAL BROWSER (Edge headless over the DevTools protocol, local server on a scratch PGlite database, the AI provider replaced by a local stand-in): the consent sentence names Groq and "Read the document" is disabled before the tick; after reading, Save is disabled with no tick and with one tick, enabled with both; changing the date unticks the date confirmation, closes Save, and the sentence shows the new date; ticking again saves, and the stored document has the changed date, source scan, reviewedAt and one picture. With a two-page PDF: the note says only the first page is read and kept, pdf.js comes from this site only, and what is stored is image/jpeg served inline. Nothing wider than a 390 px screen. No console error and no exception. Six screenshots in docs-evidence/. I looked at them.
- NOT VERIFIED, and I will not claim it: a real AI provider reading a real document (the default Groq vision model name comes from a web search and was never called); a real phone and its camera; a scanned PDF from a real scanner; a screen reader; PostgreSQL on a server; the interface is in English like the rest of the application.

WHAT I ASK
A. Findings by severity with file and line: any remaining way for what a machine read to be stored as confirmed, or to drive a reminder, that the ticket and the date binding do not close; the ticket itself (lifetime, single use, what is kept); the consent; the digit rule (does it damage ordinary titles such as "Garancia 24 muaj" or dates in a title); the refund-on-success sign-in rule.
B. Rulings on the questions in 1 and 2.
C. APPROVED, APPROVED WITH FIXES or NOT APPROVED, for the documents unit and for the notification follow-ups.
D. The exact list of what the OWNER must decide or do before this unit is shown to real users, in words I can pass on.
E. The next unit, in order: renewal history, expiry on the dashboard and in search, the daily email digest, the Albanian interface. Give the execution prompt for the first.
End with MEMORY UPDATE.
