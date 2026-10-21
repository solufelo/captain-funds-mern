import { useEffect, useState } from "react";
import { Button, Input, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { CATEGORIES } from "../../../../shared/demo-seed.js";
import api from "../../lib/api";
import { useAsync } from "../../lib/hooks";
import type { CampaignQuery } from "../../interfaces";
import CampaignCard from "../../components/CampaignCard";
import { Container, EmptyState, PageHeader, Skel } from "../../components/ui";
import { Reveal } from "../../lib/motion";
import { paletteFor } from "../../lib/palette";

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
    <Container className="py-10 sm:py-14">
      <PageHeader kicker="Campaigns" title={<>Find something <em className="font-normal italic text-ink-3">worth backing.</em></>}>
        Every campaign here has been reviewed by an admin. Give as a guest, or sign in to keep a history.
      </PageHeader>

      <div className="sticky top-16 z-30 -mx-4 mb-8 border-b border-line/60 bg-paper/85 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-[1.4rem] sm:border sm:bg-card/85 sm:px-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined className="text-faint" />}
              placeholder="Search by name, organiser or place"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Search campaigns"
              className="!rounded-full"
            />
            <Select
              size="large"
              value={sort}
              onChange={(v) => update({ sort: v === "featured" ? "" : v })}
              options={SORTS}
              aria-label="Sort campaigns"
              className="w-full shrink-0 sm:w-52"
              popupMatchSelectWidth={false}
            />
          </div>
          <div
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pr-14 [mask-image:linear-gradient(90deg,#000_calc(100%-3.5rem),transparent)] sm:-mx-1 sm:px-1 sm:pr-14"
            role="tablist"
            aria-label="Categories"
          >
            {["", ...CATEGORIES].map((c) => (
              <button
                key={c || "all"}
                role="tab"
                aria-selected={category === c}
                onClick={() => update({ category: c })}
                className={`press inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-200 ${
                  category === c ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink hover:border-ink/40"
                }`}
              >
                {c && <span className="h-2 w-2 rounded-full" style={{ background: paletteFor(c)[category === c ? 2 : 1] }} />}
                {c || "All"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <EmptyState title="Couldn't load campaigns" tone="rose">
          Check that the API is running, then refresh the page.
        </EmptyState>
      ) : loading && !data ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading campaigns">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-[1.6rem] border border-line bg-card">
              <Skel className="aspect-[16/10] !rounded-none" />
              <div className="p-6">
                <Skel className="h-3 w-1/3" />
                <Skel className="mt-3 h-6 w-4/5" />
                <Skel className="mt-6 h-2 w-full" />
                <Skel className="mt-3 h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : data && data.length ? (
        <>
          <p className="mb-5 text-sm text-muted" aria-live="polite">
            <strong className="font-semibold text-ink">{data.length}</strong> campaign{data.length === 1 ? "" : "s"}
            {category && ` in ${category}`}
            {q && ` matching “${q}”`}
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((c, i) => (
              <Reveal key={c._id} delay={(i % 3) * 90} className="h-full">
                <CampaignCard campaign={c} />
              </Reveal>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="Nothing matches yet"
          tone="sky"
          action={
            <Button shape="round" size="large" onClick={() => { setDraft(""); setParams(new URLSearchParams(), { replace: true }); }}>
              Clear search and filters
            </Button>
          }
        >
          {q ? `No campaign mentions “${q}”${category ? ` in ${category}` : ""}.` : `No live campaigns in ${category || "this view"} right now.`}
        </EmptyState>
      )}
    </Container>
  );
}
