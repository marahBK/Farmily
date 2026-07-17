import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/child")({
  head: () => ({ meta: [{ title: "Farmily — Kids" }] }),
  component: () => <Outlet />,
});
