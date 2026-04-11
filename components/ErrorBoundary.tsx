import { AlertTriangle } from 'lucide-react-native';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Per-screen error boundary that catches render errors and shows
 * a user-friendly retry UI instead of crashing the entire app.
 */
export class ScreenErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ScreenErrorBoundary caught error:', error, errorInfo);
    // TODO: Send to crash reporting service (Sentry, Bugsnag)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-slate-950 px-8">
          <View className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl mb-4">
            <AlertTriangle size={32} color="#ef4444" />
          </View>
          <Text className="text-lg font-bold text-slate-800 dark:text-white text-center mb-2">
            {this.props.fallbackTitle ?? 'Something went wrong'}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6">
            An unexpected error occurred. Please try again.
          </Text>
          <TouchableOpacity
            onPress={this.handleRetry}
            className="bg-blue-600 px-6 py-3 rounded-xl"
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
