"""
backend/app/services/video/render_queue.py
─────────────────────────────────────────────────────────────────────────────
In-memory job queue manager for background video transcode and rendering tasks.
─────────────────────────────────────────────────────────────────────────────
"""

from services.video.job_queue import VideoJobQueueManager, get_job_queue

__all__ = ["VideoJobQueueManager", "get_job_queue"]
