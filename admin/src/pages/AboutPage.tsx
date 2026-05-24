import { Button, Card, Form, Input, Spin, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

import { api } from '../api';

type About = {
  title: string;
  paragraphs: string[];
  facts: { label: string; value: string }[];
  contact: { address: string; phone: string; email: string };
  facilities: string[];
  services: string[];
};

const toLines = (a?: string[]) => (a ?? []).join('\n');
const fromLines = (s: string) =>
  s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

export default function AboutPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const a = await api<About>('/admin/about');
        form.setFieldsValue({
          title: a.title,
          paragraphs: toLines(a.paragraphs),
          facts: (a.facts ?? []).map((f) => `${f.label} = ${f.value}`).join('\n'),
          address: a.contact?.address,
          phone: a.contact?.phone,
          email: a.contact?.email,
          facilities: toLines(a.facilities),
          services: toLines(a.services),
        });
      } catch (e) {
        message.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    const v = await form.validateFields();
    const facts = fromLines(v.facts ?? '').map((line: string) => {
      const [label, ...rest] = line.split('=');
      return { label: label.trim(), value: rest.join('=').trim() };
    });
    const body: About = {
      title: (v.title ?? '').trim(),
      paragraphs: fromLines(v.paragraphs ?? ''),
      facts,
      contact: {
        address: (v.address ?? '').trim(),
        phone: (v.phone ?? '').trim(),
        email: (v.email ?? '').trim(),
      },
      facilities: fromLines(v.facilities ?? ''),
      services: fromLines(v.services ?? ''),
    };
    setSaving(true);
    try {
      await api('/admin/about', { method: 'PUT', body });
      message.success('About content saved');
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin />;

  return (
    <Card style={{ maxWidth: 760 }}>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="paragraphs" label="Paragraphs (one per line)">
          <Input.TextArea rows={6} />
        </Form.Item>
        <Form.Item name="facts" label="Facts (format: Label = Value, one per line)">
          <Input.TextArea rows={4} />
        </Form.Item>

        <Typography.Title level={5}>Contact</Typography.Title>
        <Form.Item name="address" label="Address">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="phone" label="Phone">
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email">
          <Input />
        </Form.Item>

        <Form.Item name="facilities" label="Facilities (one per line)">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item name="services" label="Services (one per line)">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Button type="primary" loading={saving} onClick={save}>
          Save About
        </Button>
      </Form>
    </Card>
  );
}
