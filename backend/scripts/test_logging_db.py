
import sys
import os

# Add backend/python to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from repositories.system.logs import insert_system_log, get_system_logs, wipe_system_logs

def test_logging():
    print("Testing logging database operations...")

    # Clean up
    wipe_system_logs()

    # Insert logs
    insert_system_log(level="INFO", module="Test", message="Test log 1")
    insert_system_log(level="ERROR", module="Test", message="Test log 2", details="Some details")

    # Retrieve logs
    logs = get_system_logs(limit=10, offset=0)
    print(f"Retrieved {len(logs)} logs.")

    assert len(logs) == 2
    # Assuming descending order by rowid or timestamp
    # Let's check if both exist
    messages = [l["message"] for l in logs]
    assert "Test log 1" in messages
    assert "Test log 2" in messages

    # Filter by level
    error_logs = get_system_logs(level="ERROR")
    print(f"Retrieved {len(error_logs)} error logs.")
    assert len(error_logs) == 1
    assert error_logs[0]["level"] == "ERROR"
    assert error_logs[0]["details"] == "Some details"

    # Filter by search
    search_logs = get_system_logs(search="log 1")
    assert len(search_logs) == 1
    assert search_logs[0]["message"] == "Test log 1"

    # Wipe logs
    wipe_system_logs()
    logs_after_wipe = get_system_logs()
    assert len(logs_after_wipe) == 0

    print("All backend logging database tests passed!")

if __name__ == "__main__":
    test_logging()
