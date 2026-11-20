/**
 * ClinixPulse™ Dual-Mode WhatsApp Dispatch Engine
 *
 * Rules:
 * - If WhatsApp API credentials (META_WHATSAPP_TOKEN / WHATSAPP_ACCESS_TOKEN & WHATSAPP_PHONE_NUMBER_ID) are configured:
 *     => Sends message automatically in background over Meta WhatsApp Cloud API (Zero staff interaction).
 * - If API credentials are NOT configured or API call fails:
 *     => Falls back seamlessly to 1-Click WhatsApp link (wa.me/91<phone>?text=...) with zero API fees.
 */

const getWhatsAppCredentials = () => {
  const token =
    process.env.WHATSAPP_ACCESS_TOKEN ||
    process.env.META_WHATSAPP_TOKEN ||
    process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    process.env.META_PHONE_ID;
  const apiBase =
    process.env.WHATSAPP_API_BASE_URL ||
    'https://graph.facebook.com/v21.0';

  const isConfigured = Boolean(token && phoneNumberId);
  return { token, phoneNumberId, apiBase, isConfigured };
};

const cleanPhoneNumber = (rawPhone = '') => {
  const digits = String(rawPhone).replace(/[^\d]/g, '');
  return digits.slice(-10);
};

const buildWhatsAppDeepLink = (rawPhone, messageText) => {
  const clean = cleanPhoneNumber(rawPhone);
  if (!clean || clean.length < 10) return null;
  return `https://wa.me/91${clean}?text=${encodeURIComponent(messageText)}`;
};

/**
 * Send text message directly via Meta WhatsApp Cloud API
 */
const sendWhatsAppDirectApi = async ({ phone, text }) => {
  const { token, phoneNumberId, apiBase, isConfigured } = getWhatsAppCredentials();

  if (!isConfigured) {
    return {
      success: false,
      reason: 'API_NOT_CONFIGURED',
      error: 'WhatsApp API credentials not found in environment.',
    };
  }

  const clean = cleanPhoneNumber(phone);
  if (!clean || clean.length < 10) {
    return {
      success: false,
      reason: 'INVALID_PHONE_NUMBER',
      error: `Invalid patient phone number: ${phone}`,
    };
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: `91${clean}`,
    type: 'text',
    text: { preview_url: false, body: text },
  };

  try {
    const res = await fetch(`${apiBase}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.messages?.[0]?.id) {
      return {
        success: true,
        apiMessageId: data.messages[0].id,
        response: data,
      };
    }

    return {
      success: false,
      reason: 'API_ERROR',
      error: data.error?.message || `HTTP ${res.status} from WhatsApp API`,
      details: data,
    };
  } catch (error) {
    return {
      success: false,
      reason: 'NETWORK_ERROR',
      error: error.message,
    };
  }
};

/**
 * Dual-Mode Dispatcher:
 * Tries Automatic Cloud API first if credentials exist.
 * Seamlessly provides 1-Click fallback link in all circumstances.
 */
const dispatchDualMode = async ({ phone, text }) => {
  const clean = cleanPhoneNumber(phone);
  const waUrl = buildWhatsAppDeepLink(phone, text);
  const { isConfigured } = getWhatsAppCredentials();

  if (isConfigured) {
    const apiResult = await sendWhatsAppDirectApi({ phone, text });
    if (apiResult.success) {
      return {
        deliveryMode: 'AUTOMATIC_API',
        status: 'SENT_AUTOMATICALLY',
        apiConfigured: true,
        apiMessageId: apiResult.apiMessageId,
        cleanPhone: clean,
        waUrl,
      };
    }

    // API configured but call returned an error -> Fallback to 1-Click
    return {
      deliveryMode: 'ONE_CLICK_FALLBACK',
      status: 'FALLBACK_ONE_CLICK',
      apiConfigured: true,
      apiError: apiResult.error,
      cleanPhone: clean,
      waUrl,
    };
  }

  // API not configured -> 1-Click Mode
  return {
    deliveryMode: 'ONE_CLICK_MANUAL',
    status: 'READY_ONE_CLICK',
    apiConfigured: false,
    cleanPhone: clean,
    waUrl,
    instructions: '1-Click WhatsApp link generated for instant zero-cost dispatch.',
  };
};

module.exports = {
  getWhatsAppCredentials,
  cleanPhoneNumber,
  buildWhatsAppDeepLink,
  sendWhatsAppDirectApi,
  dispatchDualMode,
};
