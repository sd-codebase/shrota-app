import { Form, Input } from 'antd';

// Only English letters, digits and hyphens can be entered; any other
// character typed or pasted is dropped. The server rejects anything else too
// (be/utils/slugify.validate_slug_input).
const SLUG_MAX_LENGTH = 100;

// While typing: a trailing hyphen is kept so "shyamchi-" can become "shyamchi-aai".
export const normalizeSlugTyping = (value?: string) =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .slice(0, SLUG_MAX_LENGTH);

// On save: the final slug ("" = let the server generate it from the title).
export const cleanSlug = (value?: string) => normalizeSlugTyping(value).replace(/-+$/, '');

// Preview of the slug the server would generate from a title (be/utils/slugify.clean_slug).
const slugFromTitle = (value?: string) =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/, '');

interface SlugInputProps {
  /** Website path before the slug, e.g. "/book/" */
  pathPrefix: string;
  /** Text the slug is generated from when left blank (title or name). */
  source?: string;
  sourceLabel?: string;
}

/** Form item for the editable URL slug of a public website page. */
function SlugInput({ pathPrefix, source, sourceLabel = 'title' }: SlugInputProps) {
  const generated = slugFromTitle(source);
  return (
    <Form.Item
      name="slug"
      label="URL slug"
      normalize={normalizeSlugTyping}
      extra={
        <>
          Shown in the website link and search results. Only letters (a-z), numbers (0-9) and
          hyphens (-) can be entered, e.g. <code>shyamchi-aai</code>. Leave blank to generate it
          from the {sourceLabel}
          {source?.trim() && !generated ? ' (it has no English letters, so a generic link would be used)' : ''}.
          Changing it keeps old links working.
        </>
      }
    >
      <Input
        addonBefore={`shrota.in${pathPrefix}`}
        placeholder={generated || 'e.g. shyamchi-aai'}
        maxLength={SLUG_MAX_LENGTH}
      />
    </Form.Item>
  );
}

export default SlugInput;
