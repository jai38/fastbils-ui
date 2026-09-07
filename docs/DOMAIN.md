# Fastbills, domain specification, version 1

This file is the single source of truth for business rules. It is copied byte for byte into
both repositories at `docs/DOMAIN.md`. If the two copies ever differ, that is a bug.

Nothing in this file describes a framework, a library or a folder layout. Those belong in
`ARCHITECTURE.md` in each repo. This file describes only what is true about the business.

Audience: two engineers building this, and any AI agent working in either repo. An agent
must read this file before writing code that touches invoices, tax or money.

---

## 1. What version 1 is

A GST compliant invoicing product for Indian businesses. One organisation signs up, records
its own details, records the customers it bills, raises invoices against them, records money
received against those invoices by hand, and reports revenue and tax for any period.

Version 1 does not collect money, does not talk to a bank, does not send reminders and does
not file anything. Those come later. The reason version 1 exists is that you cannot chase a
payment you did not issue.

### In scope

Authentication and registration. Organisation profile including GSTIN and logo. Customer
records. Invoice creation, issue, PDF and credit note. Manual receipt entry against an
invoice. Dashboard with filters. Revenue and tax reports by period. Export to CSV and Excel.

### Explicitly out of scope for version 1

E-invoicing and any integration with the invoice registration portal. It applies above a
turnover threshold none of the first customers cross, and it is a third party integration
that would dominate the schedule. E-way bills. Inventory and stock. Purchases and expenses.
Payroll. Multi currency. Recurring invoices. Automated reminders. Bank feeds or statement
parsing. Payment gateway collection. Roles beyond owner and staff. Mobile native apps.

If an agent is asked to add anything on that list, it must stop and say so rather than
building it.

---

## 2. Non negotiable invariants

These are ranked. Number 1 is the most expensive to get wrong.

1. **An issued invoice is immutable.** Once an invoice leaves draft state, no field on it may
   ever be updated and the row may never be deleted. Corrections happen by issuing a credit
   note that references it, or by cancelling it and issuing a new one. Editing an issued
   invoice is the reason accountants distrust cheap billing software.

2. **Payment status is derived, never stored.** There is no `status` or `is_paid` column
   holding payment state. Receipts are rows in their own table. Status is computed by summing
   receipts against the invoice total. Indian B2B pays in parts, and a status column dies on
   contact with the first part payment.

3. **Every query is tenant scoped.** Every table that holds business data carries
   `organisation_id`. No query may read or write a row without constraining on the
   organisation of the authenticated caller. This is enforced structurally, not by remembering
   to add a where clause, and it is tested with a deliberate cross tenant test.

4. **Money is never a floating point number.** Money is `NUMERIC(15,2)` in PostgreSQL and
   `BigDecimal` in Java, always constructed from a string or from `BigDecimal.valueOf`, never
   from a `double`. Quantities are `NUMERIC(15,3)`. Tax rate percentages are `NUMERIC(5,2)`.

5. **Invoice numbers come from a database enforced series.** Not from application code
   counting rows. See section 6.

6. **Every state change on money is written to an append only audit log** with actor,
   timestamp, entity, and before and after values. Never modified, never deleted.

---

## 3. Entities

Names below are the domain names. Table names are the same, snake case, plural.

### organisation
The tenant. One per business that signs up.

Fields: id, legal_name, trade_name, gstin, pan, address_line1, address_line2, city,
state_code, pincode, country, phone, email, logo_object_key, invoice_prefix,
bank_account_name, bank_account_number, bank_ifsc, bank_name, bank_branch, upi_id,
default_terms_text, default_credit_days, created_at, updated_at.

Rules. `gstin` is 15 characters and its 1st and 2nd characters are the state code. If a GSTIN
is present, `state_code` must equal the first two characters of it, and the API rejects the
combination if it does not. `gstin` may be null, because a business below the registration
threshold is a real customer, and in that case invoices carry no tax lines at all. `pan` is
10 characters. `state_code` is the two digit GST state code, stored as text with the leading
zero preserved, because Jammu and Kashmir is `01` and dropping the zero breaks the
comparison in section 5.

### user
A person who logs in. Belongs to exactly one organisation in version 1.

Fields: id, organisation_id, email, password_hash, full_name, role, is_active, last_login_at,
created_at, updated_at.

Rules. `email` is unique across the whole system, lowercased on write. `role` is `OWNER` or
`STAFF`. Password hashed with bcrypt or argon2, never anything else, never reversible. A
`STAFF` user may create and issue invoices and record receipts. A `STAFF` user may not change
the organisation profile, may not cancel an issued invoice and may not delete a customer.

