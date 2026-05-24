import { Image } from 'expo-image';
import { useEffect, useState } from 'react';

import { API_BASE_URL } from '@/api/config';
import { useAuth } from '@/context/auth-context';
import { Avatar } from './avatar';

/**
 * Shows a member's photo served from the backend (stored in MongoDB).
 * Falls back to an initials avatar if there's no photo / it fails to load.
 * Reloads when the signed-in user updates their photo (photoBust).
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
  const { photoBust } = useAuth();
  const [failed, setFailed] = useState(false);

  // A photo update may have added a photo where there wasn't one — retry.
  useEffect(() => {
    setFailed(false);
  }, [photoBust]);

  if (failed) return <Avatar name={name} size={size} />;

  const bust = photoBust > 0 ? `?v=${photoBust}` : '';
  return (
    <Image
      source={{ uri: `${API_BASE_URL}/api/members/${samajId}/photo${bust}` }}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#00000010' }}
      contentFit="cover"
      transition={150}
      onError={() => setFailed(true)}
    />
  );
}
