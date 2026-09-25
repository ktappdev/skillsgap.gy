import { FormSkeleton } from "@/components/ui/form-skeleton";

// The (auth) layout already draws the logo and the card, so this outlines the
// form only and leaves the shell steady.
export default function AuthLoading() {
  return <FormSkeleton label="Loading the account form" fields={3} className="mx-auto max-w-md" />;
}
