import { useEffect, useState } from "react";
import { Input, Select, Skeleton } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { CATEGORIES } from "../../../../shared/demo-seed.js";
import api from "../../lib/api";
import { useAsync } from "../../lib/hooks";
import type { CampaignQuery } from "../../interfaces";
import CampaignCard from "../../components/CampaignCard";
import { Container, EmptyState, PageHeader } from "../../components/ui";

const SORTS: { value: NonNullable<CampaignQuery["sort"]>; label: string }[] = [
  { value: "featured", label: "Featured first" },
  { value: "newest", label: "Newest" },
  { value: "ending", label: "Ending soon" },
  { value: "most-funded", label: "Most funded" },
];

export default function CampaignsPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const sort = (params.get("sort") as CampaignQuery["sort"]) || "featured";
  const q = params.get("q") || "";
  const [draft, setDraft] = useState(q);

  // Debounce typing into the URL (which drives the query).
  useEffect(() => {
    const t = setTimeout(() => {
      if (draft !== q) update({ q: draft });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  }

  const { data, loading, error } = useAsync(
    () => api.listCampaigns({ q: q || undefined, category: category || undefined, sort }),
    [q, category, sort],
  );

  return (
    <Container className="py-12">
      <PageHeader kicker="Campaigns" title="Find something worth backing">
        Every campaign here has been reviewed by an admin. Give as a guest or sign in to keep a history.
      </PageHeader>

      <div className="sticky top-16 z-30 -mx-4 mb-8 border-b border-line/60 bg-paper/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined className="text-faint" />}
              placeholder="Search by name, organiser or place"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Search campaigns"
            />
            <Select
              size="large"
              value={sort}
              onChange={(v) => update({ sort: v === "featured" ? "" : v })}
              options={SORTS}
              aria-label="Sort campaigns"
              className="w-40 shrink-0 sm:w-48"
            />
          </div>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1" role="tablist" aria-label="Categories">
            {["", ...CATEGORIES].map((c) => (
              <button
                key={c || "all"}
                role="tab"
                aria-selected={category === c}
                onClick={() => update({ category: c })}
                className={`shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  category === c ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink hover:border-ink/40"
                }`}
              >
                {c || "All"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <EmptyState title="Couldn't load campaigns">Check that the API is running, then refresh the page.</EmptyState>
      ) : loading && !data ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl border border-line bg-card">
              <div className="aspect-[16/10] bg-paper-2" />
              <div className="p-5">
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            </div>
          ))}
        </div>
      ) : data && data.length ? (
        <>
          <p className="mb-4 text-sm text-muted" aria-live="polite">
            {data.length} campaign{data.length === 1 ? "" : "s"}
            {category && ` in ${category}`}
            {q && ` matching "${q}"`}
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((c) => (
              <CampaignCard key={c._id} campaign={c} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState title="Nothing matches yet">Try another category or clear the search.</EmptyState>
      )}
    </Container>
  );
}
