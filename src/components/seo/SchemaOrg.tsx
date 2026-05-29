interface SchemaOrgProps {
  schema: object
}

/** Injecte un bloc JSON-LD dans le <head> — Server Component, pas de risque XSS (données contrôlées) */
export function SchemaOrg({ schema }: SchemaOrgProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
