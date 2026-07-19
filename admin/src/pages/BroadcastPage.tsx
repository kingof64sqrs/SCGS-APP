import { NotificationOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Checkbox, Form, Input, Result, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

import { api } from '../api';

type BroadcastResult = {
  notificationId: string;
  pushAccepted: number;
  tokenCount: number;
  whatsappConfigured: boolean;
  whatsappAttempted: boolean;
  whatsappSent: number;
};

export default function BroadcastPage() {
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);
  const [waConfigured, setWaConfigured] = useState(false);
  const [last, setLast] = useState<BroadcastResult | null>(null);

  useEffect(() => {
    api<{ whatsappConfigured: boolean }>('/admin/broadcast/status')
      .then((s) => setWaConfigured(s.whatsappConfigured))
      .catch(() => setWaConfigured(false));
  }, []);

  const send = async () => {
    const v = await form.validateFields();
    setSending(true);
    try {
      const res = await api<BroadcastResult>('/admin/broadcast', {
        method: 'POST',
        body: { title: v.title, message: v.message, whatsapp: !!v.whatsapp },
      });
      setLast(res);
      message.success('Broadcast sent');
      form.resetFields();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 620 }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        Broadcast a message
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Sends an in-app notification and a push notification to every member. Optionally also
        delivers over WhatsApp.
      </Typography.Paragraph>

      <Card>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Important Notice" prefix={<NotificationOutlined />} />
          </Form.Item>
          <Form.Item name="message" label="Message" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="What do you want to tell everyone?" />
          </Form.Item>

          <Form.Item name="whatsapp" valuePropName="checked" noStyle>
            <Checkbox disabled={!waConfigured}>
              <WhatsAppOutlined style={{ color: waConfigured ? '#25D366' : undefined }} /> Also send
              via WhatsApp
            </Checkbox>
          </Form.Item>
          {!waConfigured && (
            <Alert
              type="info"
              showIcon
              style={{ marginTop: 12 }}
              message="WhatsApp is not configured"
              description="Set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID in the backend .env (WhatsApp Cloud API) to enable WhatsApp broadcasts. Push + in-app notifications work regardless."
            />
          )}

          <Button
            type="primary"
            onClick={send}
            loading={sending}
            style={{ marginTop: 16 }}
            icon={<NotificationOutlined />}>
            Send broadcast
          </Button>
        </Form>
      </Card>

      {last && (
        <Result
          status="success"
          style={{ paddingTop: 24 }}
          title="Broadcast delivered"
          subTitle={
            <div>
              <div>
                Push: <Tag color="blue">{last.pushAccepted}</Tag> accepted of{' '}
                <Tag>{last.tokenCount}</Tag> registered devices
              </div>
              <div style={{ marginTop: 6 }}>
                WhatsApp:{' '}
                {last.whatsappAttempted ? (
                  <Tag color="green">{last.whatsappSent} sent</Tag>
                ) : (
                  <Tag>not sent</Tag>
                )}
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Every member also sees this in the app's notification centre.
              </Typography.Text>
            </div>
          }
        />
      )}
    </div>
  );
}
