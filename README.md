# Yapılacaklar ✓

A cross-platform to-do app built with Expo (iOS · Android · Web). Sign in with Google to sync your tasks across all devices — or use it offline with no account required.

## Features

- **Cloud sync** — tasks and categories stored in PostgreSQL, synced in real time
- **Offline-first** — works without an account using local AsyncStorage
- **Auto-migration** — existing local tasks are uploaded to the cloud on first sign-in
- **Google SSO** — one-tap sign-in via Clerk (Apple on iOS)
- **Categories** — organise tasks into custom groups with a filter bar
- **Priority & due dates** — mark tasks high / medium / low, add deadlines
- **Web PWA** — installable from the browser, works on desktop too

## Stack

| Layer | Tech |
|-------|------|
| Mobile / Web | Expo 54, React Native, React Native Web |
| Routing | Expo Router (file-based) |
| Auth | Clerk (`@clerk/expo`) |
| Backend | Express 5, Node.js 24 |
| Database | PostgreSQL + Drizzle ORM |
| Monorepo | pnpm workspaces |
| Language | TypeScript 5.9 |

## Project Structure
