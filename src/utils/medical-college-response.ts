import { CollegeFeeBillingPeriod, Prisma } from '@prisma/client';
import {
  convertUsdToInr,
  type ExchangeRateSettings,
  getDefaultExchangeRateSettings,
} from './exchange-rate';

const billingPeriodToApiValue: Record<
  CollegeFeeBillingPeriod,
  PublicCollegeFeeItem['billingPeriod']
> = {
  TOTAL: 'total',
  ONE_TIME: 'one_time',
  ADMISSION: 'admission',
  INSTALLMENT: 'installment',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const readNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export type PublicCollegeFeeItem = {
  id: string;
  label: string;
  amountUsd: number | null;
  amountInr: number | null;
  billingPeriod:
    | 'total'
    | 'one_time'
    | 'admission'
    | 'installment'
    | 'monthly'
    | 'yearly'
    | 'custom';
  description: string | null;
  sortOrder: number;
  isTotal: boolean;
  isActive: boolean;
};

export type PublicMedicalCollegeFeeSettings = {
  exchangeRateUsdToInr: number | null;
  showExchangeRateNote: boolean;
  customExchangeRateNote: string | null;
  exchangeRateUpdatedAt: string | null;
};

export const publicMedicalCollegeSelect =
  Prisma.validator<Prisma.MedicalCollegeSelect>()({
    id: true,
    studyDestinationId: true,
    name: true,
    slug: true,
    country: true,
    city: true,
    shortDescription: true,
    featuredImage: true,
    gallery: true,
    tuitionFee: true,
    hostelFee: true,
    totalFee: true,
    ranking: true,
    eligibility: true,
    admissionProcess: true,
    facilities: true,
    content: true,
    isFeatured: true,
    sortOrder: true,
    status: true,
    seoTitle: true,
    seoDescription: true,
    seoKeywords: true,
    ogImage: true,
    canonicalUrl: true,
    createdAt: true,
    updatedAt: true,
    feeItems: {
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        label: true,
        amountUsd: true,
        amountInr: true,
        billingPeriod: true,
        description: true,
        sortOrder: true,
        isTotal: true,
        isActive: true,
      },
    },
  });

type RawMedicalCollege = Prisma.MedicalCollegeGetPayload<{
  select: typeof publicMedicalCollegeSelect;
}>;

export type PublicMedicalCollege = Omit<
  RawMedicalCollege,
  | 'featuredImage'
  | 'content'
  | 'tuitionFee'
  | 'hostelFee'
  | 'totalFee'
  | 'feeItems'
> & {
  image: string | null;
  featuredImage: string | null;
  tuitionFee: number | null;
  hostelFee: number | null;
  totalFee: number | null;
  feeStructure: PublicCollegeFeeItem[];
  feeSettings: PublicMedicalCollegeFeeSettings;
  contentBlocks: RawMedicalCollege['content'];
};

const decimalToNumber = (value: Prisma.Decimal | null) => {
  if (!value) {
    return null;
  }

  return Number(value.toString());
};

const billingPeriodFromLabel = (
  label: string,
): PublicCollegeFeeItem['billingPeriod'] => {
  const normalized = label.toLowerCase();

  if (normalized.includes('total')) {
    return 'total';
  }

  if (normalized.includes('booking')) {
    return 'one_time';
  }

  if (normalized.includes('admission')) {
    return 'admission';
  }

  if (normalized.includes('remaining') || normalized.includes('installment')) {
    return 'installment';
  }

  if (normalized.includes('month')) {
    return 'monthly';
  }

  if (normalized.includes('year')) {
    return 'yearly';
  }

  return 'custom';
};

const mapSavedFeeItems = (
  feeItems: RawMedicalCollege['feeItems'],
  includeInactiveFeeItems: boolean,
  globalExchangeRateSettings: ExchangeRateSettings,
): PublicCollegeFeeItem[] =>
  feeItems
    .filter((item) => includeInactiveFeeItems || item.isActive)
    .map((item) => ({
      id: item.id,
      label: item.label,
      amountUsd: decimalToNumber(item.amountUsd),
      amountInr:
        convertUsdToInr(
          decimalToNumber(item.amountUsd),
          globalExchangeRateSettings.exchangeRateUsdToInr,
        ) ?? decimalToNumber(item.amountInr),
      billingPeriod: billingPeriodToApiValue[item.billingPeriod],
      description: item.description,
      sortOrder: item.sortOrder,
      isTotal: item.isTotal,
      isActive: item.isActive,
    }));

const buildLegacyFeeItemId = (medicalCollegeId: string, suffix: string) =>
  `${medicalCollegeId}:${suffix}`;

