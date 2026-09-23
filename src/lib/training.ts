export function normalizeQualificationName(name: string) {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function getQualificationTrainingHref(qualificationName: string) {
  const qualification = qualificationName.trim();
  return `/training?qualification=${encodeURIComponent(qualification)}`;
}
