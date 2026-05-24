import {
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

import { api } from '../api';
import { PhotoUpload } from '../PhotoUpload';

type Member = {
  samajId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  bloodGroup: string;
};

export default function MembersPage() {
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [pwFor, setPwFor] = useState<Member | null>(null);
  const [form] = Form.useForm();
  const [pwForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      setData(await api<Member[]>('/admin/members'));
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
    form.resetFields();
    form.setFieldsValue({ bloodGroup: 'O+', password: 'test123' });
  };
  const openEdit = (m: Member) => {
    setCreating(false);
    setEditing(m);
    form.setFieldsValue(m);
  };
  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = async () => {
    const v = await form.validateFields();
    try {
      if (creating) {
        await api('/admin/members', { method: 'POST', body: v });
        message.success('Member added');
      } else if (editing) {
        const { password: _pw, ...rest } = v;
        await api(`/admin/members/${editing.samajId}`, { method: 'PUT', body: rest });
        message.success('Saved');
      }
      close();
      void load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const del = async (m: Member) => {
    try {
      await api(`/admin/members/${m.samajId}`, { method: 'DELETE' });
      message.success('Deleted');
      void load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const savePw = async () => {
    const v = await pwForm.validateFields();
    try {
      await api(`/admin/members/${pwFor!.samajId}/password`, { method: 'PUT', body: v });
      message.success('Password updated');
      setPwFor(null);
      pwForm.resetFields();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const columns = [
    {
      title: '',
      key: 'photo',
      width: 56,
      render: (_: unknown, m: Member) => (
        <Avatar src={`/api/members/${m.samajId}/photo`} icon={<UserOutlined />} />
      ),
    },
    {
      title: 'Name',
      key: 'name',
      render: (_: unknown, m: Member) => (
        <div>
          <strong>{m.name}</strong>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {m.samajId}
          </Typography.Text>
        </div>
      ),
    },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Phone', dataIndex: 'phone' },
    {
      title: 'Blood',
      dataIndex: 'bloodGroup',
      width: 80,
      render: (b: string) => <Tag color="red">{b}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, m: Member) => (
        <Space wrap>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(m)}>
            Edit
          </Button>
          <Button size="small" icon={<KeyOutlined />} onClick={() => setPwFor(m)}>
            Password
          </Button>
          <Popconfirm title={`Delete ${m.name}?`} onConfirm={() => del(m)} okText="Delete" okButtonProps={{ danger: true }}>
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
          Members ({data.length})
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add member
        </Button>
      </div>

      <Table rowKey="samajId" loading={loading} dataSource={data} columns={columns} pagination={{ pageSize: 10 }} scroll={{ x: 700 }} />

      <Modal
        open={creating || !!editing}
        title={creating ? 'Add member' : 'Edit member'}
        onOk={save}
        onCancel={close}
        okText="Save"
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email (login)" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="bloodGroup" label="Blood group" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          {editing && (
            <Form.Item label="Photo">
              <PhotoUpload samajId={editing.samajId} />
            </Form.Item>
          )}
          {creating && (
            <Form.Item name="password" label="Password" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        open={!!pwFor}
        title={`Set password — ${pwFor?.name ?? ''}`}
        onOk={savePw}
        onCancel={() => {
          setPwFor(null);
          pwForm.resetFields();
        }}
        okText="Update password"
        destroyOnClose
      >
        <Form form={pwForm} layout="vertical" requiredMark={false}>
          <Form.Item name="password" label="New password" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
