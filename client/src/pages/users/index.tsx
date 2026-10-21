import { useMemo, useState } from "react";
import { App, Button, Input, Popconfirm, Switch, Table, Tag } from "antd";
import { DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import { useAsync } from "../../lib/hooks";
import { errorMessage } from "../../lib/errors";
import { formatDate, formatMoney } from "../../lib/format";
import userStore from "../../store/users-store";
import type { AdminUser } from "../../interfaces";
import { Container, PageHeader, Stat } from "../../components/ui";

export default function UsersPage() {
  const { message } = App.useApp();
  const { currentUser } = userStore();
  const { data, loading, reload } = useAsync(() => api.adminUsers(), []);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data || []).filter((u) => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
  }, [data, q]);

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
        title="Users"
        actions={
          <Link to="/admin">
            <Button shape="round">Back to analytics</Button>
          </Link>
        }
      >
        Accounts, roles and activity. Deactivating someone signs them out on their next request.
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Accounts" value={data?.length ?? "…"} />
        <Stat label="Active" value={data ? data.filter((u) => u.isActive).length : "…"} />
        <Stat label="Admins" value={data ? data.filter((u) => u.isAdmin).length : "…"} />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-card">
        <div className="border-b border-line p-4">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-faint" />}
            placeholder="Search name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Table<AdminUser>
          rowKey="_id"
          loading={loading && !data}
          dataSource={rows}
          pagination={{ pageSize: 15, hideOnSinglePage: true }}
          scroll={{ x: 820 }}
          columns={[
            {
              title: "User",
              key: "u",
              render: (_, u) => (
                <div>
                  <div className="font-semibold">
                    {u.name} {u.isAdmin && <Tag color="gold">Admin</Tag>}
                  </div>
                  <div className="text-xs text-muted">{u.email}</div>
                </div>
              ),
            },
            { title: "Campaigns", dataIndex: "totalCampaigns", width: 110 },
            {
              title: "Given",
              key: "g",
              width: 150,
              render: (_, u) => (
                <span className="tabular">
                  {formatMoney(u.totalDonated)} <span className="text-xs text-muted">({u.totalDonations})</span>
                </span>
              ),
            },
            { title: "Joined", key: "j", width: 130, render: (_, u) => (u.timeStamp ? formatDate(u.timeStamp) : "—") },
            {
              title: "Active",
              key: "a",
              width: 90,
              render: (_, u) => (
                <Switch
                  checked={u.isActive}
                  disabled={u._id === currentUser?._id}
                  onChange={(v) => run(() => api.adminSetUserActive(u._id, v), v ? "Activated." : "Deactivated.")}
                  aria-label={`Active: ${u.name}`}
                />
              ),
            },
            {
              title: "",
              key: "x",
              width: 60,
              render: (_, u) =>
                u._id === currentUser?._id ? null : (
                  <Popconfirm title={`Delete ${u.name}?`} okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => run(() => api.adminDeleteUser(u._id), "Deleted.")}>
                    <Button size="small" shape="circle" danger icon={<DeleteOutlined />} aria-label={`Delete ${u.name}`} />
                  </Popconfirm>
                ),
            },
          ]}
        />
      </div>
    </Container>
  );
}
