import {
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Collapse,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
  type TableProps,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api } from '../api';
import { PhotoUpload } from '../PhotoUpload';

type Member = {
  samajId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  bloodGroup: string;
  whatsapp?: string;
  dateOfBirth?: string;
  nativePlace?: string;
  gnati?: string;
  maritalStatus?: string;
  occupation?: string;
  occupationDetails?: string;
  officeAddress?: string;
  father?: string;
  mother?: string;
  spouse?: string;
  children?: string;
  siblings?: string;
};

type PagedMembers = {
  items: Member[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Every editable field, blank. `setFieldsValue` only touches the keys it is
 * given, and the API omits optional fields the member has never filled in — so
 * without this the previously opened member's values stay in the form, and
 * saving writes them onto whoever is open now.
 */
const BLANK_FORM: Record<string, string> = {
  name: '',
  email: '',
  phone: '',
  whatsapp: '',
  bloodGroup: '',
  address: '',
  dateOfBirth: '',
  nativePlace: '',
  gnati: '',
  maritalStatus: '',
  occupation: '',
  occupationDetails: '',
  officeAddress: '',
  father: '',
  mother: '',
  spouse: '',
  children: '',
  siblings: '',
};

export default function MembersPage() {
  const [rows, setRows] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [pwFor, setPwFor] = useState<Member | null>(null);
  const [form] = Form.useForm();
  const [pwForm] = Form.useForm();

  const controllerRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (nextPage: number, size: number, q: string) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(nextPage), limit: String(size) });
        if (q) params.set('q', q);
        const res = await api<PagedMembers>(`/admin/members?${params.toString()}`);
        if (controller.signal.aborted) return;
        setRows(res.items);
        setTotal(res.total);
        setPage(res.page);
      } catch (e) {
        if (controller.signal.aborted) return;
        message.error((e as Error).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [],
  );

  // Debounce typing → activeQuery; activeQuery → fetch page 1.
  useEffect(() => {
    const t = setTimeout(() => setActiveQuery(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    void fetchPage(1, pageSize, activeQuery);
    return () => controllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuery, pageSize]);

  const reload = () => fetchPage(page, pageSize, activeQuery);

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    form.resetFields();
    form.setFieldsValue({ ...BLANK_FORM, bloodGroup: 'O+' });
  };
  const openEdit = async (m: Member) => {
    setCreating(false);
    setEditing(m);
    form.resetFields();
    // Fill with what the list gave us immediately, over a blank slate.
    form.setFieldsValue({ ...BLANK_FORM, ...m });
    try {
      // Fetch the full profile (list projection omits extended fields).
      const full = await api<Member>(`/members/${encodeURIComponent(m.samajId)}`);
      form.setFieldsValue({ ...BLANK_FORM, ...full });
    } catch {
      // keep the list values if the full fetch fails
    }
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
        message.success('Member added — default password is their phone number');
        // Jump to last page so the new row is visible.
        await fetchPage(1, pageSize, activeQuery);
      } else if (editing) {
        const { password: _pw, ...rest } = v;
        await api(`/admin/members/${encodeURIComponent(editing.samajId)}`, {
          method: 'PUT',
          body: rest,
        });
        message.success('Saved');
        await reload();
      }
      close();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const del = async (m: Member) => {
    try {
      await api(`/admin/members/${encodeURIComponent(m.samajId)}`, { method: 'DELETE' });
      message.success('Deleted');
      // If we just removed the last row on this page, step back one.
      const nextPage = rows.length === 1 && page > 1 ? page - 1 : page;
      await fetchPage(nextPage, pageSize, activeQuery);
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const savePw = async () => {
    const v = await pwForm.validateFields();
    try {
      await api(`/admin/members/${encodeURIComponent(pwFor!.samajId)}/password`, {
        method: 'PUT',
        body: v,
      });
      message.success('Password updated — member must change it at next login');
      setPwFor(null);
      pwForm.resetFields();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: '',
        key: 'photo',
        width: 56,
        render: (_: unknown, m: Member) => (
          <Avatar src={`/api/members/${encodeURIComponent(m.samajId)}/photo`} icon={<UserOutlined />} />
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
        render: (b: string) => (b ? <Tag color="red">{b}</Tag> : null),
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
            <Popconfirm
              title={`Delete ${m.name}?`}
              onConfirm={() => del(m)}
              okText="Delete"
              okButtonProps={{ danger: true }}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, page, pageSize, activeQuery],
  );

  const onTableChange: TableProps<Member>['onChange'] = (pagination) => {
    const next = pagination.current ?? 1;
    const size = pagination.pageSize ?? pageSize;
    if (size !== pageSize) {
      setPageSize(size); // effect will refetch
    } else if (next !== page) {
      void fetchPage(next, size, activeQuery);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Typography.Title level={4} style={{ flex: '0 0 auto', margin: 0 }}>
          Members ({total.toLocaleString()})
        </Typography.Title>
        <Input.Search
          allowClear
          placeholder="Search by name, samajId, phone, email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onSearch={(v) => setActiveQuery(v.trim())}
          style={{ flex: '1 1 240px', maxWidth: 420 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add member
        </Button>
      </div>

      <Table<Member>
        rowKey="samajId"
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: [20, 50, 100, 200],
          showTotal: (t, range) => `${range[0]}–${range[1]} of ${t.toLocaleString()}`,
        }}
        onChange={onTableChange}
        scroll={{ x: 720 }}
      />

      <Modal
        open={creating || !!editing}
        title={creating ? 'Add member' : 'Edit member'}
        onOk={save}
        onCancel={close}
        okText="Save"
        destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email (optional)"
            rules={[{ type: 'email', message: 'Enter a valid email or leave blank' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone (login)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="whatsapp" label="WhatsApp number">
            <Input />
          </Form.Item>
          <Form.Item name="bloodGroup" label="Blood group">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Home address">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Collapse
            ghost
            style={{ marginBottom: 12 }}
            items={[
              {
                key: 'more',
                label: 'More profile details (optional)',
                children: (
                  <>
                    <Form.Item name="dateOfBirth" label="Date of Birth">
                      <Input placeholder="e.g. 15 Aug 1980" />
                    </Form.Item>
                    <Form.Item name="nativePlace" label="Native Place (Gujarat)">
                      <Input />
                    </Form.Item>
                    <Form.Item name="gnati" label="Gnati (Community)">
                      <Input />
                    </Form.Item>
                    <Form.Item name="maritalStatus" label="Marital Status">
                      <Input placeholder="Single / Married / …" />
                    </Form.Item>
                    <Form.Item name="occupation" label="Occupation">
                      <Input />
                    </Form.Item>
                    <Form.Item name="occupationDetails" label="Occupation Details">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="officeAddress" label="Office Address">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="father" label="Father">
                      <Input />
                    </Form.Item>
                    <Form.Item name="mother" label="Mother">
                      <Input />
                    </Form.Item>
                    <Form.Item name="spouse" label="Spouse">
                      <Input />
                    </Form.Item>
                    <Form.Item name="children" label="Children">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="siblings" label="Siblings">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />

          {editing && (
            <Form.Item label="Photo">
              <PhotoUpload samajId={editing.samajId} />
            </Form.Item>
          )}
          {creating && (
            <Form.Item
              name="password"
              label="Initial password (optional)"
              extra="Leave blank to use the phone number. Member is asked to change it on first sign-in.">
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
        destroyOnClose>
        <Form form={pwForm} layout="vertical" requiredMark={false}>
          <Form.Item name="password" label="New password" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
