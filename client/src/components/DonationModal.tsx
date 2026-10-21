import { useEffect, useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Switch } from "antd";
import { CheckCircleFilled, LockOutlined } from "@ant-design/icons";
import api from "../lib/api";
import { useAppConfig } from "../lib/hooks";
import { errorMessage } from "../lib/errors";
import { formatDate, formatMoney } from "../lib/format";
import userStore from "../store/users-store";
import type { Campaign, Receipt } from "../interfaces";

interface Props {
  open: boolean;
  campaign: Campaign;
  onClose: () => void;
  onDonated: () => void;
}

const QUICK = [10, 25, 50, 100, 250];

interface FormValues {
  amount: number;
  donorName?: string;
  donorEmail?: string;
  message?: string;
  isAnonymous?: boolean;
}

export default function DonationModal({ open, campaign, onClose, onDonated }: Props) {
  const [form] = Form.useForm<FormValues>();
  const config = useAppConfig();
  const { currentUser } = userStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const amount = Form.useWatch("amount", form);

  useEffect(() => {
    if (open) {
      setReceipt(null);
      setError(null);
      form.setFieldsValue({ amount: 25, donorName: currentUser?.name || "", isAnonymous: false, message: "" });
    }
  }, [open, currentUser, form]);

  const stripe = config.payments === "stripe";

  const submit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.checkout({
        campaignId: campaign._id,
        amount: values.amount,
        donorName: values.donorName?.trim() || undefined,
        donorEmail: values.donorEmail?.trim() || undefined,
        message: values.message?.trim() || undefined,
        isAnonymous: Boolean(values.isAnonymous),
      });
      if (result.mode === "stripe") {
        window.location.assign(result.checkoutUrl);
        return;
      }
      setReceipt(result.receipt);
      onDonated();
    } catch (e) {
      setError(errorMessage(e, "The donation didn't go through. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={560} destroyOnHidden title={null} centered>
      {receipt ? (
        <div className="py-4 text-center" data-testid="donation-success">
          <CheckCircleFilled className="text-5xl text-moss" />
          <h2 className="mt-4 font-display text-3xl font-semibold text-ink">Thank you.</h2>
          <p className="mt-2 text-muted">
            Your {formatMoney(receipt.amount)} gift to <strong className="text-ink">{receipt.campaignTitle}</strong> is on the
            board.
          </p>
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-dashed border-line bg-paper p-4 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Receipt</span>
              <span className="font-mono text-xs">{receipt.id.slice(0, 18)}…</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted">Date</span>
              <span>{formatDate(receipt.createdAt)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted">Payment</span>
              <span className="font-semibold text-amber-deep">Test payment, no money moved</span>
            </div>
          </div>
          <Button type="primary" size="large" shape="round" className="mt-6" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <Form form={form} layout="vertical" onFinish={submit} requiredMark={false} className="pt-2">
          <div className="kicker text-amber-deep">Back this campaign</div>
          <h2 className="mt-1 font-display text-2xl font-semibold leading-snug text-ink">{campaign.title}</h2>

          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
            {QUICK.map((q) => (
              <button
                type="button"
                key={q}
                onClick={() => form.setFieldsValue({ amount: q })}
                className={`tabular cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  amount === q ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink hover:border-ink/50"
                }`}
              >
                {formatMoney(q)}
              </button>
            ))}
          </div>

          <Form.Item
            name="amount"
            label="Amount (CAD)"
            className="mt-4"
            rules={[
              { required: true, message: "Enter an amount." },
              { type: "integer", min: 1, max: 10000, message: "Whole dollars between $1 and $10,000." },
            ]}
          >
            <InputNumber<number> prefix="$" min={1} max={10000} precision={0} size="large" className="w-full" aria-label="Donation amount" />
          </Form.Item>

          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="donorName" label="Your name" rules={[{ max: 80 }]}>
              <Input size="large" placeholder="Shown with your gift" autoComplete="name" />
            </Form.Item>
            {!currentUser && (
              <Form.Item name="donorEmail" label="Email for receipt (optional)" rules={[{ type: "email", message: "Enter a valid email." }]}>
                <Input size="large" placeholder="you@example.com" autoComplete="email" />
              </Form.Item>
            )}
          </div>

          <Form.Item name="message" label="Message (optional)" rules={[{ max: 280 }]}>
            <Input.TextArea rows={2} maxLength={280} showCount placeholder="A note for the organiser" />
          </Form.Item>

          <div className="flex items-center gap-3">
            <Form.Item name="isAnonymous" valuePropName="checked" noStyle>
              <Switch id="anon" />
            </Form.Item>
            <label htmlFor="anon" className="text-sm text-ink">
              Give anonymously <span className="text-muted">(your name is hidden from the public list)</span>
            </label>
          </div>

          <div className="mt-5 flex gap-3 rounded-2xl bg-amber-soft/60 p-4 text-sm text-ink" data-testid="payment-mode-note">
            <LockOutlined className="mt-0.5 text-amber-deep" />
            {stripe ? (
              <span>
                You'll finish on <strong>Stripe Checkout in test mode</strong>. Use card 4242 4242 4242 4242, any future
                date and any CVC. No real charge is made.
              </span>
            ) : (
              <span>
                <strong>Test payment.</strong> This demo records the gift without asking for a card and without charging
                anyone. With Stripe test keys set, this step becomes Stripe Checkout.
              </span>
            )}
          </div>

          {error && (
            <div role="alert" className="mt-4 rounded-xl bg-rose/10 px-4 py-3 text-sm text-rose">
              {error}
            </div>
          )}

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            shape="round"
            block
            loading={submitting}
            className="mt-6"
            data-testid="confirm-donation"
          >
            {stripe ? "Continue to Stripe (test)" : `Give ${amount ? formatMoney(amount) : ""} (test payment)`}
          </Button>
        </Form>
      )}
    </Modal>
  );
}
