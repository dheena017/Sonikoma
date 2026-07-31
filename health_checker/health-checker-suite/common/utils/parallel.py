"""
Parallel processing utilities.
"""
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed
from typing import Callable, Iterable, List, TypeVar, Any

T = TypeVar('T')
R = TypeVar('R')

def run_in_parallel(
    func: Callable[[T], R],
    items: Iterable[T],
    max_workers: int = 4,
    use_processes: bool = False
) -> List[R]:
    """
    Run a function over an iterable of items in parallel.
    """
    results = []
    executor_cls = ProcessPoolExecutor if use_processes else ThreadPoolExecutor

    with executor_cls(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_item = {executor.submit(func, item): item for item in items}

        # Collect results as they complete
        for future in as_completed(future_to_item):
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                # Log or handle exceptions if needed
                raise RuntimeError(f"Task failed: {e}") from e

    return results
