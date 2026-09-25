# 📂 Projects API

Endpoints for project management and persistence.

| Endpoint                      | Method   | Input Parameters | Description                                             |
| :---------------------------- | :------- | :--------------- | :------------------------------------------------------ |
| `/api/v1/projects`            | `GET`    | None             | Lists all saved projects inside SQLite.                 |
| `/api/v1/projects`            | `POST`   | `name`, `url`    | Saves a new project container.                          |
| `/api/v1/projects/:id`        | `GET`    | `:id`            | Retrieves single project with associated panels.        |
| `/api/v1/projects/:id`        | `DELETE` | `:id`            | Deletes a project and its corresponding SQLite records. |
| `/api/v1/projects/:id/panels` | `POST`   | `:id`, `panels`  | Saves list of updated panels mapping to the project.    |
