import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { requestJson } from './http.mjs';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const host = expoHost === 'localhost' || expoHost === '127.0.0.1'
  ? (Platform.OS === 'android' ? '10.0.2.2' : expoHost)
  : expoHost;
export const API_URL = (configuredUrl || (host ? `http://${host}:3000` : '')).replace(/\/+$/, '');

export const apiRequest = (path, options) => requestJson(API_URL, path, options);
