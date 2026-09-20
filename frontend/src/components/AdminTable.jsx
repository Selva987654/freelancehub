export default function AdminTable({ columns, rows, empty = 'No records found.' }) {
  if (!rows || rows.length === 0) {
    return <div className="card p-10 text-center text-sm text-ink-muted">{empty}</div>;
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-line bg-black/[0.015]">
              {columns.map((c) => (
                <th key={c.key} className="text-left font-semibold text-ink-muted px-4 py-3 whitespace-nowrap">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id || i} className="border-b border-line last:border-0 hover:bg-black/[0.015]">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-ink align-middle">
                    {c.render ? c.render(row) : (row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
