import { useEffect, useState, type CSSProperties } from "react";
import { Button, Form, Input, InputNumber, Modal, Switch } from "antd";
import { CloseOutlined, LockOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useAppConfig } from "../lib/hooks";
import { errorMessage } from "../lib/errors";
import { formatDate, formatMoney } from "../lib/format";
import { giftImpact } from "../lib/insights";
import { CountUp } from "../lib/motion";
import { useReducedMotion } from "../lib/useMotion";
import { paletteFor } from "../lib/palette";
import userStore from "../store/users-store";
import type { Campaign, Receipt } from "../interfaces";
import CampaignCover from "./CampaignCover";
import { ProgressBar } from "./ui";

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

function useIsPhone() {
  const q = "(max-width: 639px)";
  const [phone, setPhone] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setPhone(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return phone;
}

/** The success moment: the campaign's ring sweeps to its new total, your gift glowing at the end. */
function SuccessOrbit({ campaign, before, after }: { campaign: Campaign; before: number; after: number }) {
  const [, mid, light] = paletteFor(campaign.EventCategory);
  const r = 70;
  const c = 2 * Math.PI * r;
  const b = Math.min(100, before);
  const a = Math.min(100, after);
  const gain = Math.max(0.6, a - b);
  const particles = Array.from({ length: 14 }, (_, i) => ({
    a: (360 / 14) * i + (i % 2 ? 8 : 0),
    d: 92 + (i % 3) * 16,
    color: ["#f0a43a", "#a6d1ff", "#fbe5bf"][i % 3],
    s: 4 + (i % 3) * 2,
  }));
  return (
    <div className="relative mx-auto h-[176px] w-[176px]">
      <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
        {particles.map((p, i) => (
          <span
            key={i}
            className="burst absolute rounded-full"
            style={{ width: p.s, height: p.s, marginLeft: -p.s / 2, marginTop: -p.s / 2, background: p.color, "--a": `${p.a}deg`, "--dist": `${p.d}px`, "--d": `${700 + (i % 4) * 40}ms` } as CSSProperties}
          />
        ))}
      </div>
      <svg viewBox="0 0 176 176" className="relative h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="success-planet" cx="0.34" cy="0.3" r="0.85">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.3" stopColor={light} />
            <stop offset="1" stopColor={mid} />
          </radialGradient>
          <filter id="success-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="88" cy="88" r={r} fill="none" stroke="#efe9dd" strokeWidth="8" />
        <circle
          cx="88"
          cy="88"
          r={r}
          fill="none"
          stroke="#d98a1c"
          strokeWidth="8"
          strokeLinecap="round"
          className="arc-draw"
          style={{ "--len": `${(b / 100) * c}`, "--c": `${c}`, "--d": "150ms" } as CSSProperties}
          transform="rotate(-90 88 88)"
        />
        <circle
          cx="88"
          cy="88"
          r={r}
          fill="none"
          stroke="#f0a43a"
          strokeWidth="10"
          strokeLinecap="round"
          filter="url(#success-glow)"
          className="arc-draw"
          style={{ "--len": `${(gain / 100) * c}`, "--c": `${c}`, "--d": "750ms" } as CSSProperties}
          transform={`rotate(${-90 + (b / 100) * 360} 88 88)`}
        />
        <circle cx="88" cy="88" r="50" fill="url(#success-planet)" className="pop-in" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="tabular font-display text-[2rem] font-semibold leading-none tracking-[-0.03em] text-ink">
          <CountUp value={after} from={before} duration={1600} />%
        </div>
        <div className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink/70">funded</div>
      </div>
      <span className="check-pop absolute right-2 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-moss text-paper shadow-lg">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="check-draw" />
        </svg>
      </span>
    </div>
  );
}

export default function DonationModal({ open, campaign, onClose, onDonated }: Props) {
  const [form] = Form.useForm<FormValues>();
  const config = useAppConfig();
  const { currentUser } = userStore();
  const phone = useIsPhone();
  const reduced = useReducedMotion();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [snapshot, setSnapshot] = useState<{ raised: number; name: string } | null>(null);
  const amount = Form.useWatch("amount", form);
  const anonymous = Form.useWatch("isAnonymous", form);

  useEffect(() => {
    if (open) {
      setReceipt(null);
      setError(null);
      form.setFieldsValue({ amount: 25, donorName: currentUser?.name || "", isAnonymous: false, message: "" });
    }
  }, [open, currentUser, form]);

  const stripe = config.payments === "stripe";
  const impact = giftImpact(campaign.EventCurrentAmount, campaign.EventTargetAmount, Number(amount) || 0);

  const submit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const raisedBefore = campaign.EventCurrentAmount;
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
      setSnapshot({ raised: raisedBefore, name: values.isAnonymous ? "" : (values.donorName || "").trim().split(/\s+/)[0] || "" });
      setReceipt(result.receipt);
      onDonated();
    } catch (e) {
      setError(errorMessage(e, "The donation didn't go through. Nothing was recorded, so it's safe to try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const transitionName = reduced ? "" : phone ? "cf-sheet" : "cf-pop";
  const done = receipt && snapshot ? giftImpact(snapshot.raised, campaign.EventTargetAmount, receipt.amount) : null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnHidden
      title={null}
      centered={!phone}
      wrapClassName="cf-sheet-wrap"
      transitionName={transitionName}
      closeIcon={<CloseOutlined className="text-base text-muted" />}
      styles={{ content: { padding: phone ? undefined : "28px 32px 30px" }, mask: { backdropFilter: "blur(6px)", background: "rgba(10,24,24,0.55)" } }}
    >
      {phone && <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden />}
      {receipt && done ? (
        <div className="text-center" data-testid="donation-success">
          <div className="pt-2">
            <SuccessOrbit campaign={campaign} before={done.beforePct} after={done.afterPct} />
          </div>
          <div className="reveal kicker mt-5 text-moss" style={{ "--d": "500ms" } as CSSProperties}>
            Gift recorded
          </div>
          <h2 className="reveal mt-2 font-display text-[2.1rem] font-semibold leading-tight tracking-[-0.03em] text-ink" style={{ "--d": "580ms" } as CSSProperties}>
            {snapshot?.name ? `Thank you, ${snapshot.name}.` : "Thank you."}
          </h2>
          <p className="reveal mx-auto mt-2 max-w-sm text-muted" style={{ "--d": "660ms" } as CSSProperties}>
            Your {formatMoney(receipt.amount)} moves <strong className="text-ink">{receipt.campaignTitle}</strong> to{" "}
            {done.afterPct}% funded{done.reachesGoal ? ", and over the line." : "."}
          </p>

          <div className="reveal ticket mx-auto mt-7 max-w-sm text-left text-sm" style={{ "--d": "760ms" } as CSSProperties}>
            <div className="flex items-baseline justify-between px-5 pb-3 pt-4">
              <span className="kicker text-faint">Receipt</span>
              <span className="tabular font-display text-xl font-semibold text-ink">{formatMoney(receipt.amount)}</span>
            </div>
            <div className="ticket-cut" aria-hidden />
            <dl className="space-y-1.5 px-5 pb-4 pt-3">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Reference</dt>
                <dd className="truncate font-mono text-xs leading-5 text-ink">{receipt.id.slice(0, 20)}…</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Date</dt>
                <dd className="text-ink">{formatDate(receipt.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Payment</dt>
                <dd className="font-semibold text-amber-deep">Test payment, no money moved</dd>
              </div>
            </dl>
          </div>

          <div className="reveal mt-7 flex flex-col-reverse justify-center gap-2 sm:flex-row" style={{ "--d": "840ms" } as CSSProperties}>
            <Link to="/campaigns" onClick={onClose} className="press">
              <Button size="large" shape="round" className="w-full sm:w-auto">
                Find another campaign
              </Button>
            </Link>
            <Button type="primary" size="large" shape="round" className="press !px-8" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <Form form={form} layout="vertical" onFinish={submit} requiredMark={false} className="donate-form">
          <div className="flex items-center gap-3 pr-8">
            <CampaignCover id={campaign._id} category={campaign.EventCategory} image={campaign.image} className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0">
              <div className="kicker text-amber-deep">You're backing</div>
              <h2 className="truncate font-display text-[1.3rem] font-semibold leading-snug tracking-[-0.02em] text-ink">{campaign.title}</h2>
            </div>
          </div>

          <div className="mt-6 rounded-[1.4rem] bg-paper px-4 pb-4 pt-3 sm:px-5">
            <Form.Item
              name="amount"
              label={<span className="kicker text-muted">Your gift · CAD</span>}
              className="!mb-2"
              rules={[
                { required: true, message: "Enter an amount." },
                { type: "integer", min: 1, max: 10000, message: "Whole dollars between $1 and $10,000." },
              ]}
            >
              <InputNumber<number>
                prefix={<span className="font-display text-[2.4rem] font-semibold text-faint">$</span>}
                min={1}
                max={10000}
                precision={0}
                variant="borderless"
                className="amount-input w-full"
                aria-label="Donation amount"
              />
            </Form.Item>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2" role="group" aria-label="Quick amounts">
              {QUICK.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => form.setFieldsValue({ amount: q })}
                  aria-pressed={amount === q}
                  className={`press tabular h-11 cursor-pointer rounded-full border text-sm font-semibold transition-colors duration-200 ${
                    amount === q ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink hover:border-ink/40"
                  }`}
                >
                  {formatMoney(q)}
                </button>
              ))}
            </div>
            <div className="mt-4" data-testid="gift-impact">
              <ProgressBar percent={(campaign.EventCurrentAmount / Math.max(1, campaign.EventTargetAmount)) * 100} gain={impact.gainPct} size="md" />
              <p className="tabular mt-2 text-[0.82rem] text-muted">
                {impact.reachesGoal ? (
                  <>
                    <strong className="text-ink">This gift completes the goal.</strong> {impact.beforePct}% → {impact.afterPct}%
                  </>
                ) : (
                  <>
                    Takes it from <strong className="text-ink">{impact.beforePct}%</strong> to{" "}
                    <strong className="text-ink">{impact.afterPct}%</strong> funded
                    {impact.remainingAfter > 0 && <> · {formatMoney(impact.remainingAfter)} still to go</>}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="donorName" label="Your name" rules={[{ max: 80 }]} extra={anonymous ? "Hidden from the public list." : undefined}>
              <Input size="large" placeholder="Shown with your gift" autoComplete="name" />
            </Form.Item>
            {!currentUser && (
              <Form.Item name="donorEmail" label="Email for receipt (optional)" rules={[{ type: "email", message: "Enter a valid email." }]}>
                <Input size="large" placeholder="you@example.com" autoComplete="email" inputMode="email" />
              </Form.Item>
            )}
          </div>

          <Form.Item name="message" label="Message (optional)" rules={[{ max: 280 }]}>
            <Input.TextArea rows={2} maxLength={280} showCount placeholder="A note for the organiser" />
          </Form.Item>

          <label htmlFor="anon" className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line px-4 py-3">
            <span className="text-sm text-ink">
              Give anonymously
              <span className="block text-xs text-muted">Your name stays off the public supporters list.</span>
            </span>
            <Form.Item name="isAnonymous" valuePropName="checked" noStyle>
              <Switch id="anon" />
            </Form.Item>
          </label>

          <div className="mt-4 flex items-start gap-2.5 text-[0.8rem] leading-relaxed text-muted" data-testid="payment-mode-note">
            <LockOutlined className="mt-[3px] text-amber-deep" />
            {stripe ? (
              <span>
                You'll finish on <strong className="text-ink">Stripe Checkout in test mode</strong>. Use card 4242 4242 4242
                4242, any future date and any CVC. No real charge is made.
              </span>
            ) : (
              <span>
                <strong className="text-ink">Test payment.</strong> No card is asked for and nobody is charged. With Stripe
                test keys set, this step becomes Stripe Checkout.
              </span>
            )}
          </div>

          {error && (
            <div role="alert" className="mt-4 flex gap-3 rounded-2xl border border-rose/25 bg-rose/[0.07] px-4 py-3 text-sm text-rose">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose text-xs font-bold text-paper">!</span>
              {error}
            </div>
          )}

          <div className="donate-submit mt-5">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              shape="round"
              block
              loading={submitting}
              className="press !h-14 !text-base"
              data-testid="confirm-donation"
            >
              {stripe ? "Continue to Stripe (test)" : `Give ${amount ? formatMoney(amount) : ""} · test payment`}
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
}
