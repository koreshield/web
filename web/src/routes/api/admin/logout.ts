import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/admin/logout')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/api/admin/logout"!</div>
}
