Read CURSOR_CONTEXT.md to understand the database and tech stack.

We are starting Phase 4: Create a responsive layout.

Let's start with only step 4.1 so that we make atomic changes.

Please implement Step 4.1 by refactoring src/app/page.tsx and creating new components.

Requirements:

    Layout Architecture:

        Create a new component src/components/dashboard/DashboardGrid.tsx to handle the grid logic.

        Create 4 placeholder components in src/components/dashboard/:

            Overview.tsx (Spans full width at top, below Navbar).

            Budget.tsx (Column 1).

            Insightsn.tsx (Column 2).

            Spending.tsx (Column 3).

    Responsive Behavior:

        Desktop: 3-Column Grid (33.33% | 33.33% | 33.33%) with the Overview bar sitting above them.

        Mobile: Single column stack. Order: Overview -> Insights -> Spending -> Budget.

    Implementation:

        Update src/app/page.tsx to fetch the user (via checkUser) and then render this new structure.

        Use Tailwind CSS for the grid and responsive classes (lg:grid-cols-..., flex-col-reverse or order utilities for mobile sorting).

Go ahead and scaffold these files.