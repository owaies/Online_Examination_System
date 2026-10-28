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


## Resuming student attempts

When resuming an in-progress quiz attempt, scope the lookup by the authenticated student's email, quiz ID, and institution ID. Do not rely only on a globally unique quiz ID: the institution predicate is a defense-in-depth tenant boundary and prevents inconsistent or colliding records from returning another tenant's attempt.

Regression review: verify the resume query includes `institution_id` and that the returned attempt belongs to the current student's institution.
