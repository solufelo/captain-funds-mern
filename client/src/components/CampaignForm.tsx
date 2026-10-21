import { useEffect } from "react";
import { Button, DatePicker, Form, Input, InputNumber, Select } from "antd";
import type { FormInstance } from "antd";
import dayjs from "dayjs";
import { CATEGORIES } from "../../../shared/demo-seed.js";
import type { Campaign, CampaignInput } from "../interfaces";
import { toCampaignInput, type CampaignFormValues } from "../lib/campaignForm";

interface Props {
  form: FormInstance<CampaignFormValues>;
  initial?: Partial<Campaign>;
  mode?: "create" | "edit";
  submitting?: boolean;
  onSubmit: (input: CampaignInput) => void;
  onCancel?: () => void;
}

/** Shared by "Start a campaign" and the admin edit dialog. Mirrors the API's zod rules. */
export default function CampaignForm({ form, initial, mode = "create", submitting, onSubmit, onCancel }: Props) {
  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        ...initial,
        endDate: initial.endDate ? dayjs(initial.endDate) : undefined,
      } as Partial<CampaignFormValues>);
    }
  }, [initial, form]);

  return (
    <Form<CampaignFormValues>
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={(v) => onSubmit(toCampaignInput(v))}
      initialValues={{ EventCategory: "Community Development", EventTargetAmount: 5000 }}
      scrollToFirstError
    >
      <Form.Item name="title" label="Campaign title" rules={[{ required: true, min: 3, max: 120, message: "3 to 120 characters." }]}>
        <Input size="large" placeholder="e.g. Winter coats for the Eastside shelter" maxLength={120} />
      </Form.Item>
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Form.Item name="organizer" label="Organiser or group name" rules={[{ required: true, min: 2, max: 80, message: "Who is running this?" }]}>
          <Input size="large" maxLength={80} />
        </Form.Item>
        <Form.Item name="location" label="Location" rules={[{ required: true, min: 2, max: 80, message: "Where does the money go?" }]}>
          <Input size="large" placeholder="Neighbourhood, city" maxLength={80} />
        </Form.Item>
        <Form.Item name="EventCategory" label="Category" rules={[{ required: true }]}>
          <Select size="large" options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
        </Form.Item>
        <Form.Item
          name="EventTargetAmount"
          label="Goal (CAD)"
          rules={[{ required: true, type: "integer", min: 100, max: 1_000_000, message: "Whole dollars, $100 to $1,000,000." }]}
        >
          <InputNumber<number> size="large" prefix="$" min={100} max={1_000_000} precision={0} step={100} className="w-full" />
        </Form.Item>
        <Form.Item
          name="endDate"
          label="End date"
          rules={[{ required: true, message: "Pick an end date." }]}
        >
          <DatePicker
            size="large"
            className="w-full"
            format="MMM D, YYYY"
            disabledDate={(d) =>
              mode === "create" ? d.isBefore(dayjs().add(1, "day"), "day") || d.isAfter(dayjs().add(365, "day")) : false
            }
          />
        </Form.Item>
        <Form.Item
          name="image"
          label="Cover image URL (optional)"
          rules={[{ pattern: /^https:\/\/\S+$/i, message: "Use an https:// link, or leave blank for generated art." }]}
        >
          <Input size="large" placeholder="https://…" />
        </Form.Item>
      </div>
      <Form.Item
        name="description"
        label="Story"
        extra="What is the money for, who does it help, and how will supporters see progress?"
        rules={[{ required: true, min: 20, max: 5000, message: "Tell supporters a bit more (20+ characters)." }]}
      >
        <Input.TextArea rows={7} maxLength={5000} showCount />
      </Form.Item>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        {onCancel && (
          <Button size="large" shape="round" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="primary" htmlType="submit" size="large" shape="round" loading={submitting} data-testid="submit-campaign">
          {mode === "create" ? "Submit for review" : "Save changes"}
        </Button>
      </div>
    </Form>
  );
}
