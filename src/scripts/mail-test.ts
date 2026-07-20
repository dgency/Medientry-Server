import { getAdminNotificationRecipients, sendAdminFormNotification, verifyMailConnection } from '../utils/mailer';

const run = async () => {
  const recipients = getAdminNotificationRecipients();

  if (recipients.length === 0) {
    throw new Error(
      'ADMIN_NOTIFICATION_EMAILS must include at least one valid recipient before running mail:test.',
    );
  }

  const verificationResult = await verifyMailConnection();

  if (verificationResult.skipped) {
    throw new Error(
      'MAIL_ENABLED=false. Enable mail and configure SMTP before running mail:test.',
    );
  }

  const sendResult = await sendAdminFormNotification({
    formName: 'Mail System Test',
    submissionId: `mail-test-${Date.now()}`,
    submittedAt: new Date(),
    customerName: 'Medientry System Check',
    customerEmail: 'medientry@gmail.com',
    phoneNumber: 'N/A',
    sourcePageUrl: 'backend://mail-test',
    fields: [
      { label: 'Purpose', value: 'SMTP verification and admin-recipient test' },
      { label: 'Environment', value: process.env.NODE_ENV ?? 'development' },
      { label: 'Recipients', value: recipients.join(', ') },
    ],
    actionLabel: 'Mail Test Command',
  });

  if (sendResult.skipped) {
    throw new Error(`Mail test was skipped because of ${sendResult.reason}.`);
  }

  console.log('[mail:test] SMTP verification succeeded.');
  console.log(`[mail:test] Test email sent to: ${recipients.join(', ')}`);
  console.log(`[mail:test] Message ID: ${sendResult.messageId ?? 'not provided by transport'}`);
};

run().catch((error) => {
  console.error(
    '[mail:test] Failed:',
    error instanceof Error ? error.message : 'Unknown mail test failure.',
  );
  process.exit(1);
});
