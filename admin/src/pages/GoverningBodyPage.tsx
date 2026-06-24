import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
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

  // Search box for the GB list itself (client-side filter — list is small).
  const [listQuery, setListQuery] = useState('');

  // Async member search state for the Select inside the modal.
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

  const filteredData = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.position.toLowerCase().includes(q) ||
        g.group.toLowerCase().includes(q) ||
        (g.samajId ?? '').toLowerCase().includes(q),
    );
  }, [data, listQuery]);

  /** Debounced server search for members (modal Select). */
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
    runSearch('');
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
      title: '',
      key: 'photo',
      width: 56,
      render: (_: unknown, g: GBMember) =>
        g.samajId ? (
          <Avatar
            src={`/api/members/${encodeURIComponent(g.samajId)}/photo`}
            icon={<UserOutlined />}
          />
        ) : (
          <Avatar icon={<UserOutlined />} />
        ),
    },
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}>
        <Typography.Title level={4} style={{ flex: '0 0 auto', margin: 0 }}>
          Governing Body ({filteredData.length}
          {listQuery && filteredData.length !== data.length ? ` / ${data.length}` : ''})
        </Typography.Title>
        <Input.Search
          allowClear
          placeholder="Search by name, position, group or samajId…"
          value={listQuery}
          onChange={(e) => setListQuery(e.target.value)}
          style={{ flex: '1 1 240px', maxWidth: 420 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add from members
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={filteredData}
        columns={columns}
        pagination={false}
        scroll={{ x: 700 }}
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
