import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { handleFirestoreError, OperationType } from '../lib/error';
import CryptoJS from 'crypto-js';

type StorageMode = 'local' | 'online';

interface StorageContextType {
  storageMode: StorageMode;
  setStorageMode: (mode: StorageMode) => void;
  encryptionKey: string;
  setEncryptionKey: (key: string) => void;
  fetchCollection: (collectionName: string, filters?: { field: string, value: any }[]) => Promise<any[]>;
  createDoc: (collectionName: string, data: any) => Promise<string>;
  editDoc: (collectionName: string, id: string, data: any) => Promise<void>;
  removeDoc: (collectionName: string, id: string) => Promise<void>;
  subscribeToCollection: (collectionName: string, filters: { field: string, value: any }[], callback: (data: any[]) => void) => () => void;
}

const StorageContext = createContext<StorageContextType | null>(null);

const mockTimestamp = (dateString: string | number | Date) => {
  const d = new Date(dateString);
  return {
    toDate: () => d,
    toMillis: () => d.getTime()
  };
};

const ensureTimestamp = (val: any) => {
  if (!val) return val;
  if (val.toDate) return val;
  return mockTimestamp(val);
};

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [storageMode, setStorageMode] = useState<StorageMode>(() => {
    return (localStorage.getItem('storageMode') as StorageMode) || 'online';
  });
  const [encryptionKey, setEncryptionKey] = useState<string>(() => {
    return localStorage.getItem('encryptionKey') || '';
  });

  useEffect(() => {
    localStorage.setItem('storageMode', storageMode);
  }, [storageMode]);

  useEffect(() => {
    localStorage.setItem('encryptionKey', encryptionKey);
  }, [encryptionKey]);

  const encrypt = (data: any) => {
    if (!encryptionKey) return data;
    const { userId, createdAt, id, ...rest } = data;
    const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(rest), encryptionKey).toString();
    return { userId, createdAt, ...(id ? { id } : {}), _encrypted: true, payload: ciphertext };
  };

  const decrypt = (data: any) => {
    if (!data._encrypted) return data;
    if (!encryptionKey) return { ...data, _decryptionError: true };
    try {
      const bytes = CryptoJS.AES.decrypt(data.payload, encryptionKey);
      const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      return { userId: data.userId, createdAt: data.createdAt, ...(data.id ? { id: data.id } : {}), ...decrypted };
    } catch (e) {
      return { ...data, _decryptionError: true };
    }
  };

  // Local storage helper
  const getLocalData = (collectionName: string) => {
    const data = localStorage.getItem(`local_db_${collectionName}`);
    return data ? JSON.parse(data) : [];
  };

  const setLocalData = (collectionName: string, data: any[]) => {
    localStorage.setItem(`local_db_${collectionName}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(`local_db_update_${collectionName}`));
  };

  const processData = (rawData: any[], filters: { field: string, value: any }[] = []) => {
    let results = rawData.map(decrypt);
    filters.forEach(filter => {
      results = results.filter(item => item[filter.field] === filter.value);
    });
    return results.map(item => {
      const parsed = { ...item };
      if (parsed.date) parsed.date = ensureTimestamp(parsed.date);
      if (parsed.createdAt) parsed.createdAt = ensureTimestamp(parsed.createdAt);
      return parsed;
    });
  };

  const fetchCollection = async (collectionName: string, filters: { field: string, value: any }[] = []) => {
    if (!user) return [];

    let rawData: any[] = [];

    if (storageMode === 'local') {
      rawData = getLocalData(collectionName).filter((item: any) => item.userId === user.uid);
    } else {
      const q = query(collection(db, collectionName), where('userId', '==', user.uid));
      try {
        const snap = await getDocs(q);
        rawData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, collectionName);
        return [];
      }
    }

    return processData(rawData, filters);
  };

  const createDoc = async (collectionName: string, data: any) => {
    if (!user) throw new Error('Not authenticated');

    const baseData = {
      ...data,
      userId: user.uid,
      createdAt: storageMode === 'local' ? new Date().toISOString() : serverTimestamp(),
      ...(data.date instanceof Date ? { date: data.date.toISOString() } : {})
    };

    if (storageMode === 'local') {
      const items = getLocalData(collectionName);
      const newId = Math.random().toString(36).substring(2, 15);
      const newItem = { ...baseData, id: newId };
      
      setLocalData(collectionName, [...items, encrypt(newItem)]);
      return newId;
    } else {
      try {
        const toSave = encrypt(baseData);
        const docRef = await addDoc(collection(db, collectionName), toSave);
        return docRef.id;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, collectionName);
        throw error;
      }
    }
  };

  const editDoc = async (collectionName: string, id: string, data: any) => {
    if (storageMode === 'local') {
      const items = getLocalData(collectionName);
      const updatedItems = items.map((item: any) => {
        if (item.id === id) {
          const decrypted = decrypt(item);
          const merged = { 
            ...decrypted, 
            ...data,
            ...(data.date instanceof Date ? { date: data.date.toISOString() } : {})
          };
          return encrypt(merged);
        }
        return item;
      });
      setLocalData(collectionName, updatedItems);
    } else {
      try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        let toSave = data;
        
        if (docSnap.exists()) {
          const existing = docSnap.data();
          const decrypted = decrypt({ id: docSnap.id, ...existing });
          const merged = { ...decrypted, ...data };
          const encrypted = encrypt(merged);
          const { id: _id, ...rest } = encrypted;
          toSave = rest;
        } else {
          toSave = encrypt(data);
        }
        
        await updateDoc(docRef, toSave);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
        throw error;
      }
    }
  };

  const removeDoc = async (collectionName: string, id: string) => {
    if (storageMode === 'local') {
      const items = getLocalData(collectionName);
      setLocalData(collectionName, items.filter((item: any) => item.id !== id));
    } else {
      try {
        await deleteDoc(doc(db, collectionName, id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
        throw error;
      }
    }
  };

  const subscribeToCollection = (collectionName: string, filters: { field: string, value: any }[], callback: (data: any[]) => void) => {
    if (!user) return () => {};

    if (storageMode === 'local') {
      const updateCallback = () => {
        const rawData = getLocalData(collectionName).filter((item: any) => item.userId === user.uid);
        callback(processData(rawData, filters));
      };
      
      updateCallback();
      
      const eventName = `local_db_update_${collectionName}`;
      window.addEventListener(eventName, updateCallback);
      return () => window.removeEventListener(eventName, updateCallback);
    } else {
      const q = query(collection(db, collectionName), where('userId', '==', user.uid));
      
      return onSnapshot(q, (snapshot) => {
        const rawData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(processData(rawData, filters));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, collectionName);
      });
    }
  };

  return (
    <StorageContext.Provider value={{ storageMode, setStorageMode, encryptionKey, setEncryptionKey, fetchCollection, createDoc, editDoc, removeDoc, subscribeToCollection }}>
      {children}
    </StorageContext.Provider>
  );
}

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) throw new Error('useStorage must be used within StorageProvider');
  return context;
};
