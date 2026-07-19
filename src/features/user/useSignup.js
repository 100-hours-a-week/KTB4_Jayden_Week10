import { useCallback, useRef } from 'react';
import { uploadProfileImage } from '../images/imageService.js';
import { createUser } from './userService.js';

export function useSignup() {
  const uploadedImageRef = useRef({ file: null, url: null });

  return useCallback(async (userData, profileImageFile) => {
    let profileImageUrl = null;
    if (profileImageFile) {
      if (uploadedImageRef.current.file === profileImageFile) {
        profileImageUrl = uploadedImageRef.current.url;
      } else {
        profileImageUrl = await uploadProfileImage(profileImageFile, { auth: false });
        uploadedImageRef.current = { file: profileImageFile, url: profileImageUrl };
      }
    }
    return createUser({ ...userData, profileImageUrl });
  }, []);
}
