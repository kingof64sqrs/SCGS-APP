import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Space, Typography, Upload, message } from 'antd';
import { useState } from 'react';

import { api } from './api';

/** Uploads a member's photo (stored in MongoDB) for the given samajId. */
export function PhotoUpload({ samajId }: { samajId?: string }) {
  const [bust, setBust] = useState(0);
  const [uploading, setUploading] = useState(false);

  if (!samajId) {
    return (
      <Typography.Text type="secondary">
        Save first, then re-open to add a photo.
      </Typography.Text>
    );
  }

  const handle = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = String(reader.result).split(',')[1];
      if (!base64) return;
      setUploading(true);
      try {
        await api(`/admin/members/${samajId}/photo`, {
          method: 'PUT',
          body: { contentType: file.type || 'image/jpeg', base64 },
        });
        message.success('Photo updated');
        setBust((b) => b + 1);
      } catch (e) {
        message.error((e as Error).message);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Space align="center">
      <Avatar size={64} src={`/api/members/${samajId}/photo?v=${bust}`} icon={<UserOutlined />} />
      <Upload
        showUploadList={false}
        accept="image/*"
        beforeUpload={(file) => {
          handle(file as File);
          return false;
        }}
      >
        <Button icon={<UploadOutlined />} loading={uploading}>
          Upload photo
        </Button>
      </Upload>
    </Space>
  );
}
