# backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.3. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## UploadThing

Image uploads use UploadThing. Create an UploadThing app and set its token in
`UPLOADTHING_TOKEN` in the backend `.env` file before starting the server. The
authenticated endpoint is available at `/api/uploadthing` and accepts images
up to 4 MB.

you can create inngest files anywhere but the most important part is:

```ts
app.use(
  // Expose the middleware on our recommended path at `/api/inngest`.
  "/api/inngest",
  serve({
    client: inngest,
    functions: [/* functions*/],
  }),
);
```
