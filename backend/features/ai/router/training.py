"""
AI Model Training API Router.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Literal
from pydantic import BaseModel
from features.ai.training import (
    train_bubble_model,
    prep_training_data,
    check_training_status,
)

router = APIRouter(prefix="/training", tags=["AI Model Training"])


class PrepDatasetRequest(BaseModel):
    box_file: str
    output_folder: str
    test_ratio: float = 0.2


class TrainModelRequest(BaseModel):
    dataset_folder: str
    target: Literal["bubble", "panel"] = "bubble"
    rounds: int = 50
    batch_size: int = 16


@router.post("/prep")
def endpoint_prep_dataset(req: PrepDatasetRequest) -> Dict[str, Any]:
    """Prepares and validates comic box coordinates for YOLO training."""
    try:
        return prep_training_data(
            box_file=req.box_file,
            output_folder=req.output_folder,
            test_ratio=req.test_ratio,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train")
async def endpoint_train_model(req: TrainModelRequest) -> Dict[str, Any]:
    """Launches training for a custom YOLO comic detection model."""
    try:
        return await train_bubble_model(
            dataset_folder=req.dataset_folder,
            target=req.target,
            rounds=req.rounds,
            batch_size=req.batch_size,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{job_id}")
def endpoint_training_status(job_id: str) -> Dict[str, Any]:
    """Returns training progress, loss scores, and metrics."""
    return check_training_status(job_id)


__all__ = ["router"]
