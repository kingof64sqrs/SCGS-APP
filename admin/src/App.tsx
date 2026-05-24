import { LockOutlined, LogoutOutlined } from '@ant-design/icons';
import { Button, Card, ConfigProvider, Input, Layout, Tabs, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

import { api, clearKey, getKey, LOGO, NAVY, setKey } from './api';
import AboutPage from './pages/AboutPage';
import FacilitiesPage from './pages/FacilitiesPage';
import GoverningBodyPage from './pages/GoverningBodyPage';
import MembersPage from './pages/MembersPage';

function Login({ onOk }: { onOk: () => void }) {
  const [key, setKeyValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);

  const submit = async () => {
    if (!key.trim()) return;
    setLoading(true);
    setErr(false);
    try {
      setKey(key.trim());
      await api('/admin/verify');
      onOk();
    } catch {
      clearKey();
      setErr(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f3f4f6' }}>
      <Card style={{ width: 380, textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,.10)' }}>
        <img src={LOGO} alt="SCGS" style={{ width: 96, height: 96, objectFit: 'contain' }} />
        <Typography.Title level={4} style={{ marginTop: 8, marginBottom: 0 }}>
          SCGS Admin
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Manage members, governing body &amp; content.
        </Typography.Paragraph>
        <Input.Password
          size="large"
          prefix={<LockOutlined />}
          placeholder="Admin key"
          value={key}
          status={err ? 'error' : undefined}
          onChange={(e) => {
            setKeyValue(e.target.value);
            setErr(false);
          }}
          onPressEnter={submit}
        />
        {err && (
          <Typography.Text type="danger" style={{ display: 'block', marginTop: 8 }}>
            Invalid admin key
          </Typography.Text>
        )}
        <Button type="primary" size="large" block style={{ marginTop: 16 }} loading={loading} onClick={submit}>
          Sign in
        </Button>
      </Card>
    </div>
  );
}

function Shell({ onLogout }: { onLogout: () => void }) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ display: 'flex', alignItems: 'center', gap: 12, background: NAVY, paddingInline: 20 }}>
        <img
          src={LOGO}
          alt="SCGS"
          style={{ width: 38, height: 38, background: '#fff', borderRadius: 8, padding: 3, objectFit: 'contain' }}
        />
        <Typography.Title level={5} style={{ color: '#fff', margin: 0, flex: 1 }}>
          Shree Coimbatore Gujarati Samaj · Admin
        </Typography.Title>
        <Button icon={<LogoutOutlined />} onClick={onLogout}>
          Sign out
        </Button>
      </Layout.Header>
      <Layout.Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <Tabs
            defaultActiveKey="members"
            items={[
              { key: 'members', label: 'Members', children: <MembersPage /> },
              { key: 'gb', label: 'Governing Body', children: <GoverningBodyPage /> },
              { key: 'about', label: 'About', children: <AboutPage /> },
              { key: 'facilities', label: 'Facilities', children: <FacilitiesPage /> },
            ]}
          />
        </div>
      </Layout.Content>
    </Layout>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      if (getKey()) {
        try {
          await api('/admin/verify');
          setAuthed(true);
        } catch {
          clearKey();
        }
      }
      setChecking(false);
    })();
  }, []);

  return (
    <ConfigProvider theme={{ token: { colorPrimary: NAVY, borderRadius: 8 } }}>
      {checking ? null : authed ? (
        <Shell
          onLogout={() => {
            clearKey();
            setAuthed(false);
            message.success('Signed out');
          }}
        />
      ) : (
        <Login onOk={() => setAuthed(true)} />
      )}
    </ConfigProvider>
  );
}
