import { Image } from 'expo-image';
import { useState } from 'react';

import { API_BASE_URL } from '@/api/config';
import { Avatar } from './avatar';

/**
 * Shows a member's photo served from the backend (stored in MongoDB).
 * Falls back to an initials avatar if there's no photo / it fails to load.
 */
export function MemberPhoto({
  samajId,
  name,
  size,
}: {
  samajId: string;
  name: string;
  size: number;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return <Avatar name={name} size={size} />;

  return (
    <Image
      source={{ uri: `${API_BASE_URL}/api/members/${samajId}/photo` }}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#00000010' }}
      contentFit="cover"
      transition={150}
      onError={() => setFailed(true)}
    />
  );
}
