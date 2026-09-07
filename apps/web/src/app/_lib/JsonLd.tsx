/**
 * Injectează un bloc `application/ld+json`. Datele structurate sunt cerute
 * de SPEC §10 pe fiecare tip de pagină; conținutul e serializat cu escape
 * pe `<` ca să nu poată închide accidental eticheta `<script>`.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
