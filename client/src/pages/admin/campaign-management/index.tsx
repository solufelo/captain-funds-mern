import { useMemo, useState } from "react";
import { App, Button, Form, Modal, Popconfirm, Segmented, Space, Table, Tooltip } from "antd";
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, StarFilled, StarOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import api from "../../../lib/api";
import { useAsync } from "../../../lib/hooks";
import { errorMessage } from "../../../lib/errors";
import { campaignState, formatDate, formatMoney, percentFunded, type CampaignState } from "../../../lib/format";
import type { Campaign } from "../../../interfaces";
import CampaignForm from "../../../components/CampaignForm";
import type { CampaignFormValues } from "../../../lib/campaignForm";
import { Container, PageHeader, ProgressBar, StateBadge } from "../../../components/ui";

type Filter = "all" | CampaignState;

export default function AdminCampaignManagement() {
  const { message } = App.useApp();
  const { data, loading, reload } = useAsync(() => api.adminCampaigns(), []);
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<CampaignFormValues>();

  const rows = useMemo(
    () => (data || []).filter((c) => filter === "all" || campaignState(c) === filter),
    [data, filter],
  );
  const counts = useMemo(() => {
    const m: Record<string, number> = { all: data?.length || 0 };
    for (const c of data || []) m[campaignState(c)] = (m[campaignState(c)] || 0) + 1;
    return m;
  }, [data]);

  const run = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      message.success(ok);
      reload();
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  return (
    <Container className="py-12">
      <PageHeader
        kicker="Admin"
        title="Manage campaigns"
        actions={
          <Link to="/admin">
            <Button shape="round">Back to analytics</Button>
          </Link>
        }
      >
        Approve, reject, feature or retire campaigns. Raised totals can't be edited here: they come from the donation ledger.
      </PageHeader>

      <div className="no-scrollbar mb-4 overflow-x-auto">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={(["all", "pending", "live", "funded", "ended", "rejected"] as Filter[]).map((f) => ({
            value: f,
            label: `${f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)} (${counts[f] || 0})`,
          }))}
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-line bg-card">
        <Table<Campaign>
          rowKey="_id"
          loading={loading && !data}
          dataSource={rows}
          pagination={{ pageSize: 12, hideOnSinglePage: true }}
          scroll={{ x: 900 }}
          columns={[
            {
              title: "Campaign",
              key: "title",
              render: (_, c) => (
                <div className="min-w-0">
                  <Link to={`/campaigns/${c._id}`} className="font-semibold text-ink">
                    {c.title}
                  </Link>
                  <div className="text-xs text-muted">
                    {c.organizer} · {typeof c.createdBy === "object" ? c.createdBy.name : ""}
                  </div>
                </div>
              ),
            },
            { title: "Status", key: "state", width: 120, render: (_, c) => <StateBadge campaign={c} /> },
            {
              title: "Raised",
              key: "raised",
              width: 200,
              sorter: (a, b) => a.EventCurrentAmount - b.EventCurrentAmount,
              render: (_, c) => (
                <div className="tabular text-sm">
                  {formatMoney(c.EventCurrentAmount)} <span className="text-muted">/ {formatMoney(c.EventTargetAmount)}</span>
                  <div className="mt-1">
                    <ProgressBar percent={percentFunded(c)} size="sm" />
                  </div>
                </div>
              ),
            },
            { title: "Ends", key: "end", width: 120, render: (_, c) => <span className="text-sm">{formatDate(c.endDate)}</span> },
            {
              title: "",
              key: "actions",
              width: 210,
              render: (_, c) => (
                <Space size={4}>
                  {!c.isApproved && (
                    <Tooltip title="Approve">
                      <Button size="small" shape="circle" type="primary" icon={<CheckOutlined />} aria-label="Approve"
                        onClick={() => run(() => api.adminCampaignAction(c._id, "approve"), "Approved.")} />
                    </Tooltip>
                  )}
                  {!c.isRejected && (
                    <Tooltip title="Reject">
                      <Button size="small" shape="circle" icon={<CloseOutlined />} aria-label="Reject"
                        onClick={() => run(() => api.adminCampaignAction(c._id, "reject"), "Rejected.")} />
                    </Tooltip>
                  )}
                  <Tooltip title={c.isFeatured ? "Unfeature" : "Feature"}>
                    <Button size="small" shape="circle" aria-label="Toggle featured"
                      icon={c.isFeatured ? <StarFilled className="text-amber" /> : <StarOutlined />}
                      onClick={() => run(() => api.adminCampaignAction(c._id, "feature"), c.isFeatured ? "Unfeatured." : "Featured.")} />
                  </Tooltip>
                  <Tooltip title="Edit">
                    <Button size="small" shape="circle" icon={<EditOutlined />} aria-label="Edit" onClick={() => setEditing(c)} />
                  </Tooltip>
                  <Popconfirm
                    title="Delete this campaign?"
                    description="It disappears from public pages. Its donation records are kept."
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => run(() => api.adminCampaignAction(c._id, "delete"), "Deleted.")}
                  >
                    <Button size="small" shape="circle" danger icon={<DeleteOutlined />} aria-label="Delete" />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </div>

      <Modal open={Boolean(editing)} onCancel={() => setEditing(null)} footer={null} width={760} title="Edit campaign" destroyOnHidden>
        {editing && (
          <CampaignForm
            form={form}
            mode="edit"
            initial={editing}
            submitting={saving}
            onCancel={() => setEditing(null)}
            onSubmit={async (input) => {
              setSaving(true);
              await run(async () => {
                await api.adminUpdateCampaign(editing._id, input);
                setEditing(null);
              }, "Saved.");
              setSaving(false);
            }}
          />
        )}
      </Modal>
    </Container>
  );
}