### customer
A business or person the organisation bills. This is what the user calls a client.

Fields: id, organisation_id, legal_name, trade_name, gstin, pan, is_registered,
billing_address_line1, billing_address_line2, billing_city, billing_state_code,
billing_pincode, shipping_address_line1, shipping_address_line2, shipping_city,
shipping_state_code, shipping_pincode, contact_person, phone, email,
default_place_of_supply_state_code, credit_days, notes, is_archived, created_at, updated_at.

Rules. Unique on `(organisation_id, lower(legal_name))` so the same customer is not entered
twice. If `is_registered` is true then `gstin` is required. If `gstin` is present then
`billing_state_code` must match its first two characters. Customers are archived, never
deleted, because an invoice points at them forever. `default_place_of_supply_state_code`
defaults to the billing state and is what the invoice editor pre fills, but the invoice
stores its own copy, see below.

### invoice
Fields: id, organisation_id, customer_id, series_id, invoice_number, financial_year,
invoice_date, due_date, place_of_supply_state_code, supply_type, is_reverse_charge,
delivery_or_acceptance_date, agreed_credit_days, collection_reference, po_number, po_date,
notes, terms_text, subtotal_before_discount, total_discount, taxable_value, total_cgst,
total_sgst, total_igst, total_cess, total_tax, round_off, grand_total, amount_in_words,
state, issued_at, issued_by_user_id, cancelled_at, cancelled_by_user_id, cancellation_reason,
pdf_object_key, created_at, updated_at.

Rules. `state` is one of `DRAFT`, `ISSUED`, `CANCELLED`. `supply_type` is `INTRA_STATE`,
`INTER_STATE` or `EXPORT`, and is derived, never accepted from the client, see section 5.
Unique on `(organisation_id, series_id, invoice_number)`. Every monetary total is stored on
the invoice at issue time, not recomputed on read, because a tax rate change next year must
not silently rewrite last year's invoice.

Three fields exist in version 1 and are used by nothing in version 1. Do not remove them and
do not make them optional in the UI:

- `delivery_or_acceptance_date`. The statutory payment clock runs from acceptance of delivery,
  not from the invoice date. This cannot be reconstructed later.
- `agreed_credit_days`. Copied from the customer at issue time so it is frozen on the record.
- `collection_reference`. A short unique per invoice string, printed on the PDF, described in
  section 7.

`due_date` is computed as `delivery_or_acceptance_date + agreed_credit_days` when the
acceptance date is present, otherwise `invoice_date + agreed_credit_days`, and it is stored.

### invoice_line
Fields: id, invoice_id, line_number, item_description, hsn_or_sac_code, is_service, quantity,
unit_of_measure, unit_price, discount_percent, discount_amount, taxable_value,
tax_rate_percent, cgst_amount, sgst_amount, igst_amount, cess_amount, line_total.

Rules. `line_number` is 1 based and contiguous within an invoice. At least one line is
required to issue. `tax_rate_percent` is the total GST rate for the line, for example 18.00,
and the split into CGST and SGST is derived, not entered. Lines are immutable once the invoice
is issued, same as the invoice.

### receipt
Money received. Not a status flag. This is the table the collections product plugs into later.

Fields: id, organisation_id, invoice_id, receipt_number, receipt_date, amount, method,
reference, bank_narration, notes, recorded_by_user_id, is_reversed, reversed_by_receipt_id,
created_at.

Rules. `method` is `CASH`, `UPI`, `NEFT`, `RTGS`, `IMPS`, `CHEQUE`, `CARD`, `OTHER`. `amount`
is strictly greater than zero. A receipt is never edited and never deleted. A mistake is
corrected by writing a reversing receipt that points at the original through
`reversed_by_receipt_id`, and both rows stay visible forever. Cash is a first class method,
not an afterthought, because a large share of these businesses run partly in cash and software
that pretends otherwise gets abandoned.

Multiple receipts per invoice are the normal case, not the exception.

### credit_note
Fields: id, organisation_id, customer_id, series_id, credit_note_number, financial_year,
credit_note_date, original_invoice_id, reason, place_of_supply_state_code, supply_type,
taxable_value, total_cgst, total_sgst, total_igst, total_cess, total_tax, round_off,
grand_total, amount_in_words, state, issued_at, pdf_object_key, created_at.

Has `credit_note_line` rows with the same shape as `invoice_line`. A credit note may be for
part of the original invoice. Its own numbering series, separate from invoices.

### number_series
Fields: id, organisation_id, document_type, financial_year, prefix, next_number, width,
created_at, updated_at. Unique on `(organisation_id, document_type, financial_year)`.
`document_type` is `INVOICE` or `CREDIT_NOTE`.

