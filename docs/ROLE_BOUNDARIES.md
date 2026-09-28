# Examination Role Boundaries

The project is a Next.js application with dedicated route groups for administration, students, teachers, quizzes, and password changes.

## Role model

A role-specific route should enforce its access boundary before rendering or mutating privileged data. UI hiding is not a security boundary on its own.

## Maintenance checklist

For every new route, identify the intended role first. Then verify:

1. The route has a clear authorization check.
2. Server-side data access is scoped to that role and user.
3. Unauthorized requests return a controlled result.
4. Navigation does not become the only protection.

Keep the route map and authentication documentation synchronized as sections are added or renamed.
