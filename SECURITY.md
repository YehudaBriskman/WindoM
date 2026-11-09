# Security Policy

## Reporting a vulnerability

If you find a security vulnerability in WindoM, please do not open a public GitHub issue.

Send a description of the issue to **yehudabriskman@windom.app** with the subject line `[WindoM Security]`.

Include:

- A description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any suggested fix if you have one

This is a one-person project: you will usually receive a first response within a few days. If the issue is confirmed, a fix will be prioritized and released as soon as possible. Please give a reasonable time to fix the issue before disclosing it publicly, and do not access or modify other users' data while testing.

## Scope

The following are in scope:

- The Chrome extension (`web/`)
- The backend API (`backend/`)
- Authentication and token handling
- OAuth flows (Google, Spotify, GitHub)

## Out of scope

- Issues in third-party dependencies (report those to the dependency maintainers directly)
- Issues that require physical access to the user's machine

## Personal data

If you believe personal data has been exposed, say so in the report. Requests about your own data (access, correction, deletion) go to the same address; see the [Privacy Policy](https://windom.app/privacy).
