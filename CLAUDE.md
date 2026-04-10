# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm start        # Start production server
```

No test suite is configured.

## Architecture

**Next.js 16 App Router** with Firebase backend, Tailwind CSS 4, TypeScript (strict).

### Configuration

All event-specific data lives in two config files — avoid hardcoding event data elsewhere:
- `congreso.config.ts` — event metadata, thematic axes (ejes), proposal types, activity types, membership categories, proposal states, committee members, compatibility rules
- `app.config.ts` — locale, navigation structure

TypeScript types in `types/index.ts` are derived from these config constants.

### Data layer

Client-side Firestore (Lite) only — no API routes. Pattern:

```
lib/services/*.ts       → CRUD operations (Firestore reads/writes)
lib/hooks/use*.ts       → React hooks that call services and expose loading/data/error
components/*.tsx        → consume hooks directly
```

Collections: `invitados`, `propuestas`, `actividades`, `noticias`, `usuarios`

### Authentication

`lib/auth-context.tsx` wraps the app with Firebase Auth (Google OAuth). Admin pages check for a user with role `"organizador"` from the `usuarios` collection.

### Public vs Admin split

- `components/*.tsx` — public-facing UI
- `components/admin/*.tsx` — CMS components (can be large: AdminActividades ~1100 lines, AdminPropuestas ~785 lines)
- `app/admin/page.tsx` — single admin page that switches between admin modules

### AI features (in progress)

`@google/genai` is installed. The admin panel has modules for embeddings and AI-assisted proposal-to-activity distribution that are partially implemented.

### Path alias

`@/*` maps to the project root (not `src/`).