### audit_log
Fields: id, organisation_id, actor_user_id, action, entity_type, entity_id, before_json,
after_json, ip_address, created_at. Append only. No update path exists in the code at all.

---

## 4. Invoice lifecycle

```
DRAFT ──issue──> ISSUED ──cancel──> CANCELLED
  │
  └──delete──> gone
```

`DRAFT`. Freely editable. Deletable. Does not consume an invoice number. Not visible in
reports, not counted in revenue, no PDF.

`ISSUED`. Consumes the next number in the series. Totals frozen. PDF generated and stored.
Every field immutable. Appears in reports and revenue.

`CANCELLED`. The number is burned and never reused, because the series must stay consecutive
with no gaps and no duplicates. Excluded from revenue. Still visible in a list, clearly marked.
Only an `OWNER` may cancel. Requires a reason. An invoice with any non reversed receipt against
it cannot be cancelled: reverse the receipts first, or issue a credit note instead.

Deriving payment status, which is a computed value and never a column:

```
received  = sum(amount) of receipts where is_reversed = false
balance   = grand_total - received

state = CANCELLED                              -> CANCELLED
received = 0        and today <= due_date      -> UNPAID
received = 0        and today >  due_date      -> OVERDUE
0 < received < grand_total and today <= due_date -> PARTIALLY_PAID
0 < received < grand_total and today >  due_date -> PARTIALLY_PAID_OVERDUE
received >= grand_total                        -> PAID
```

Ageing buckets for the dashboard, counted in days past `due_date`: current, 1 to 30, 31 to 45,
46 to 60, 61 to 90, over 90. The 45 day boundary is there deliberately and is not arbitrary.

---

## 5. Tax computation

This section is the reason the project takes ten weeks rather than four. Read it twice.

### 5.1 Which tax applies

There are two possible splits and the choice is not a user preference.

- Supplier state code equals place of supply state code, that is an **intra state** supply and
  the tax splits into CGST and SGST at half the rate each.
- They differ, that is an **inter state** supply and the tax is a single IGST at the full rate.

Two mistakes to avoid. First, the comparison is against the **place of supply**, not against
the customer's billing address. They are usually the same and sometimes are not, which is
exactly why `place_of_supply_state_code` is stored on the invoice as its own editable field
rather than read from the customer at render time. Second, the supplier state comes from the
organisation's own GSTIN, so it is fixed per organisation and per invoice, and must be frozen
onto the invoice rather than joined at read time.

`supply_type` is therefore computed on the server at issue time and rejected if the client
sends it.

### 5.2 Per line arithmetic

Compute in this order, per line, and round each named value to 2 decimal places using
half up rounding as you go:

```
gross          = quantity * unit_price
discount_amount = gross * discount_percent / 100      (or entered directly)
taxable_value  = gross - discount_amount

intra state:  cgst_amount = taxable_value * (tax_rate_percent / 2) / 100
              sgst_amount = same
              igst_amount = 0
inter state:  igst_amount = taxable_value * tax_rate_percent / 100
              cgst_amount = sgst_amount = 0

line_total    = taxable_value + cgst_amount + sgst_amount + igst_amount + cess_amount
```

Invoice level:

```
taxable_value = sum of line taxable_value
total_cgst    = sum of line cgst_amount        (and likewise sgst, igst, cess)
total_tax     = total_cgst + total_sgst + total_igst + total_cess
raw_total     = taxable_value + total_tax
grand_total   = raw_total rounded to nearest whole rupee
round_off     = grand_total - raw_total        (signed, may be negative)
```

Rounding half up, not banker's rounding, and never the JVM default. In Java that means
`RoundingMode.HALF_UP` explicitly at every rounding site.

**VERIFY with the CA before launch.** Whether tax should be rounded per line and then summed,
as specified above, or computed once on the total taxable value per rate slab. The two give
answers differing by a paise or two, and the worked examples below show it happening. Pick one,
write the choice into an ADR, and match whatever the customers' existing accountants already
accept. This specification uses per line rounding because it makes each printed line
internally consistent, which is what a customer queries.

### 5.3 Worked example A, intra state

Supplier in Maharashtra, state code 27. Customer in Maharashtra, place of supply 27.
Therefore intra state, CGST plus SGST.

| Line | Description | Qty | Rate | Gross | Disc | Taxable | GST | CGST | SGST | Line total |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Fabrication work | 10.000 | 1500.00 | 15000.00 | 5% = 750.00 | 14250.00 | 18% | 1282.50 | 1282.50 | 16815.00 |
| 2 | Mounting bracket | 2.000 | 3200.55 | 6401.10 | 0.00 | 6401.10 | 12% | 384.07 | 384.07 | 7169.24 |

