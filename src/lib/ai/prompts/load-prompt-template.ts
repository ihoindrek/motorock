import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { PromptTemplate } from "@/lib/ai/prompts/prompt-renderer";

const PromptTemplateFileSchema = z.object({
  id: z.string().min(1),
  section: z.enum(["description", "seo", "faq", "alt_text"]),
  locales: z.array(z.string()).min(1),
  system: z.string().min(1),
  user: z.string().min(1),
  rules: z.array(z.string()).optional(),
});

export const PROMPT_TEMPLATE_IDS = [
  "description.v1",
  "description.motorcycle.v1",
  "seo.v1",
  "seo.motorcycle.v1",
  "faq.v1",
  "faq.motorcycle.v1",
  "alt_text.v1",
] as const;

export type PromptTemplateId = (typeof PROMPT_TEMPLATE_IDS)[number];

const templatesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "templates",
);

const templateCache = new Map<string, PromptTemplate>();

function appendRules(system: string, rules?: string[]) {
  if (!rules?.length) {
    return system;
  }

  const formatted = rules.map((rule) => `- ${rule}`).join("\n");
  return `${system.trim()}\n\nRules:\n${formatted}`;
}

function parsePromptTemplateFile(raw: string): PromptTemplate {
  const parsed = PromptTemplateFileSchema.parse(parseYaml(raw));

  return {
    id: parsed.id,
    section: parsed.section,
    locales: parsed.locales,
    system: appendRules(parsed.system, parsed.rules),
    user: parsed.user,
    rules: parsed.rules,
  };
}

function readPromptTemplateFile(id: string) {
  const filePath = join(templatesDir, `${id}.yaml`);

  try {
    return readFileSync(filePath, "utf8");
  } catch {
    throw new Error(`Prompt template file not found: ${id}.yaml`);
  }
}

export function loadPromptTemplate(id: string): PromptTemplate {
  const cached = templateCache.get(id);
  if (cached) {
    return cached;
  }

  const template = parsePromptTemplateFile(readPromptTemplateFile(id));
  if (template.id !== id) {
    throw new Error(
      `Prompt template id mismatch: expected ${id}, got ${template.id}`,
    );
  }

  templateCache.set(id, template);
  return template;
}

export function getPromptTemplate(id: string): PromptTemplate {
  if (!PROMPT_TEMPLATE_IDS.includes(id as PromptTemplateId)) {
    throw new Error(`Unknown prompt template: ${id}`);
  }

  return loadPromptTemplate(id);
}

export function clearPromptTemplateCache() {
  templateCache.clear();
}
