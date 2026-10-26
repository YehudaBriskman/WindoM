import { ENV_VARS, REQUIREMENT_LABELS } from '../lib/env-reference';

/**
 * The environment reference, rendered from one list in both languages.
 *
 * Variable names stay in a `code` element and are never translated - they are
 * strings a reader has to type exactly.
 */
export function EnvTable({ locale }: { locale: 'en' | 'he' }) {
  const head = locale === 'he'
    ? { variable: 'משתנה', description: 'תיאור', required: 'נדרש' }
    : { variable: 'Variable', description: 'Description', required: 'Required' };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{head.variable}</th>
            <th>{head.description}</th>
            <th>{head.required}</th>
          </tr>
        </thead>
        <tbody>
          {ENV_VARS.map((v) => (
            <tr key={v.name}>
              <td>
                <code>{v.name}</code>
              </td>
              <td>{locale === 'he' ? v.he : v.en}</td>
              <td>{REQUIREMENT_LABELS[v.required][locale]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
