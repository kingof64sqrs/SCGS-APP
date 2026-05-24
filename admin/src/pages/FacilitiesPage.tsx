import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Popconfirm, Space, Table, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

import { api } from '../api';

type Facility = { id: string; name: string; description: string };

export default function FacilitiesPage() {
  const [data, setData] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Facility | null>(null);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      setData(await api<Facility[]>('/admin/facilities'));
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
  };
  const openEdit = (f: Facility) => {
    setCreating(false);
    setEditing(f);
    form.setFieldsValue(f);
  };
  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = async () => {
    const v = await form.validateFields();
    try {
      if (creating) await api('/admin/facilities', { method: 'POST', body: v });
      else if (editing) await api(`/admin/facilities/${editing.id}`, { method: 'PUT', body: v });
      message.success('Saved');
      close();
      void load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const del = async (f: Facility) => {
    try {
      await api(`/admin/facilities/${f.id}`, { method: 'DELETE' });
      message.success('Deleted');
      void load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', width: 240, render: (n: string) => <strong>{n}</strong> },
    { title: 'Description', dataIndex: 'description' },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, f: Facility) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(f)}>
            Edit
          </Button>
          <Popconfirm title={`Delete ${f.name}?`} onConfirm={() => del(f)} okText="Delete" okButtonProps={{ danger: true }}>
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
          Facilities ({data.length})
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add facility
        </Button>
      </div>

      <Table rowKey="id" loading={loading} dataSource={data} columns={columns} pagination={false} scroll={{ x: 600 }} />

      <Modal
        open={creating || !!editing}
        title={creating ? 'Add facility' : 'Edit facility'}
        onOk={save}
        onCancel={close}
        okText="Save"
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
