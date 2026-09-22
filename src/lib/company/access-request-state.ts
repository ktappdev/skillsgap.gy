export type CompanyRequestValues = { name: string; website: string; description: string };

export type CompanyRequestState = {
  values: CompanyRequestValues;
  error?: string;
  invalidField?: keyof CompanyRequestValues;
};
