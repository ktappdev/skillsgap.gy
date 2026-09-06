export function buildPositionShareText({
  title,
  company,
  location,
}: {
  title: string;
  company: string;
  location: string | null;
}) {
  const locationText = location?.trim() ? ` · ${location.trim()}` : "";
  return [
    "Could this be your next step in Guyana's growing local-content economy?",
    `${title} at ${company}${locationText}`,
    "Explore the position and see the skills or training that can move you closer with SkillsGap.gy.",
  ].join("\n\n");
}

export function buildCourseShareText({
  name,
  provider,
}: {
  name: string;
  provider: string;
}) {
  return [
    "Know someone building their future in Guyana?",
    `${name} from ${provider} could help close a skills gap for real opportunities.`,
    "Explore the course and share the next step with SkillsGap.gy.",
  ].join("\n\n");
}
