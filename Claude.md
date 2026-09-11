Project Documentation
Source of truth

This project has two primary source documents:

pdf/Brand-Product-Book.pdf
pdf/Blueprint-Legal-Functional.pdf

Their structured interpretations are stored under docs/.

Documentation rules

Before implementing functionality, consult the relevant documentation under docs/.

Do not load or reread the original PDFs unless:

the required information is missing from docs/;
there is a contradiction;
an exact visual/design detail is required;
an exact legal requirement must be verified;
the user explicitly asks to verify something against the original PDF.
Documentation hierarchy

For brand and product decisions, consult:

docs/brand-product/SUMMARY.md
docs/brand-product/BRAND.md
docs/brand-product/PRODUCT.md
docs/brand-product/UX-UI.md
docs/brand-product/DECISIONS.md

For legal and functional requirements, consult:

docs/legal-functional/SUMMARY.md
docs/legal-functional/BUSINESS-RULES.md
docs/legal-functional/LEGAL.md
docs/legal-functional/FUNCTIONAL.md
docs/legal-functional/FLOWS.md
Important

The PDFs are the original source of truth.

The Markdown documentation is a compact working representation of the PDFs.

If the Markdown documentation conflicts with the original PDF, verify the original PDF and update the Markdown documentation.

Never invent requirements that are not supported by the source documents.

When a requirement is ambiguous, explicitly identify it as ambiguous instead of guessing.

When implementing a feature, cite the relevant documentation file and section in the reasoning or implementation notes.

Implementation behavior

Before making substantial changes:

Identify which product, functional, legal, or brand requirements apply.
Read only the relevant documentation files.
Implement the smallest solution that satisfies those requirements.
Verify that the implementation does not violate legal, functional, product, or brand constraints.

Avoid reading the entire documentation tree unless the task genuinely requires it.
