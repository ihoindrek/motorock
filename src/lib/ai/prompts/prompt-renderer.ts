export type PromptTemplate = {
  id: string;
  section: "description" | "seo" | "faq" | "alt_text";
  locales: string[];
  system: string;
  user: string;
  rules?: string[];
};

export function renderPromptTemplate(
  template: PromptTemplate,
  variables: Record<string, string>,
) {
  return {
    system: interpolate(template.system, variables),
    user: interpolate(template.user, variables),
  };
}

function interpolate(source: string, variables: Record<string, string>) {
  return source.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    return variables[key] ?? "";
  });
}
