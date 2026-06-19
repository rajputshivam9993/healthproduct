import { registerAs } from '@nestjs/config';

/**
 * Third-party integration credentials grouped by provider. Values are read from
 * the environment so nothing is hardcoded in source (Req 20.8). Logic that uses
 * these is implemented in the respective feature modules.
 */
export const integrationsConfig = registerAs('integrations', () => ({
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY ?? '',
    senderId: process.env.MSG91_SENDER_ID ?? '',
    templateId: process.env.MSG91_TEMPLATE_ID ?? '',
  },
  aws: {
    region: process.env.AWS_REGION ?? 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    s3Bucket: process.env.AWS_S3_BUCKET ?? '',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID ?? '',
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  },
  agora: {
    appId: process.env.AGORA_APP_ID ?? '',
    appCertificate: process.env.AGORA_APP_CERTIFICATE ?? '',
  },
}));
