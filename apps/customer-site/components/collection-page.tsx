"use client";

import { Button, StatusBadge } from "./ui";
import { useApiResource } from "../hooks/use-api-resource";
import { asList, dateText, money, text, type ApiRecord } from "../lib/records";
import { ErrorBanner, LoadingState, PageIntro, TableCard } from "./portal-ui";

type Column = {
  label: string;
  keys: string[];
  format?: "date" | "money" | "status";
};

export function CollectionPage({
  endpoint,
  eyebrow,
  title,
  description,
  listKeys,
  columns
}: {
  endpoint: string;
  eyebrow: string;
  title: string;
  description: string;
  listKeys: string[];
  columns: Column[];
}) {
  const { data, error, loading, reload } = useApiResource<unknown>(endpoint, []);
  const records = asList(data, listKeys);

  if (loading) return <LoadingState label={`Loading ${title.toLowerCase()}...`} />;

  return (
    <div>
      <PageIntro
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={<Button variant="ghost" onClick={() => void reload()}>Refresh</Button>}
      />
      {error ? <ErrorBanner message={error} retry={() => void reload()} /> : null}
      <TableCard columns={columns.map((column) => column.label)} empty={!records.length}>
        {records.map((record, index) => (
          <tr key={text(record, "id", "_id") + index} className="text-slate-700">
            {columns.map((column) => (
              <td key={column.label} className="whitespace-nowrap px-4 py-4">
                <Cell record={record} column={column} />
              </td>
            ))}
          </tr>
        ))}
      </TableCard>
    </div>
  );
}

function Cell({ record, column }: { record: ApiRecord; column: Column }) {
  const value = text(record, ...column.keys);
  if (column.format === "status") return <StatusBadge status={value} />;
  if (column.format === "money") return <span className="font-bold text-slate-950">{money(value)}</span>;
  if (column.format === "date") return <span>{dateText(value)}</span>;
  return <span>{value}</span>;
}
