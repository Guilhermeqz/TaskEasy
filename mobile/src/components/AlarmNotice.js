import { useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { getAlarmWarning, subscribeAlarmWarning } from '../services/alarms';

export default function AlarmNotice() {
  const message = useSyncExternalStore(subscribeAlarmWarning, getAlarmWarning, getAlarmWarning);
  const { colors } = useTheme();
  if (!message) return null;
  return <View style={[styles.notice, { backgroundColor: colors.secondaryContainer }]}>
    <Text accessibilityLiveRegion="polite" style={{ color: colors.onSecondaryContainer }}>{message}</Text>
  </View>;
}
const styles = StyleSheet.create({ notice: { padding: 16 } });
