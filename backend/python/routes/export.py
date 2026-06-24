import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import tempfile
import json
import aiohttp
from typing import Optional
try:
    import google_auth_oauthlib.flow
    import googleapiclient.discovery
    import googleapiclient.errors
    from googleapiclient.http import MediaFileUpload
    HAS_YOUTUBE_API = True
except ImportError:
    HAS_YOUTUBE_API = False

router = APIRouter()
logger = logging.getLogger("sonikoma.api.export")

class YouTubeExportRequest(BaseModel):
    video_url: str
    title: str
    synopsis: str

@router.post("/youtube")
async def export_to_youtube(request: YouTubeExportRequest):
    if not HAS_YOUTUBE_API:
        raise HTTPException(status_code=500, detail="Google API client libraries not installed. Run 'pip install google-api-python-client google-auth-oauthlib google-auth-httplib2'")
        
    logger.info(f"Received YouTube export request for: {request.video_url}")
    
    
    is_remote = request.video_url.startswith("http://") or request.video_url.startswith("https://")
    
    # We will use a temporary file if it's remote, otherwise fallback to local public path
    tmp_video_path = None
    video_path = os.path.join(os.getcwd(), "public", "videos", request.video_url.split("/")[-1])

    if is_remote:
        fd, tmp_video_path = tempfile.mkstemp(suffix=".mp4")
        os.close(fd)
        logger.info(f"Downloading remote video from {request.video_url} to {tmp_video_path}")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(request.video_url) as resp:
                    if resp.status == 200:
                        with open(tmp_video_path, 'wb') as f:
                            f.write(await resp.read())
                        video_path = tmp_video_path
                    else:
                        raise Exception(f"Failed to download video: HTTP {resp.status}")
        except Exception as e:
            if tmp_video_path and os.path.exists(tmp_video_path):
                os.remove(tmp_video_path)
            raise HTTPException(status_code=500, detail=f"Failed to fetch remote video: {e}")

    if not os.path.exists(video_path):
        if tmp_video_path and os.path.exists(tmp_video_path):
            os.remove(tmp_video_path)
        raise HTTPException(status_code=404, detail="Video file not found or failed to download.")
        
    try:
        # Load Client Secrets from Env or Local File
        client_secrets_file = os.path.join(os.getcwd(), "client_secrets.json")
        env_secrets = os.environ.get("YOUTUBE_CLIENT_SECRETS_JSON")
        
        tmp_secrets_path = None
        
        if env_secrets:
            # Write env secrets to a temp file
            fd, tmp_secrets_path = tempfile.mkstemp(suffix=".json")
            os.close(fd)
            with open(tmp_secrets_path, "w") as f:
                f.write(env_secrets)
            client_secrets_file = tmp_secrets_path
        
        if not os.path.exists(client_secrets_file):
            logger.warning("client_secrets.json not found (locally or via env). Returning mock success for now.")
            return {
                "success": True,
                "youtube_url": "https://youtube.com/watch?v=mock_video_id",
                "message": "Mock upload successful. Please configure client_secrets.json to enable real YouTube upload."
            }

        scopes = ["https://www.googleapis.com/auth/youtube.upload"]
        
        flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
            client_secrets_file, scopes)
        credentials = flow.run_local_server(port=0)
        
        youtube = googleapiclient.discovery.build(
            "youtube", "v3", credentials=credentials)

        request_body = {
            "snippet": {
                "categoryId": "1", # Film & Animation
                "title": request.title,
                "description": request.synopsis,
                "tags": ["sonikoma", "webtoon", "manga", "comic"]
            },
            "status": {
                "privacyStatus": "unlisted"
            }
        }

        media_file = MediaFileUpload(video_path, chunksize=-1, resumable=True)

        logger.info("Starting YouTube upload...")
        insert_request = youtube.videos().insert(
            part="snippet,status",
            body=request_body,
            media_body=media_file
        )
        
        response = insert_request.execute()
        
        video_id = response.get("id")
        logger.info(f"Upload complete! Video ID: {video_id}")
        
        return {
            "success": True,
            "youtube_url": f"https://youtube.com/watch?v={video_id}",
            "message": "Successfully uploaded to YouTube!"
        }

    except Exception as e:
        logger.error(f"YouTube export failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp files
        try:
            if 'tmp_video_path' in locals() and tmp_video_path and os.path.exists(tmp_video_path):
                os.remove(tmp_video_path)
            if 'tmp_secrets_path' in locals() and tmp_secrets_path and os.path.exists(tmp_secrets_path):
                os.remove(tmp_secrets_path)
        except OSError:
            pass