Line 2 CGST is `6401.10 * 6 / 100 = 384.066`, which becomes `384.07` under half up.

```
taxable_value = 14250.00 + 6401.10   = 20651.10
total_cgst    =  1282.50 +  384.07   =  1666.57
total_sgst    =  1282.50 +  384.07   =  1666.57
total_tax     =                         3333.14
raw_total     = 20651.10 + 3333.14   = 23984.24
grand_total   = round to rupee       = 23984.00
round_off     = 23984.00 - 23984.24  =    -0.24
amount_in_words = "Twenty Three Thousand Nine Hundred Eighty Four Rupees Only"
```

Rate slab summary, which is the shape a CA reads and which the tax report must produce:

| Rate | Taxable value | CGST | SGST | IGST |
|---|---|---|---|---|
| 12% | 6401.10 | 384.07 | 384.07 | 0.00 |
| 18% | 14250.00 | 1282.50 | 1282.50 | 0.00 |

### 5.4 Worked example B, inter state

Identical lines, but the customer is in Karnataka, place of supply 29. Therefore inter state,
IGST only.

```
line 1 igst = 14250.00 * 18 / 100 = 2565.00
line 2 igst =  6401.10 * 12 / 100 =  768.132  ->  768.13
total_igst  =                        3333.13
raw_total   = 20651.10 + 3333.13   = 23984.23
grand_total =                        23984.00
round_off   =                           -0.23
```

Note that example B's total tax is one paise below example A's, on the same line values,
purely because 18 percent rounds once in B and 9 percent rounds twice in A. That is correct
under per line rounding and it must be a test case, not a bug report.

### 5.5 Other tax situations version 1 must handle

- **Unregistered supplier.** Organisation has no GSTIN. Invoice carries no tax lines and no
  tax columns print. Not a tax invoice, and it must say so on the document.
- **Nil rated, exempt and zero rated.** `tax_rate_percent` of 0.00 is valid and is not the
  same thing as exempt. Store an enum on the line: `TAXABLE`, `NIL_RATED`, `EXEMPT`,
  `ZERO_RATED`, `NON_GST`, because the tax report has to separate them.
- **Reverse charge.** `is_reverse_charge` true on the invoice means the tax is payable by the
  recipient. The invoice must state this prominently and the amounts still print. Version 1
  only needs the flag and the label, not the accounting consequence.
- **Export.** `supply_type` of `EXPORT` is out of scope for version 1. Reject it in the API
  with a clear message rather than computing something wrong.

### 5.6 HSN and SAC

`hsn_or_sac_code` is HSN for goods and SAC for services, distinguished by `is_service`. Version
1 stores whatever the user types and validates only the shape, 4, 6 or 8 digits for HSN and 6
digits for SAC. Do not ship a built in code lookup table, and do not invent codes. The customer
knows their own codes and their accountant will correct them.

**VERIFY with the CA.** The number of HSN digits required at each turnover band, and whether a
summary of HSN wise taxable value must be printed on the invoice itself or only in returns.

---

## 6. Numbering

Invoice numbers are legally constrained, not a display preference.

Rules as implemented:

- One series per `(organisation, document_type, financial_year)`.
- Consecutive within the financial year. No gaps, no reuse, including after a cancellation.
- Format `{prefix}/{financial_year_short}/{zero_padded_sequence}`, for example
  `SEW/26-27/00042`. The prefix comes from the organisation, is 1 to 6 characters, and is
  restricted to A to Z, 0 to 9, slash and hyphen.
- Total length of the final string must not exceed 16 characters. Validate this when the
  prefix is set, and refuse a prefix that would make the number too long at the configured
  width, rather than failing at issue time on invoice 10000.
- The Indian financial year runs 1 April to 31 March. `financial_year` is stored as the
  starting calendar year, so an invoice dated 15 February 2027 has `financial_year = 2026`
  and prints `26-27`. Rollover happens automatically on the invoice date, not on the current
  date, so backdating into the previous year picks the previous series.
- A number is allocated inside the same database transaction that issues the invoice, using
  `SELECT ... FOR UPDATE` on the series row or an equivalent guaranteed serialisation. Two
  users clicking issue at the same instant must not produce the same number. Write a
  concurrency test that runs this in parallel and asserts uniqueness.
- Drafts have no number. The UI shows the next number as a preview clearly labelled as not yet
  allocated.
