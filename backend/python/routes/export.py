import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

# Boilerplate imports for YouTube API
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
    
    filename = request.video_url.split("/")[-1]
    video_path = os.path.join(os.getcwd(), "public", "videos", filename)
    
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found on server.")
        
    try:
        client_secrets_file = os.path.join(os.getcwd(), "client_secrets.json")
        if not os.path.exists(client_secrets_file):
            logger.warning("client_secrets.json not found. Returning mock success for now.")
            return {
                "success": True,
                "youtube_url": "https://youtube.com/watch?v=mock_video_id",
                "message": "Mock upload successful. Please add client_secrets.json to enable real YouTube upload."
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
