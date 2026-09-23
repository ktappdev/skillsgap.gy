export type CompanyRequestValues = {
  name: string;
  website: string;
  industry: string;
  location: string;
  contactPhone: string;
  description: string;
};

export type CompanyRequestState = {
  values: CompanyRequestValues;
  error?: string;
  invalidField?: keyof CompanyRequestValues;
};
