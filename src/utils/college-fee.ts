import { CollegeFeeBillingPeriod } from '@prisma/client';

export const collegeFeeBillingPeriods = [
  'total',
  'one_time',
  'admission',
  'installment',
  'monthly',
  'yearly',
  'custom',
] as const;

export type CollegeFeeBillingPeriodValue =
  (typeof collegeFeeBillingPeriods)[number];

export type CollegeFeeItemInput = {
  id?: string | null;
  label: string;
  amountUsd?: number | null;
  amountInr?: number | null;
  billingPeriod: CollegeFeeBillingPeriodValue;
  description?: string | null;
  sortOrder: number;
  isTotal: boolean;
  isActive: boolean;
};

export type CollegeFeeSettingsInput = {
  exchangeRateUsdToInr?: number | null;
  showExchangeRateNote?: boolean;
  feeNote?: string | null;
};

export const buildDefaultCollegeFeeItems = (): CollegeFeeItemInput[] => [
  {
    label: 'Total Tuition Fees (Including 1-Year Internship)',
    amountUsd: null,
    amountInr: null,
    billingPeriod: 'total',
    description: null,
    sortOrder: 1,
    isTotal: true,
    isActive: true,
  },
  {
    label: 'Seat Booking Amount',
    amountUsd: null,
    amountInr: null,
    billingPeriod: 'one_time',
    description: null,
    sortOrder: 2,
    isTotal: false,
    isActive: true,
  },
  {
    label: 'Pay During Admission',
    amountUsd: null,
    amountInr: null,
    billingPeriod: 'admission',
    description: null,
    sortOrder: 3,
    isTotal: false,
    isActive: true,
  },
  {
    label: 'Remaining Amount (Pay in 5 Years)',
    amountUsd: null,
    amountInr: null,
    billingPeriod: 'installment',
    description: null,
    sortOrder: 4,
    isTotal: false,
    isActive: true,
  },
  {
    label: 'AC Hostel + Food (Per Month)',
    amountUsd: null,
    amountInr: null,
    billingPeriod: 'monthly',
    description: null,
    sortOrder: 5,
    isTotal: false,
    isActive: true,
  },
];

export const mapCollegeFeeBillingPeriodToPrisma = (
  value: CollegeFeeBillingPeriodValue,
): CollegeFeeBillingPeriod => {
  switch (value) {
    case 'total':
      return CollegeFeeBillingPeriod.TOTAL;
    case 'one_time':
      return CollegeFeeBillingPeriod.ONE_TIME;
    case 'admission':
      return CollegeFeeBillingPeriod.ADMISSION;
    case 'installment':
      return CollegeFeeBillingPeriod.INSTALLMENT;
    case 'monthly':
      return CollegeFeeBillingPeriod.MONTHLY;
    case 'yearly':
      return CollegeFeeBillingPeriod.YEARLY;
    case 'custom':
    default:
      return CollegeFeeBillingPeriod.CUSTOM;
  }
};
