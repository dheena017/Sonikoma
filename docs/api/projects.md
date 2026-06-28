# 📂 Projects API

Endpoints for project management and persistence.

| Endpoint                   | Method   | Input Parameters | Description                                             |
| :------------------------- | :------- | :--------------- | :------------------------------------------------------ |
| `/api/projects`            | `GET`    | None             | Lists all saved projects inside SQLite.                 |
| `/api/projects`            | `POST`   | `name`, `url`    | Saves a new project container.                          |
| `/api/projects/:id`        | `GET`    | `:id`            | Retrieves single project with associated panels.        |
| `/api/projects/:id`        | `DELETE` | `:id`            | Deletes a project and its corresponding SQLite records. |
| `/api/projects/:id/panels` | `POST`   | `:id`, `panels`  | Saves list of updated panels mapping to the project.    |
