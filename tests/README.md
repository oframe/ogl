# Matrix setter regression checks

The runtime test checks the existing tuple, matrix-copy and scalar forms of
`Mat3.set` and `Mat4.set`, including their chainable return value.

```sh
node --test tests/matrix-set.test.mjs
```

The TypeScript fixture checks the same accepted call forms and rejects incomplete
scalar calls or calls mixing a matrix with scalar components. It can be checked
without adding project dependencies:

```sh
npx --yes --package typescript@5.9.3 tsc --noEmit --strict --skipLibCheck --module nodenext --moduleResolution nodenext tests/types/matrix-set.ts
```
