# CLI Framework

The `common.cli` module provides a Typer-based framework.

## Components

- **HealthCheckerCLI**: The base application wrapper.
- **Console**: Rich console utilities (`print_success`, `print_error`).
- **Progress**: Context managers for loading spinners and progress bars (`track_task`).
- **Parser Options**: Shared options like `--exclude`, `--format`, and `--verbose`.

Example:

```python
from common.cli import HealthCheckerCLI, console

cli = HealthCheckerCLI(name="python_checker")

@cli.app.command()
def scan(path: str):
    console.print("[info]Scanning...[/info]")

if __name__ == "__main__":
    cli.run()
```
