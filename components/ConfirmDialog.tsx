import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { ConfirmOptions, registerConfirmHandler, unregisterConfirmHandler } from '../lib/confirm';

export function ConfirmDialog() {
  const [visible, setVisible] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const show = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    setVisible(true);
  }, []);

  useEffect(() => {
    registerConfirmHandler(show);
    return () => unregisterConfirmHandler();
  }, [show]);

  const handleCancel = useCallback(() => {
    setVisible(false);
  }, []);

  const handleConfirm = useCallback(() => {
    setVisible(false);
    opts?.onConfirm();
  }, [opts]);

  const isDestructive = opts?.confirmStyle === 'destructive';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center px-8"
        onPress={handleCancel}
      >
        <Pressable
          className={`w-full max-w-sm rounded-2xl p-6 ${
            isDark ? 'bg-slate-900' : 'bg-white'
          }`}
          onPress={(e) => e.stopPropagation()}
        >
          <Text className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {opts?.title}
          </Text>
          <Text className={`text-base mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {opts?.message}
          </Text>
          <View className="flex-row justify-end gap-3">
            <Pressable
              onPress={handleCancel}
              className={`px-5 py-2.5 rounded-xl ${
                isDark ? 'bg-slate-800' : 'bg-gray-100'
              }`}
            >
              <Text className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              className={`px-5 py-2.5 rounded-xl ${
                isDestructive
                  ? 'bg-red-500'
                  : isDark
                    ? 'bg-blue-600'
                    : 'bg-blue-600'
              }`}
            >
              <Text className="text-white font-semibold">
                {opts?.confirmText ?? 'Confirm'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
