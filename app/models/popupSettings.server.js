import prisma from "../db.server.js";

const DEFAULTS = {
  enabled: true,
  title: "Wait! Don't leave yet!",
  message: "Get 10% off your first order",
  discountCode: "SAVE10",
  discountPercentage: 10,
  delaySeconds: 2,
  showOnce: true,
};

export async function getPopupSettings(shop) {
  const found = await prisma.popupSettings.findUnique({ where: { shop } });
  if (!found) return { shop, ...DEFAULTS };
  return { ...DEFAULTS, ...found };
}

export async function savePopupSettings(shop, data) {
  const payload = {
    enabled: data.enabled ?? DEFAULTS.enabled,
    title: data.title ?? DEFAULTS.title,
    message: data.message ?? DEFAULTS.message,
    discountCode: data.discountCode ?? DEFAULTS.discountCode,
    discountPercentage:
      typeof data.discountPercentage === "number"
        ? data.discountPercentage
        : DEFAULTS.discountPercentage,
    delaySeconds:
      typeof data.delaySeconds === "number"
        ? data.delaySeconds
        : DEFAULTS.delaySeconds,
    showOnce: data.showOnce ?? DEFAULTS.showOnce,
  };

  return prisma.popupSettings.upsert({
    where: { shop },
    update: payload,
    create: { shop, ...payload },
  });
}

export const defaults = DEFAULTS;
