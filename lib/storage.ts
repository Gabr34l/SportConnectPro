import { Platform } from 'react-native';
import { storage, config, ID, account } from './appwrite';

/**
 * Service for handling file uploads to Appwrite Storage
 */
export const uploadFile = async (uri: string, bucketId: string, userId: string): Promise<string> => {
  const fileId = ID.unique();
  const extension = uri.split('.').pop() || 'jpg';
  const name = `file_${userId}_${Date.now()}.${extension}`;
  
  if (Platform.OS === 'web') {
    // Web requires JWT for fetch-based upload to bypass react-native-appwrite limitations on web
    const jwtResponse = await account.createJWT();
    
    const res = await fetch(uri);
    const blob = await res.blob();
    const fileToUpload = new File([blob], name, { type: blob.type || `image/${extension}` });
    
    const formData = new FormData();
    formData.append('fileId', fileId);
    formData.append('file', fileToUpload);

    const uploadRes = await fetch(`${config.endpoint}/storage/buckets/${bucketId}/files`, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': config.projectId,
        'X-Appwrite-JWT': jwtResponse.jwt,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json();
      console.error('Appwrite Storage Upload Error:', errorData);
      throw new Error(errorData.message || 'Failed to upload file to storage');
    }

    // Manually construct the view URL to avoid SDK version inconsistencies and Promise issues
    return `${config.endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${config.projectId}`;
  } else {
    // Native Mobile handle
    const fileToUpload = {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: name,
      type: `image/${extension}`,
    };
    
    await storage.createFile(bucketId, fileId, fileToUpload as any);
    
    // Manually construct the view URL to avoid SDK version inconsistencies and Promise issues
    return `${config.endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${config.projectId}`;
  }
};

/**
 * Upload multiple files and return array of URLs
 */
export const uploadFiles = async (uris: string[], bucketId: string, userId: string): Promise<string[]> => {
  if (!uris || uris.length === 0) return [];
  
  // Executa todos os uploads em paralelo e aguarda a resolução de todos
  const urls = await Promise.all(
    uris.map(uri => uploadFile(uri, bucketId, userId))
  );
  
  return urls;
};
