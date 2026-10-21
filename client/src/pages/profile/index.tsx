import { useState } from "react";
import { App, Button, Form, Input, Tag } from "antd";
import api from "../../lib/api";
import { useAsync } from "../../lib/hooks";
import { errorMessage } from "../../lib/errors";
import { formatDate, formatMoney } from "../../lib/format";
import { updateSessionUser } from "../../lib/session";
import userStore from "../../store/users-store";
import type { User } from "../../interfaces";
import { Container, PageHeader, Stat } from "../../components/ui";

export default function ProfilePage() {
  const { message } = App.useApp();
  const { currentUser } = userStore();
  const [saving, setSaving] = useState(false);
  // Real numbers from the same endpoints as the dashboard and donations pages.
  const stats = useAsync(async () => {
    const [dash, gifts] = await Promise.all([api.myDashboard(), api.myDonations()]);
    return { dash, gifts };
  }, []);

  if (!currentUser) return null;

  const save = async (values: Partial<User>) => {
    setSaving(true);
    try {
      updateSessionUser(await api.updateProfile(values));
      message.success("Profile saved.");
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="py-12">
      <PageHeader kicker="Account" title={currentUser.name}>
        {currentUser.email} {currentUser.isAdmin && <Tag color="gold">Admin</Tag>}
        {currentUser.timeStamp && <span className="ml-1 text-sm">· member since {formatDate(currentUser.timeStamp)}</span>}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Campaigns" value={stats.data?.dash.campaigns.length ?? "…"} />
        <Stat label="Raised as organiser" value={stats.data ? formatMoney(stats.data.dash.totals.raised) : "…"} />
        <Stat label="Donations made" value={stats.data?.gifts.stats.totalDonations ?? "…"} />
        <Stat label="Total given" value={stats.data ? formatMoney(stats.data.gifts.stats.totalAmount) : "…"} />
      </div>

      <div className="mt-8 max-w-2xl rounded-3xl border border-line bg-card p-6 md:p-8">
        <h2 className="font-display text-2xl font-semibold">Profile details</h2>
        <Form<Partial<User>> layout="vertical" className="mt-6" initialValues={currentUser} onFinish={save} requiredMark={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true, min: 2, max: 80 }]}>
            <Input size="large" />
          </Form.Item>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="phone" label="Phone" rules={[{ max: 40 }]}>
              <Input size="large" />
            </Form.Item>
            <Form.Item name="location" label="Location" rules={[{ max: 80 }]}>
              <Input size="large" />
            </Form.Item>
          </div>
          <Form.Item name="website" label="Website" rules={[{ max: 200 }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="bio" label="Bio" rules={[{ max: 500 }]}>
            <Input.TextArea rows={4} maxLength={500} showCount />
          </Form.Item>
          <Button type="primary" htmlType="submit" shape="round" size="large" loading={saving}>
            Save profile
          </Button>
        </Form>
      </div>
    </Container>
  );
}
