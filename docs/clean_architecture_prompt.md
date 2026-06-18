# Clean Architecture Refactoring Prompt

You can use the following prompt to instruct an AI assistant to convert your repository to Clean Architecture.

---

**Prompt:**

Please refactor this repository to follow **Clean Architecture** principles.

### 1. Architectural Guidelines
Restructure the application into a strict three-layered architecture to ensure efficient execution and prevent memory leaks:
*   **Domain Layer (Entities):** Core business logic, data models, and types. This layer must have zero dependencies on any external frameworks or libraries.
*   **Application Layer (Use Cases):** Application-specific business rules. This layer orchestrates the flow of data to and from the domain entities.
*   **Infrastructure & Presentation Layer:** UI components (Next.js/React), external APIs, database implementations, and external services. This layer should depend on the Application and Domain layers, but never the other way around.

Ensure strict unidirectional data flow and dependency injection where applicable to properly manage resources and avoid memory leaks.

### 2. Deployment Targets
Ensure the codebase and its configurations are fully optimized for deployment on both **Render** and **Vercel**:
*   Update any necessary build scripts or configurations (`next.config.js`, `package.json`).
*   Include or update configuration files required for seamless deployment on both platforms (e.g., `render.yaml` or Vercel specific settings).

### 3. Documentation & GitHub
Update all relevant documentation to reflect the new architectural paradigm:
*   Update the `README.md` to explain the new folder structure and how the 3 layers interact.
*   Update any architecture diagrams or markdown files in the `docs/` folder.
*   Ensure GitHub repository files (like `CONTRIBUTING.md`, PR templates, or GitHub Actions in `.github/workflows`) are updated to enforce and explain the new architectural guidelines.

Please provide a step-by-step implementation plan before making these changes.
---
