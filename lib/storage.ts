import { storage, config, ID, account } from './appwrite';

/**
 * Service for handling file uploads to Appwrite Storage
 */
export const uploadFile = async (uri: string, bucketId: string, userId: string): Promise<string> => {
  const fileId = ID.unique();
  const extension = uri.split('.').pop() || 'jpg';
  const name = `file_${userId}_${Date.now()}.${extension}`;
  
  // Garantir que os valores do config sejam strings
  const endpoint = String(config.endpoint);
  const projectId = String(config.projectId);

  if (Platform.OS === 'web') {
    // Web requires JWT for fetch-based upload to bypass react-native-appwrite limitations on web
    const jwtResponse = await account.createJWT();
    
    const res = await fetch(uri);
    const blob = await res.blob();
    const fileToUpload = new File([blob], name, { type: blob.type || `image/${extension}` });
    
    const formData = new FormData();
    formData.append('fileId', fileId);
    formData.append('file', fileToUpload);

    const uploadRes = await fetch(`${endpoint}/storage/buckets/${bucketId}/files`, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': projectId,
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
    const viewUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
    return viewUrl;
  } else {
    // Native Mobile handle
    const fileToUpload = {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: name,
      type: `image/${extension}`,
    };
    
    await storage.createFile(bucketId, fileId, fileToUpload as any);
    
    // Manually construct the view URL to avoid SDK version inconsistencies and Promise issues
    const viewUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
    return viewUrl;
  }
};

/**
 * Upload multiple files and return array of URLs
 */
export const uploadFiles = async (uris: string[], bucketId: string, userId: string): Promise<string[]> => {
  if (!uris || uris.length === 0) return [];
  
  // Executa todos os uploads em paralelo e aguarda a resolução de todos
  const uploadPromises = uris.map(uri => uploadFile(uri, bucketId, userId));
  const urls = await Promise.all(uploadPromises);
  
  return urls;
};