const deriveFeeItemsFromLegacyContent = (
  medicalCollege: RawMedicalCollege,
  globalExchangeRateSettings: ExchangeRateSettings,
): PublicCollegeFeeItem[] => {
  if (!isRecord(medicalCollege.content) || !isRecord(medicalCollege.content.feeStructure)) {
    return [];
  }

  const feeStructure = medicalCollege.content.feeStructure;
  const feeType = readString(feeStructure.type)?.toLowerCase();
  const rawItems = Array.isArray(feeStructure.items) ? feeStructure.items : [];

  if (!feeType || rawItems.length === 0) {
    return [];
  }

  return rawItems
    .map((rawItem, index): PublicCollegeFeeItem | null => {
      if (!isRecord(rawItem)) {
        return null;
      }

      const label = readString(rawItem.item) ?? readString(rawItem.label);
      if (!label) {
        return null;
      }

      const amountUsdSource =
        rawItem.amountUsd ??
        rawItem.amountUSD ??
        rawItem.usd ??
        rawItem.amount;
      const amountUsd =
        amountUsdSource === 'Included' ? null : readNumber(amountUsdSource);

      const amountInrSource = rawItem.amountInr ?? rawItem.amountINR ?? rawItem.inr;
      const savedAmountInr =
        amountInrSource === 'Included' ? null : readNumber(amountInrSource);

      return {
        id: buildLegacyFeeItemId(medicalCollege.id, `content-${index + 1}`),
        label,
        amountUsd,
        amountInr:
          convertUsdToInr(
            amountUsd,
            globalExchangeRateSettings.exchangeRateUsdToInr,
          ) ?? savedAmountInr,
        billingPeriod: billingPeriodFromLabel(label),
        description: readString(rawItem.note) ?? readString(rawItem.description),
        sortOrder: index + 1,
        isTotal: label.toLowerCase().includes('total'),
        isActive: true,
      };
    })
    .filter((item): item is PublicCollegeFeeItem => Boolean(item));
};

const deriveFeeItemsFromLegacyColumns = (
  medicalCollege: RawMedicalCollege,
  globalExchangeRateSettings: ExchangeRateSettings,
): PublicCollegeFeeItem[] => {
  const items: PublicCollegeFeeItem[] = [];
  const totalFee = decimalToNumber(medicalCollege.totalFee);
  const tuitionFee = decimalToNumber(medicalCollege.tuitionFee);
  const hostelFee = decimalToNumber(medicalCollege.hostelFee);

  if (totalFee != null) {
    items.push({
      id: buildLegacyFeeItemId(medicalCollege.id, 'legacy-total'),
      label: 'Total Tuition Fees (Including 1-Year Internship)',
      amountUsd: totalFee,
      amountInr: convertUsdToInr(
        totalFee,
        globalExchangeRateSettings.exchangeRateUsdToInr,
      ),
      billingPeriod: 'total',
      description: null,
      sortOrder: items.length + 1,
      isTotal: true,
      isActive: true,
    });
  }

  if (tuitionFee != null) {
    items.push({
      id: buildLegacyFeeItemId(medicalCollege.id, 'legacy-tuition'),
      label:
        totalFee == null
          ? 'Total Tuition Fees (Including 1-Year Internship)'
          : 'Legacy Tuition Fee',
      amountUsd: tuitionFee,
      amountInr: convertUsdToInr(
        tuitionFee,
        globalExchangeRateSettings.exchangeRateUsdToInr,
      ),
      billingPeriod: totalFee == null ? 'total' : 'custom',
      description: null,
      sortOrder: items.length + 1,
      isTotal: totalFee == null,
      isActive: true,
    });
  }

  if (hostelFee != null) {
    items.push({
      id: buildLegacyFeeItemId(medicalCollege.id, 'legacy-hostel'),
      label: 'Legacy Hostel Fee',
      amountUsd: hostelFee,
      amountInr: convertUsdToInr(
        hostelFee,
        globalExchangeRateSettings.exchangeRateUsdToInr,
      ),
      billingPeriod: 'custom',
      description: null,
      sortOrder: items.length + 1,
      isTotal: false,
      isActive: true,
    });
  }

  return items;
};

export const mapMedicalCollegeToApi = (
  medicalCollege: RawMedicalCollege,
  options: {
    includeInactiveFeeItems?: boolean;
    globalExchangeRateSettings?: ExchangeRateSettings;
  } = {},
): PublicMedicalCollege => {
  const {
    featuredImage,
    content,
    tuitionFee,
    hostelFee,
    totalFee,
    feeItems: _feeItems,
    ...restMedicalCollege
  } = medicalCollege;
  const includeInactiveFeeItems = options.includeInactiveFeeItems === true;
  const globalExchangeRateSettings =
    options.globalExchangeRateSettings ?? getDefaultExchangeRateSettings();
  const savedFeeItems = mapSavedFeeItems(
    medicalCollege.feeItems,
    includeInactiveFeeItems,
    globalExchangeRateSettings,
  );
  const legacyContentFeeItems = deriveFeeItemsFromLegacyContent(
    medicalCollege,
    globalExchangeRateSettings,
  );
  const derivedFeeItems =
    savedFeeItems.length > 0
      ? savedFeeItems
      : legacyContentFeeItems.length > 0
        ? legacyContentFeeItems
        : deriveFeeItemsFromLegacyColumns(
            medicalCollege,
            globalExchangeRateSettings,
          );

  return {
    ...restMedicalCollege,
    image: featuredImage,
    featuredImage,
    tuitionFee: decimalToNumber(tuitionFee),
    hostelFee: decimalToNumber(hostelFee),
    totalFee: decimalToNumber(totalFee),
    feeStructure: derivedFeeItems,
    feeSettings: { ...globalExchangeRateSettings },
    contentBlocks: content,
  };
};
