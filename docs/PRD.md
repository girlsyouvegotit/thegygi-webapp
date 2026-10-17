# GYGI product requirements

Girls You've Got It (GYGI) is a free learning platform for girls and young women, with live classes, recordings, quizzes, assignments, mentorship, and a community. The public site is the marketing and signup surface. Signed-in work happens in role dashboards.

This document describes the product as implemented in this repository. It is not a future roadmap.

## Who it is for

Public visitors can read the homepage, about page, blog, and course explorer, then create an account. Signup always creates a **student**. Staff roles are assigned later by an admin or super admin.

| Role | What they do |
| --- | --- |
| Student | Learn in one or more categories: live classes, recordings, quizzes, assignments, mentorship, community, certificates, and post-program jobs. |
| Tutor | Teach assigned categories: schedule and run live classes, build quizzes and assignments, grade, and review attendance. |
| Mentor | Guide assigned mentees: sessions, goals, notes, and feedback. |
| Writer | Publish blog posts and the public about page. |
| Admin | Run the school: users, categories, finance, analytics, recordings, alumni, and testimonials. |
| Super admin | Everything an admin can do, plus command-center tools: people, impersonation, moderation, treasury queues, live-ops, security, and platform controls. |

`super_admin` is treated as `admin` on routes that allow admins, unless a route is locked to super admin only.

## Public site

- Homepage, about, blog, and category explorer.
- Login, register, forgot password, and reset password.
- Register collects name, email, password (at least 6 characters), and a learning category.
- Public community pulse and testimonials (likes and comments) without an account where those public routes allow it.
- A missing page uses the “Oops, I think we're lost” screen. Unexpected errors use the same sky layout with a retry.

## Learning

- Categories are the programs. Each can have tutors, mentors, students, a community, duration, certificate rules, and completion weights for attendance, quizzes, and assignments.
- Students enroll in a category. Changing category goes through a request an admin can approve or reject. Self-service category changes can be locked for a period.
- Tutors schedule live classes. Participants join, leave, and the class can end. Sessions store attendance, chat, and optional recording.
- Recordings are processed (including through Inngest when configured), then played back with transcript search.
- Quizzes and assignments belong to a category and a tutor. Students submit; tutors grade.
- Certificates can be issued when a category allows them, and revoked by an admin.

## Mentorship and community

- Admins assign mentors to categories and mentees.
- Mentors schedule sessions, set goals with milestones, write notes, and leave feedback.
- Each category community has channels, announcements, direct messages, reactions, pins, stars, and reports.
- Official message threads are separate from community chat and are used by moderation.

## After a program

Students who finish a program can see job matches (Remotive and Arbeitnow) and submit a portfolio for review. Admins see the same feed on Alumni Ops. The live job feed is a sideways carousel of single cards, not a stacked deck.

## Finance

Admins and super admins manage fees, expenses, and salaries from the Finance page (Overview, Fees, Expenses, Salary). They can clear one section or all three. Clearing deletes only those finance documents. It does not delete users, categories, classes, or recordings. The clear requires a second confirmation. If that section is already empty, the page says so and does not reload.

## Moderation and safety

Super admins can message, warn, suspend, unsuspend, ban, or unban a person. Actions are stored as moderation records and written to the activity log. User status is one of clear, warned, suspended, banned, or muted.

Deleting or suspending a user removes that id from category student, tutor, and mentor lists and drops active enrollments, so counts do not stay stuck.

## Counts

A category student count is the number of distinct, currently active users with role `student` who belong to that category through `User.categories`, `User.assignedCategories`, an active enrollment, or `Category.students`. Inactive, suspended, deleted, tutor, mentor, admin, and super admin accounts are not students. Platform totals use the same rule: a count of active students, not a stored array length.

## Dashboards

Each role has a home dashboard. The greeting follows the user’s local time: good morning, good afternoon, good evening, or good night (before 05:00 and from 21:00).

## Out of scope for this document

Billing for learners (programs are free), native mobile apps, and a public role picker at signup.
