import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export function useEncryption() {
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const generateDeviceToken = useCallback(async (): Promise<string> => {
    try {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
    } catch (error) {
      throw new Error('Failed to generate device token');
    }
  }, []);

  const deriveKey = useCallback(async (token: string): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(token),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('VoiceRecorderSalt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }, []);

  const encryptData = useCallback(async (data: ArrayBuffer, token: string): Promise<ArrayBuffer> => {
    setIsEncrypting(true);
    try {
      const key = await deriveKey(token);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      const result = new Uint8Array(iv.length + encryptedData.byteLength);
      result.set(iv, 0);
      result.set(new Uint8Array(encryptedData), iv.length);
      
      return result.buffer;
    } catch (error) {
      toast({
        title: "Encryption failed",
        description: "Failed to encrypt recording data",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsEncrypting(false);
    }
  }, [deriveKey]);

  const decryptData = useCallback(async (encryptedData: ArrayBuffer, token: string): Promise<ArrayBuffer> => {
    setIsDecrypting(true);
    try {
      const key = await deriveKey(token);
      const data = new Uint8Array(encryptedData);
      const iv = data.slice(0, 12);
      const encrypted = data.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      return decryptedData;
    } catch (error) {
      toast({
        title: "Decryption failed",
        description: "Failed to decrypt recording data. Check your device token.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsDecrypting(false);
    }
  }, [deriveKey]);

  return {
    generateDeviceToken,
    encryptData,
    decryptData,
    isEncrypting,
    isDecrypting
  };
}
