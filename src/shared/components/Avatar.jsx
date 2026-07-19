import { useState } from 'react';
import defaultProfileImage from '../../../assets/images/default-profile.svg';

export function Avatar({ src, name = '', className = 'avatar' }) {
  const [failedSource, setFailedSource] = useState(null);
  const imageSource = src && src !== failedSource ? src : defaultProfileImage;

  return (
    <span className={className}>
      <img
        src={imageSource}
        alt={name ? `${name}님의 프로필 이미지` : '기본 프로필 이미지'}
        onError={() => setFailedSource(src)}
      />
    </span>
  );
}
