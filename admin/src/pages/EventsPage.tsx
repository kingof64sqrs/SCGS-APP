import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import { useEffect, useState } from 'react';

import { api } from '../api';

type EventItem = {
  id: string;
  title: string;
  description: string;
  location?: string;
  eventDate?: string;
  active: boolean;
  createdAt: string;
  hasBanner: boolean;
};

type Banner = { contentType: string; base64: string };

function readAsBanner(file: File): Promise<Banner> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(',')[1];
      if (base64) resolve({ contentType: file.type || 'image/jpeg', base64 });
      else reject(new Error('Could not read file'));
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export default function EventsPage() {
  const [data, setData] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      setData(await api<EventItem[]>('/admin/events'));
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setBanner(null);
    setBannerPreview(null);
    form.resetFields();
    form.setFieldsValue({ active: true, notify: true });
  };
  const openEdit = (ev: EventItem) => {
    setCreating(false);
    setEditing(ev);
    setBanner(null);
    setBannerPreview(ev.hasBanner ? `/api/events/${ev.id}/banner` : null);
    form.setFieldsValue({
      title: ev.title,
      description: ev.description,
      location: ev.location,
      eventDate: ev.eventDate,
      active: ev.active,
    });
  };
  const close = () => {
    setCreating(false);
    setEditing(null);
    setBanner(null);
    setBannerPreview(null);
  };

  const save = async () => {
    const v = await form.validateFields();
    try {
      if (creating) {
        await api('/admin/events', {
          method: 'POST',
          body: {
            title: v.title,
            description: v.description,
            location: v.location ?? '',
            eventDate: v.eventDate ?? '',
            active: v.active ?? true,
            notify: v.notify ?? true,
            ...(banner ? { banner } : {}),
          },
        });
        message.success(v.notify ? 'Event created — members notified' : 'Event created');
      } else if (editing) {
        await api(`/admin/events/${editing.id}`, {
          method: 'PUT',
          body: {
            title: v.title,
            description: v.description,
            location: v.location ?? '',
            eventDate: v.eventDate ?? '',
            active: v.active,
            ...(banner ? { banner } : {}),
          },
        });
        message.success('Event updated');
      }
      close();
      void load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const del = async (ev: EventItem) => {
    try {
      await api(`/admin/events/${ev.id}`, { method: 'DELETE' });
      message.success('Deleted');
      void load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const columns = [
    {
      title: 'Banner',
      key: 'banner',
      width: 90,
      render: (_: unknown, ev: EventItem) =>
        ev.hasBanner ? (
          <Image src={`/api/events/${ev.id}/banner`} width={64} height={40} style={{ objectFit: 'cover', borderRadius: 6 }} />
        ) : (
          <span style={{ color: '#94a3b8' }}>—</span>
        ),
    },
    {
      title: 'Event',
      key: 'title',
      render: (_: unknown, ev: EventItem) => (
        <div>
          <strong>{ev.title}</strong>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {ev.eventDate || '—'}
            {ev.location ? ` · ${ev.location}` : ''}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      width: 90,
      render: (a: boolean) => (a ? <Tag color="green">Active</Tag> : <Tag>Hidden</Tag>),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, ev: EventItem) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(ev)}>
            Edit
          </Button>
          <Popconfirm title={`Delete ${ev.title}?`} onConfirm={() => del(ev)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ flex: 1, margin: 0 }}>
          Events ({data.length})
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add event
        </Button>
      </div>

      <Table rowKey="id" loading={loading} dataSource={data} columns={columns} pagination={false} scroll={{ x: 700 }} />

      <Modal
        open={creating || !!editing}
        title={creating ? 'Add event' : 'Edit event'}
        onOk={save}
        onCancel={close}
        okText="Save"
        destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Annual Day 2026" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="eventDate" label="Date / time (free text)">
            <Input placeholder="e.g. 15 Aug 2026, 6:00 PM" />
          </Form.Item>
          <Form.Item name="location" label="Location">
            <Input placeholder="e.g. Samaj Bhavan" />
          </Form.Item>

          <Form.Item label="Banner image">
            <Space direction="vertical">
              {bannerPreview && (
                <Image src={bannerPreview} width={200} style={{ borderRadius: 8 }} />
              )}
              <Upload
                showUploadList={false}
                accept="image/*"
                beforeUpload={(file) => {
                  readAsBanner(file as File)
                    .then((b) => {
                      setBanner(b);
                      setBannerPreview(`data:${b.contentType};base64,${b.base64}`);
                    })
                    .catch((e) => message.error((e as Error).message));
                  return false;
                }}>
                <Button icon={<UploadOutlined />}>
                  {bannerPreview ? 'Replace banner' : 'Upload banner'}
                </Button>
              </Upload>
            </Space>
          </Form.Item>

          <Form.Item name="active" label="Visible to members" valuePropName="checked">
            <Switch />
          </Form.Item>
          {creating && (
            <Form.Item name="notify" valuePropName="checked" noStyle>
              <Checkbox>Notify all members (push + in-app)</Checkbox>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
