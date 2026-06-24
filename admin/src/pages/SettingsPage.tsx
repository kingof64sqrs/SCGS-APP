import {
  CameraOutlined,
  KeyOutlined,
  LockOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Spin,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useState } from 'react';

import { api, getKey, setKey } from '../api';

type Stats = {
  members: number;
  governingBody: number;
  membersWithPhoto: number;
  pendingPasswordChange: number;
};

type Settings = { adminKeyOverridden: boolean };

export default function SettingsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [s, st] = await Promise.all([
        api<Stats>('/admin/stats'),
        api<Settings>('/admin/settings'),
      ]);
      setStats(s);
      setSettings(st);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const changeKey = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      await api('/admin/settings/admin-key', {
        method: 'PUT',
        body: { newKey: v.newKey, confirmKey: v.confirmKey },
      });
      // The current session's stored key is now invalid — store the new one
      // so subsequent admin requests keep working without re-login.
      setKey(v.newKey);
      message.success('Admin key updated. Use the new key from now on.');
      form.resetFields();
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin />;

  return (
    <>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        Settings
      </Typography.Title>

      {/* Stats */}
      <Typography.Title level={5} style={{ marginTop: 16 }}>
        Overview
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Members"
              value={stats?.members ?? 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Governing Body"
              value={stats?.governingBody ?? 0}
              prefix={<UsergroupAddOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="With photo"
              value={stats?.membersWithPhoto ?? 0}
              suffix={stats ? `/ ${stats.members}` : ''}
              prefix={<CameraOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Awaiting password change"
              value={stats?.pendingPasswordChange ?? 0}
              prefix={<LockOutlined />}
              valueStyle={{ color: stats && stats.pendingPasswordChange > 0 ? '#d97706' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      {/* Change admin key */}
      <Typography.Title level={5} style={{ marginTop: 24 }}>
        Admin Key
      </Typography.Title>
      <Card>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Typography.Text type="secondary">Current source:</Typography.Text>
          {settings?.adminKeyOverridden ? (
            <Tag color="blue">stored in database</Tag>
          ) : (
            <Tag>environment default</Tag>
          )}
        </div>
        <Alert
          showIcon
          type="warning"
          style={{ marginBottom: 16 }}
          message="Changing the admin key signs everyone else out of the panel."
          description="Make a note of the new key before saving. The current session's stored key will be updated for you, but anyone else with the old key will need the new one."
        />
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="newKey"
            label="New admin key"
            rules={[{ required: true, min: 4, message: 'At least 4 characters' }]}>
            <Input.Password prefix={<KeyOutlined />} placeholder="Enter the new key" />
          </Form.Item>
          <Form.Item
            name="confirmKey"
            label="Confirm new key"
            dependencies={['newKey']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_r, value) {
                  if (!value || value === getFieldValue('newKey')) return Promise.resolve();
                  return Promise.reject(new Error('Keys do not match'));
                },
              }),
            ]}>
            <Input.Password prefix={<KeyOutlined />} placeholder="Confirm" />
          </Form.Item>
          <Button type="primary" onClick={changeKey} loading={saving}>
            Update admin key
          </Button>
          <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
            Currently signed in with: <code>{getKey().replace(/./g, '•')}</code>
          </Typography.Paragraph>
        </Form>
      </Card>
    </>
  );
}
