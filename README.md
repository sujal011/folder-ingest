# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Docker (production)

This app is a client-side Vite/React build served by Nginx.

### Build + run

```sh
docker compose up --build
```

Then open `http://localhost/`.

### Manual smoke test (should still work in Docker)

1. Click `Choose folder` (or `Use browser picker`), select a small local folder.
2. Confirm the `Directory Structure` and `Summary` render.
3. Click `Copy all` and verify the digest text was copied.
4. Click `Download` and verify `folder-digest.txt` downloads.
