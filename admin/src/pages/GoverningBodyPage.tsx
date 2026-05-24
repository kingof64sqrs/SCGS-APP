import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

import { api } from '../api';
import { PhotoUpload } from '../PhotoUpload';

type GBMember = {
  id: string;
  name: string;
  position: string;
  group: string;
  photoUrl?: string;
  samajId?: string;
};

const GROUPS = ['Office Bearers', 'Members of the Governing Body', 'S.B.K.V Trustees (Represented by SCGS)'];

export default function GoverningBodyPage() {
  const [data, setData] = useState<GBMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<GBMember | null>(null);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      setData(await api<GBMember[]>('/admin/governing-body'));
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
    form.setFieldsValue({ group: GROUPS[0] });
  };
  const openEdit = (g: GBMember) => {
    setCreating(false);
    setEditing(g);
    form.setFieldsValue(g);
  };
  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = async () => {
    const v = await form.validateFields();
    try {
      if (creating) await api('/admin/governing-body', { method: 'POST', body: v });
      else if (editing) await api(`/admin/governing-body/${editing.id}`, { method: 'PUT', body: v });
      message.success('Saved');
      close();
      void load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const del = async (g: GBMember) => {
    try {
      await api(`/admin/governing-body/${g.id}`, { method: 'DELETE' });
      message.success('Deleted');
      void load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', render: (n: string) => <strong>{n}</strong> },
    { title: 'Position', dataIndex: 'position' },
    { title: 'Group', dataIndex: 'group', render: (g: string) => <Tag>{g}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, g: GBMember) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(g)}>
            Edit
          </Button>
          <Popconfirm title={`Delete ${g.name}?`} onConfirm={() => del(g)} okText="Delete" okButtonProps={{ danger: true }}>
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
          Governing Body ({data.length})
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add member
        </Button>
      </div>

      <Table rowKey="id" loading={loading} dataSource={data} columns={columns} pagination={false} scroll={{ x: 600 }} />

      <Modal
        open={creating || !!editing}
        title={creating ? 'Add governing body member' : 'Edit member'}
        onOk={save}
        onCancel={close}
        okText="Save"
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="position" label="Position" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="group" label="Group" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {editing && (
            <Form.Item label="Photo">
              <PhotoUpload samajId={editing.samajId} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
