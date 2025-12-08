// utils/fileCache.js
import * as FileSystem from 'expo-file-system/legacy';
import { API_HOST } from '../api/client';

/**
 * Принимает uri:
 *  - file://… → сразу отдаём
 *  - /files/... → превратим в http://<host>/files/...
 *  - http(s)://… → качаем в кэш
 */
export async function ensureLocalFile(uri) {
  if (!uri) return null;

  // Уже локальный файл
  if (uri.startsWith('file://')) {
    return uri;
  }

  // Превращаем относительный путь в полный URL
  let remoteUri = uri;
  if (remoteUri.startsWith('/')) {
    remoteUri = `${API_HOST}${remoteUri}`;
  }

  // Если всё ещё не http/https — значит это не то, что мы можем скачать
  if (
    !remoteUri.startsWith('http://') &&
    !remoteUri.startsWith('https://')
  ) {
    console.log('ensureLocalFile: unsupported uri', uri);
    return null;
  }

  try {
    const filename = remoteUri.split('/').pop().split('?')[0] || 'file';
    const dest = `${FileSystem.cacheDirectory}${filename}`;

    // Уже скачивали ранее
    const info = await FileSystem.getInfoAsync(dest);
    if (info.exists) {
      return info.uri;
    }

    const { uri: localUri } = await FileSystem.downloadAsync(remoteUri, dest);
    return localUri;
  } catch (e) {
    console.log('ensureLocalFile error', e);
    return null;
  }
}
