# Programming Methodology

This document outlines the standard development workflow and practices for this project, optimized for autonomous execution and thorough documentation.

## 1. Development Workflow

**Autonomous Work Principles:** This workflow is designed to be executed autonomously. The developer (or AI agent) is expected to:
*   **Act Agentically:** Proactively identify tasks, make decisions, and execute steps without constant explicit instruction for every detail.
*   **Reasoned Decisions:** Base all decisions (e.g., implementation approach, file structure, tech choices within the defined stack) on logic, project goals, and best practices. Document significant reasoning in planning docs or code comments.
*   **Autonomous Actions:** Independently create necessary files/directories, implement code, manage **PostgreSQL** database migrations (via Prisma), and execute required terminal commands. 
    *   This includes handling common development obstacles. For instance, if schema drift is detected in the **development database**, corrective actions like `prisma migrate reset` may be executed autonomously **after informing the user** of the action and its implications (e.g., data loss in dev). Explicit pre-approval is not required for such standard corrective actions in the development environment; the report step serves as the review.
    *   **Handling Persistent Blockers:** If attempts to resolve a technical blocker (e.g., persistent type errors, environment configuration issues) fail repeatedly (typically after 2-3 distinct attempts like dependency refresh, client regeneration), the agent will: 
        1. Stop further implementation *directly* blocked by the issue.
        2. Document the blocker, the failed resolution attempts, and the impact in the `progress_tracker.md`.
        3. Report the situation clearly to the project lead/user, proposing that the blocker requires manual investigation and resolution.
        4. Act on reasoning or resolution before resuming blocked tasks. The agent may propose working on unrelated, unblocked tasks if available.
*   **Sensible Creativity:** Apply creative solutions within the project's technical boundaries, prioritizing clarity, maintainability, and robustness.

The development process follows these optimized autonomously applied agentic work steps:

1.  **Identify Next Logical Step:** Analyze `progress_tracker.md` and project goals to by applying reasoning determine the most valuable next feature/task and start working on it.
2.  **Plan Implementation:**
    *   Create/update the relevant plan document in `docs/plans/` (e.g., `docs/plans/feature-x.md`).
    *   Outline required frontend/backend changes, **PostgreSQL** schema modifications (via Prisma diff), API endpoints, and data structures.
    *   **Define Documentation Needs:** Specify the documentation files to be created/updated (e.g., `docs/backend/feature-x/api.md`, `docs/frontend/components/FeatureXForm.md`) and outline their required content (purpose, usage, props/API details).
    *   Include code examples/pseudo-code where helpful.
3.  **Implement & Document Concurrently:**
    *   *Documentation during implementation is mandatory.*
    *   Create necessary files/directories following the established structure.
    *   Write frontend and backend code according to the plan.
    *   Simultaneously create/update the corresponding documentation identified in the plan. Populate component/module docs (e.g., `docs/frontend/components/FeatureXForm.md`) with props, usage examples, and implementation notes. Populate API docs (e.g., `docs/backend/feature-x/api.md`) with endpoint details, request/response formats.
    *   Use JSDoc/TSDoc for inline code documentation (functions, classes, types).
    *   Use Prisma Migrate (`npx prisma migrate dev --name ...`) to generate and apply **PostgreSQL** migrations.
    *   Ensure code adheres to standards (`.prettierrc`, `.eslintrc.js`).
4.  **Testing:**
    *   *Testing is an inherent part of the development cycle after implementing a feature segment.*
    *   Write unit tests for critical logic.
    *   Perform integration testing (e.g., `curl`, automated tools) verifying API interactions with **PostgreSQL**.
    *   [Future: Implement End-to-End tests for key user flows].
    *   *The autonomous agent assumes successful completion of necessary testing (unit, integration, and implicitly, developer-driven end-to-end verification) before proceeding to the next implementation step unless blockers are encountered during implementation or testing reveals issues requiring deviation from the plan.*
5.  **Security & Optimization Review:**
    *   Review code for potential security vulnerabilities and adherence to best practices.
    *   Optimize database queries (**PostgreSQL**) and code performance.
6.  **Update Tracker:** *Updating the progress tracker after completing a task segment is mandatory.* Update `docs/progress_tracker.md` with completed work, linking to relevant code/docs, and outlining any newly identified next steps.
7.  **Report & Reason:** Inform yourself of the completed work (linking to PR, plan doc, progress tracker update, generated migration files) and reason about the *next logical implementation step* for continued autonomous development. **This Reasoning results in continued development, a ideal next step is synthesized by the agent and iteratively worked on without interruption.**
    *   *This tracker update (Step 6) is mandatory after each significant work segment.*

## 2. Coding Standards

*   **Formatting:** Code formatting is enforced using **Prettier**. Configuration is defined in `.prettierrc`. Run `npm run format` or configure your editor to format on save.
*   **Linting:** Code quality and potential errors are checked using **ESLint**. Configuration is defined in `.eslintrc.js`. Run `npm run lint` to check for issues.
*   **Naming Conventions:**
    *   Variables and functions: `camelCase`
    *   Classes and Components: `PascalCase`
    *   Constants: `UPPER_SNAKE_CASE`
    *   Files: `kebab-case` (e.g., `user-authentication.tsx`) or `PascalCase` for components.
*   **Comments:** Use comments to explain *why* code is written a certain way, not *what* it does (the code should be self-explanatory). Use JSDoc/TSDoc for documenting functions, classes, and components.

## 3. Branching Strategy

We follow a simplified **Gitflow** model:
*   `main`: Represents the latest stable production release. Only merge tested and approved code here.
*   `develop`: Represents the latest integrated development state. Feature branches are merged here.
*   `feat/<feature-name>`: Feature branches are created from `develop`. All work on a new feature happens here (e.g., `feat/user-auth`). Once complete and reviewed, merge back into `develop`.
*   `fix/<issue-description>`: For bug fixes branched off `develop` or `main` (for hotfixes).

## 4. Code Reviews

*   All code changes intended for `develop` (and subsequently `main`) must be submitted via a **Pull Request (PR)** on the repository platform (e.g., GitHub, GitLab).
*   PRs should clearly describe the changes made and link to any relevant planning documents or issue trackers.
*   At least one other developer/reviewer must approve the PR before merging.
*   Focus reviews on correctness, adherence to standards, potential bugs, security, and documentation.

## 5. Database Migrations

*   Migrations are handled using **Prisma Migrate**.
*   **NEVER** modify the **PostgreSQL** database schema directly in development or production.
*   **Workflow:**
    1.  Modify the `prisma/schema.prisma` file to reflect desired schema changes.
    2.  Generate a new migration file: `npx prisma migrate dev --name <migration_description>` (e.g., `--name add_user_model`). This also applies the migration to your local development **PostgreSQL** database.
    3.  Review the generated SQL migration file in `prisma/migrations/`.
    4.  Commit the updated `schema.prisma` and the new migration directory.
*   Ensure migration files are included in commits and PRs. Deployments will automatically apply pending migrations. 