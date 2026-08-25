import { RouteState } from "@/components/routes/RouteState";

export default function AuthLoading() {
  return (
    <RouteState
      title="Loading account"
      description="Preparing secure sign-in…"
    />
  );
}
