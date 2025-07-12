# 📘 API-First Development with OpenAPI

TUMApply supports API-first development using [OpenAPI Generator](https://openapi-generator.tech). This allows us to
define APIs upfront and generate client and server code automatically.

---

## 🧭 Structure

- `openapi/openapi.yaml`: The central OpenAPI definition file
- Generated files go to: `src/main/generated` (server) and `src/main/webapp/generated` (client)

---

## 🛠️ Generate API Interfaces

To generate Java server-side interfaces based on the `openapi.yaml` file, run:

```bash
./gradlew openApiGenerate
```

Then implements the generated delegate classes with `@Service` classes.

---

## 🧪 Generate OpenAPI Spec from Annotations

You can also generate a new OpenAPI spec from Spring annotations (if desired):

```bash
./gradlew generateApiDocs -x webapp
```

This outputs a new `openapi.yaml` definition file based on code annotations.

---

## 💡 Notes

- Always validate `openapi.yaml` in tools like [Swagger Editor](https://editor.swagger.io)
- Follow consistent naming for paths and parameters
- Define enums explicitly (avoid using `string` if enum is expected)
- Use `operationId` consistently for better client generation