- **Existing customers already have an invoice series.** When onboarding one, the owner sets
  the starting sequence so the series continues rather than restarting at 1. Version 1 needs a
  writable `next_number` for exactly this reason.

**VERIFY with the CA.** The exact wording of the invoice numbering rule under Rule 46 of the
CGST Rules, specifically the 16 character limit and the permitted character set. This
specification is written from a working understanding, not from the text of the rule, and it
must be checked before a real customer issues a real invoice.

---

## 7. Collection reference

Every invoice gets a `collection_reference` at issue time: short, unique per organisation,
human readable over the phone, and free of ambiguous characters. Suggested shape is the last
part of the invoice number plus 4 random characters from an alphabet with no O, 0, I, 1 or L,
for example `42-7K2M`.

It is printed on the PDF near the payment details, worded so the buyer knows to quote it in the
bank narration or UPI remark. In version 1 nothing consumes it. That is fine and it is not dead
code to be cleaned up: it exists so that when reconciliation is built, the entire invoice
history already carries references and the customers' buyers are already trained to use them.
An agent must not remove it for being unused.

---

## 8. PDF

Rendered server side, from an HTML template, and stored in object storage keyed by invoice id.
Generated once at issue and never regenerated, so that a download in three years is byte
identical to the one sent today. Never rendered in the browser: it is a legal document and it
cannot vary by who opened it.

The document must carry, at minimum, the words "Tax Invoice", supplier legal name, address,
GSTIN and state with code, invoice number and date, customer name, address, GSTIN and state
with code, shipping address when it differs, place of supply, HSN or SAC per line, description,
quantity, unit, rate, taxable value, tax rate and amount per line, the rate slab summary,
totals, round off, grand total, amount in words, whether reverse charge applies, bank details
and UPI, the collection reference, terms, and a signature block.

**VERIFY with the CA.** The complete mandatory field list under Rule 46, against one real
invoice from each existing customer. Match what their accountants already accept rather than
what looks correct to us.

---

## 9. Reports version 1 must produce

All of them take a date range and are filterable by customer, and all of them exclude drafts
and cancelled invoices from revenue.

1. **Invoice register.** Every invoice in the period with derived status and balance.
2. **Revenue summary.** Taxable value, tax, and grand total, grouped by month and by customer.
3. **Tax summary by rate slab.** Taxable value, CGST, SGST, IGST and cess per rate, for the
   period. This is the one the accountant actually wants. Separate lines for nil rated, exempt
   and zero rated.
4. **Receivables ageing.** Outstanding balance per customer in the buckets from section 4.
5. **Receipts register.** Every receipt in the period with method and reference, including
   reversals, so cash and bank totals can be tied out.

Every report exports to CSV and XLSX with the same numbers as the screen. A report that
disagrees with the screen is a trust ending bug.

---

## 10. Things that will be got wrong, listed so they are not

- Using `double` or `float` for money anywhere, including in JSON serialisation and in
  TypeScript on the frontend. See the money handling note in each repo's `ARCHITECTURE.md`.
- Comparing the customer's billing state instead of the place of supply to decide the tax split.
- Dropping the leading zero on a state code by treating it as an integer.
- Letting the client send `supply_type`, `taxable_value` or any tax amount and trusting it. The
  server recomputes every monetary value from quantity, price, discount and rate. The client's
  numbers are for display only and a mismatch is an error worth logging.
- Allowing an issued invoice to be edited "just for a typo".
- Reusing a cancelled invoice number.
- Restarting the number series at 1 for a customer who already has one.
- Rolling the financial year on the current date instead of the invoice date.
- Storing payment status as a column.
- Deleting a customer who has invoices.
- Forgetting `organisation_id` in one query and leaking another business's invoices.
- Rounding with the JVM default instead of an explicit `HALF_UP`.

---

## 11. Verification list, to take to a practising CA

Nothing on this list blocks scaffolding. All of it blocks a real customer issuing a real
invoice. Group these into one paid consultation rather than emailing them piecemeal.

1. Rule 46 mandatory field list, checked against one real invoice from each existing customer.
2. The invoice numbering constraint, specifically the 16 character limit and permitted
   characters.
3. Whether tax rounds per line or per rate slab, and the treatment of the round off line.
4. HSN digit requirements by turnover band, and whether an HSN summary prints on the invoice.
5. Credit note and revised invoice rules, including time limits and numbering.
6. What a non GST registered business's invoice must and must not say.
7. Reverse charge presentation on the face of the invoice.
8. Retention period for issued invoices and their PDFs.

Every item settled here becomes an ADR in the backend repo, citing the CA conversation and its
date. An agent must not silently resolve one of these by guessing.
