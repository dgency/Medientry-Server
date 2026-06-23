import { Prisma } from '@prisma/client';

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
  });

type RawMedicalCollege = Prisma.MedicalCollegeGetPayload<{
  select: typeof publicMedicalCollegeSelect;
}>;

export type PublicMedicalCollege = Omit<
  RawMedicalCollege,
  'featuredImage' | 'content' | 'tuitionFee' | 'hostelFee' | 'totalFee'
> & {
  image: string | null;
  featuredImage: string | null;
  tuitionFee: number | null;
  hostelFee: number | null;
  totalFee: number | null;
  contentBlocks: RawMedicalCollege['content'];
};

const decimalToNumber = (value: Prisma.Decimal | null) => {
  if (!value) {
    return null;
  }

  return Number(value.toString());
};

export const mapMedicalCollegeToApi = (
  medicalCollege: RawMedicalCollege,
): PublicMedicalCollege => {
  return {
    ...medicalCollege,
    image: medicalCollege.featuredImage,
    featuredImage: medicalCollege.featuredImage,
    tuitionFee: decimalToNumber(medicalCollege.tuitionFee),
    hostelFee: decimalToNumber(medicalCollege.hostelFee),
    totalFee: decimalToNumber(medicalCollege.totalFee),
    contentBlocks: medicalCollege.content,
  };
};
