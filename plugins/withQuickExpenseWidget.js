const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Config plugin that registers the Quick Expense Widget components
 * in AndroidManifest.xml for expo prebuild.
 */
function withQuickExpenseWidget(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;
    const app = manifest.application[0];

    // Add RECEIVE_BOOT_COMPLETED permission if not present
    const permissions = manifest['uses-permission'] || [];
    const hasBootPermission = permissions.some(
      (p) => p.$?.['android:name'] === 'android.permission.RECEIVE_BOOT_COMPLETED'
    );
    if (!hasBootPermission) {
      permissions.push({
        $: { 'android:name': 'android.permission.RECEIVE_BOOT_COMPLETED' },
      });
      manifest['uses-permission'] = permissions;
    }

    // Ensure our receivers and provider are registered
    const receivers = app.receiver || [];
    const providers = app.provider || [];

    // QuickExpenseWidget (AppWidgetProvider)
    const hasWidget = receivers.some(
      (r) => r.$?.['android:name'] === '.QuickExpenseWidget'
    );
    if (!hasWidget) {
      receivers.push({
        $: {
          'android:name': '.QuickExpenseWidget',
          'android:exported': 'false',
          'android:label': 'Quick Expense',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/quick_expense_widget_info',
            },
          },
        ],
      });
    }

    // ExpenseWidgetReceiver
    const hasExpenseReceiver = receivers.some(
      (r) => r.$?.['android:name'] === '.ExpenseWidgetReceiver'
    );
    if (!hasExpenseReceiver) {
      receivers.push({
        $: {
          'android:name': '.ExpenseWidgetReceiver',
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'com.knox26.projects.WIDGET_TEMPLATE_TAP' } },
            ],
          },
        ],
      });
    }

    // BootReceiver
    const hasBootReceiver = receivers.some(
      (r) => r.$?.['android:name'] === '.BootReceiver'
    );
    if (!hasBootReceiver) {
      receivers.push({
        $: {
          'android:name': '.BootReceiver',
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
            ],
          },
        ],
      });
    }

    // ExpenseContentProvider
    const hasProvider = providers.some(
      (p) => p.$?.['android:name'] === '.ExpenseContentProvider'
    );
    if (!hasProvider) {
      providers.push({
        $: {
          'android:name': '.ExpenseContentProvider',
          'android:authorities': 'com.knox26.projects.widget.provider',
          'android:exported': 'false',
        },
      });
    }

    app.receiver = receivers;
    app.provider = providers;

    return config;
  });
}

module.exports = withQuickExpenseWidget;
