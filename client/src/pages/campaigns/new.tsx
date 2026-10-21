import { useState } from "react";
import { App, Form } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { errorMessage } from "../../lib/errors";
import { formatMoney } from "../../lib/format";
import CampaignForm from "../../components/CampaignForm";
import type { CampaignFormValues } from "../../lib/campaignForm";
import CampaignCover from "../../components/CampaignCover";
import { Container, PageHeader, ProgressBar } from "../../components/ui";
import userStore from "../../store/users-store";

export default function NewCampaignPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { currentUser } = userStore();
  const [form] = Form.useForm<CampaignFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const title = Form.useWatch("title", form);
  const category = Form.useWatch("EventCategory", form) || "Community Development";
  const goal = Form.useWatch("EventTargetAmount", form);
  const organizer = Form.useWatch("organizer", form);
  const image = Form.useWatch("image", form);

  return (
    <Container className="py-12">
      <PageHeader kicker="New campaign" title="Start a campaign">
        {currentUser?.isAdmin
          ? "You're an admin, so this campaign goes live as soon as you submit it."
          : "Submit it and a platform admin reviews it before it goes public. You can see it on your dashboard straight away."}
      </PageHeader>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-line bg-card p-6 md:p-8">
          <CampaignForm
            form={form}
            submitting={submitting}
            onSubmit={async (input) => {
              setSubmitting(true);
              try {
                const { campaign, message: msg } = await api.createCampaign(input);
                message.success(msg);
                navigate(`/campaigns/${campaign._id}`);
              } catch (e) {
                message.error(errorMessage(e, "Couldn't save the campaign."));
              } finally {
                setSubmitting(false);
              }
            }}
          />
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="kicker mb-3 text-muted">Live preview</div>
          <div className="overflow-hidden rounded-3xl border border-line bg-card">
            <CampaignCover id={title || "preview"} category={category} image={image} title={title || ""} className="aspect-[16/10]" />
            <div className="p-5">
              <div className="text-xs text-muted">{organizer || "Your organisation"}</div>
              <div className="mt-1 font-display text-xl font-semibold leading-snug">{title || "Your campaign title"}</div>
              <div className="mt-4">
                <ProgressBar percent={0} />
              </div>
              <div className="tabular mt-3 text-sm text-muted">
                <strong className="text-ink">$0</strong> of {formatMoney(goal || 0)}
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">No photo? Each campaign gets its own illustration, drawn from its title and category.</p>
        </aside>
      </div>
    </Container>
  );
}
