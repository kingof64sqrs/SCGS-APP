import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

type MemberLite = { samajId: string; name: string; phone?: string };

type PagedMembers = {
  items: MemberLite[];
  total: number;
};

const GROUPS = [
  'Office Bearers',
  'Members of the Governing Body',
  'S.B.K.V Trustees (Represented by SCGS)',
];

const SEARCH_DEBOUNCE_MS = 250;
const SEARCH_LIMIT = 50;

export default function GoverningBodyPage() {
  const [data, setData] = useState<GBMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<GBMember | null>(null);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  // Async member search state for the Select.
  const [searchTerm, setSearchTerm] = useState('');
  const [memberOptions, setMemberOptions] = useState<MemberLite[]>([]);
  const [searching, setSearching] = useState(false);
  const searchControllerRef = useRef<AbortController | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const usedSamajIds = useMemo(
    () => new Set(data.map((g) => g.samajId).filter(Boolean) as string[]),
    [data],
  );

  /** Fire a debounced server search for members. */
  const runSearch = useCallback((q: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      searchControllerRef.current?.abort();
      const controller = new AbortController();
      searchControllerRef.current = controller;
      setSearching(true);
      try {
        const params = new URLSearchParams({ page: '1', limit: String(SEARCH_LIMIT) });
        if (q.trim()) params.set('q', q.trim());
        const res = await api<PagedMembers>(`/admin/members?${params.toString()}`);
        if (controller.signal.aborted) return;
        setMemberOptions(res.items);
      } catch {
        if (!controller.signal.aborted) setMemberOptions([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  /** Ensure the currently-linked member shows up as a Select option (for edit). */
  const ensureSelectedInOptions = useCallback(async (samajId: string) => {
    try {
      const m = await api<{
        samajId: string;
        name: string;
        phone?: string;
      }>(`/members/${encodeURIComponent(samajId)}`);
      setMemberOptions((prev) => {
        if (prev.some((p) => p.samajId === m.samajId)) return prev;
        return [{ samajId: m.samajId, name: m.name, phone: m.phone }, ...prev];
      });
    } catch {
      // Best-effort — if it fails the Select just shows the id.
    }
  }, []);

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    form.resetFields();
    form.setFieldsValue({ group: GROUPS[0] });
    setSearchTerm('');
    setMemberOptions([]);
    runSearch(''); // prime with first page
  };
  const openEdit = (g: GBMember) => {
    setCreating(false);
    setEditing(g);
    form.setFieldsValue({
      samajId: g.samajId,
      position: g.position,
      group: g.group,
    });
    setSearchTerm('');
    setMemberOptions([]);
    if (g.samajId) {
      void ensureSelectedInOptions(g.samajId);
    }
    runSearch('');
  };
  const close = () => {
    setCreating(false);
    setEditing(null);
    setMemberOptions([]);
    setSearchTerm('');
  };

  const save = async () => {
    const v = await form.validateFields();
    try {
      if (creating) {
        await api('/admin/governing-body', { method: 'POST', body: v });
      } else if (editing) {
        await api(`/admin/governing-body/${editing.id}`, { method: 'PUT', body: v });
      }
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
      message.success('Removed');
      void load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const columns = [
    {
      title: 'Member',
      key: 'name',
      render: (_: unknown, g: GBMember) => (
        <div>
          <strong>{g.name}</strong>
          {g.samajId ? (
            <>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {g.samajId}
              </Typography.Text>
            </>
          ) : null}
        </div>
      ),
    },
    { title: 'Position', dataIndex: 'position' },
    { title: 'Group', dataIndex: 'group', render: (g: string) => <Tag>{g}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: unknown, g: GBMember) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(g)}>
            Edit
          </Button>
          <Popconfirm
            title={`Remove ${g.name}?`}
            onConfirm={() => del(g)}
            okText="Delete"
            okButtonProps={{ danger: true }}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const currentSamajId = editing?.samajId;
  const selectOptions = memberOptions.map((m) => ({
    value: m.samajId,
    label: `${m.name} — ${m.samajId}${m.phone ? ` · ${m.phone}` : ''}`,
    disabled: creating && usedSamajIds.has(m.samajId) && m.samajId !== currentSamajId,
  }));

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ flex: 1, margin: 0 }}>
          Governing Body ({data.length})
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add from members
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={false}
        scroll={{ x: 600 }}
      />

      <Modal
        open={creating || !!editing}
        title={creating ? 'Add governing body member' : 'Edit governing body member'}
        onOk={save}
        onCancel={close}
        okText="Save"
        destroyOnClose>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="samajId"
            label="Member"
            rules={[{ required: true, message: 'Pick a member' }]}
            extra="Type to search the directory. Only existing members can be added.">
            <Select
              showSearch
              placeholder="Search by name, samajId or phone"
              options={selectOptions}
              filterOption={false}
              searchValue={searchTerm}
              onSearch={(v) => {
                setSearchTerm(v);
                runSearch(v);
              }}
              notFoundContent={searching ? <Spin size="small" /> : 'No matches'}
              loading={searching}
              virtual
            />
          </Form.Item>
          <Form.Item name="position" label="Position" rules={[{ required: true }]}>
            <Input placeholder="e.g. President, Treasurer, …" />
          </Form.Item>
          <Form.Item name="group" label="Group" rules={[{ required: true }]}>
            <Select options={GROUPS.map((g) => ({ value: g, label: g }))} />
          </Form.Item>
          {editing?.samajId && (
            <Form.Item label="Member photo">
              <PhotoUpload samajId={editing.samajId} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
