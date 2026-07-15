import type { APIRoute } from 'astro';
import { generateSignature, getUploadParams } from '../../../../lib/cloudinary';

export const GET: APIRoute = async () => {
  const params = {
    folder: 'inova-admin',
    upload_preset: 'inova_admin_unsigned',
  };

  const { signature, timestamp } = generateSignature(params);
  const { cloud_name, api_key } = getUploadParams();

  return new Response(JSON.stringify({
    cloud_name,
    api_key,
    timestamp,
    signature,
    folder: 'inova-admin',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
