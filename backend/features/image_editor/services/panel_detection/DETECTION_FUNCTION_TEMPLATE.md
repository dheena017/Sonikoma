# Panel & Vision Detection Function Engineering Template

Standard engineering rules, lifecycle stages, and copy-pasteable templates for all comic panel, character, and speech bubble detection functions.

---

## 1. Core Engineering Rules

| Rule | Principle | Good Practice | Anti-Pattern |
| :--- | :--- | :--- | :--- |
| **Rule 1: If-First Validation** | Use `if` checks for predictable properties (file existence, channel mode, dimensions). | `if os.path.exists(path):` | `try: open(path) except:` |
| **Rule 2: Selective `try...except`** | Only wrap unpredictable operations (network downloads, GPU tensor inference, hardware I/O). | Wrapping `model.predict()` | Wrapping entire functions blindly |
| **Rule 3: No Silent Failures** | Never write empty `except: pass`. Always log the component and error message. | `logger.debug(f"[Detector] {e}")` | `except: pass` |
| **Rule 4: Input Normalization** | Always sanitize inputs at the very top (e.g. force 3-channel RGB for OpenCV). | `if img.mode != "RGB": img = img.convert("RGB")` | Passing RGBA directly to OpenCV `cvtColor` |
| **Rule 5: Guaranteed Return Types** | Every code path must return the expected type (e.g., `List[T]` or `None`), never a random type. | `return []` on error | `return False` or `return ""` |
| **Rule 6: Fallback Polygons** | Always provide a 4-point rectangle fallback polygon if contour has < 3 vertices. | `poly = [[x, y], [x+w, y], [x+w, y+h], [x, y+h]]` | Returning `polygon=None` without checking |

---

## 2. The 4-Stage Function Anatomy

Every vision and panel detection function must be structured into four sequential stages:

```
Stage 1: Header, Typing & Docstrings
         ├── Strict type hints for all arguments and return values
         └── Docstring documenting Args, Returns, and Fallbacks
Stage 2: Guard Clauses & Input Normalization
         ├── Fast-reject empty/corrupt inputs using 'if' checks
         └── Normalize color space (PIL convert('RGB')) and data types
Stage 3: Core Algorithm & Selective Error Handling
         ├── Heuristic checks, geometric filters, or neural network inference
         └── Targeted try/except strictly around external/model calls
Stage 4: Structured Output & Traceable Logging
         ├── Assign sequential reading order and unique IDs
         └── Return standardized schema items with logger.info summary
```

---

## 3. Template A: Model Loader (Singleton / Lazy Loading)

Use this pattern when loading neural network models (e.g. YOLO, SAM, ResNet):

```python
_yolo_model: Optional[Any] = None


def get_yolo_model_example() -> Optional[Any]:
    """
    Lazily loads and returns the neural network model instance.
    Uses in-memory caching to ensure instant server startup and zero memory waste.
    """
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model

    models_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "models")
    )

    # 1. Check local custom fine-tuned model (if exists)
    custom_weights = os.path.join(models_dir, "custom_finetuned.pt")
    if os.path.exists(custom_weights):
        try:
            logger.info(f"[Detector] Loading custom fine-tuned model: {custom_weights}")
            _yolo_model = YOLO(custom_weights)
            return _yolo_model
        except Exception as e:
            logger.debug(f"[Detector] Local model failed ({e}), trying remote candidates...")

    # 2. Remote Hugging Face model candidates
    hf_sources = [
        ("org/model-repo-id", "model.pt", "primary segmentation model"),
        ("org/fallback-repo-id", "fallback.pt", "secondary detection model"),
    ]
    for repo_id, filename, desc in hf_sources:
        try:
            path = hf_hub_download(repo_id=repo_id, filename=filename)
            _yolo_model = YOLO(path)
            logger.info(f"[Detector] Loaded {desc} model successfully")
            return _yolo_model
        except Exception as e:
            logger.debug(f"[Detector] {desc} unavailable ({e}), trying next...")

    # 3. Generic fallback
    local_generic = os.path.join(models_dir, "generic.pt")
    target = local_generic if os.path.exists(local_generic) else "generic.pt"
    try:
        _yolo_model = YOLO(target)
        logger.info(f"[Detector] Loaded generic fallback model: {target}")
        return _yolo_model
    except Exception as e:
        logger.warning(f"[Detector] All model sources failed ({e}). Operating in heuristic mode.")
        _yolo_model = None
        return None
```

---

## 4. Template B: Heuristic / OpenCV Contour Detector

Use this pattern for algorithmic image processing (e.g. Chat UI detector, Manga grid detector):

```python
def detect_contours_example(
    pil_img: Image.Image,
    min_confidence: float = 0.88,
) -> List[SpeechBubbleItem]:
    """
    Detects visual entities using color-space thresholding and contour analysis.

    Args:
        pil_img (Image.Image): Input PIL Image.
        min_confidence (float, optional): Assigned entity confidence. Defaults to 0.88.

    Returns:
        List[SpeechBubbleItem]: Detected entities with bounding boxes and polygons.
    """
    # ── Stage 1: Input Normalization & Guard Clauses ────────────────────────
    if pil_img is None or pil_img.size[0] < 10 or pil_img.size[1] < 10:
        return []

    # Ensure 3-channel RGB image for OpenCV conversions
    if pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")

    # ── Stage 2: Feature Extraction ─────────────────────────────────────────
    try:
        cv_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        h, w, _ = cv_bgr.shape
        hsv = cv2.cvtColor(cv_bgr, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(cv_bgr, cv2.COLOR_BGR2GRAY)

        # ── Stage 3: Core Algorithmic Processing ────────────────────────────
        mask = cv2.inRange(
            hsv,
            np.array([95, 55, 80], dtype=np.uint8),
            np.array([130, 255, 255], dtype=np.uint8),
        )
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        cleaned = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        cnts, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        found_items: List[SpeechBubbleItem] = []
        min_area = int(w * h * 0.0008)
        max_area = int(w * h * 0.20)
        idx = 1

        for c in cnts:
            area = cv2.contourArea(c)
            if area < min_area or area > max_area:
                continue

            x, y, bw, bh = cv2.boundingRect(c)
            aspect = bw / float(max(1, bh))
            if 1.0 <= aspect <= 7.0 and bw <= int(w * 0.85):
                patch = gray[y:y + bh, x:x + bw]
                if patch.size > 0 and float(np.std(patch)) >= 3.5:
                    # Provide polygon with 4-point rectangle fallback
                    poly = (
                        [[int(pt[0][0]), int(pt[0][1])] for pt in c]
                        if len(c) >= 3
                        else [[x, y], [x + bw, y], [x + bw, y + bh], [x, y + bh]]
                    )
                    found_items.append(SpeechBubbleItem(
                        bubble_id=f"item_{idx}",
                        label=EntityLabel.BUBBLE_SPEECH.value,
                        category=EntityCategory.TEXT.value,
                        sub_type="chat_message",
                        x=x,
                        y=y,
                        width=bw,
                        height=bh,
                        polygon=poly,
                        dialogue_text=None,
                        confidence=min_confidence,
                        reading_order=idx,
                        is_bound=False,
                    ))
                    idx += 1

        # ── Stage 4: Output & Logging ───────────────────────────────────────
        logger.debug(f"[Detector] Detected {len(found_items)} item(s)")
        return found_items

    except Exception as e:
        logger.debug(f"[Detector] Processing failed ({e})")
        return []
```

---

## 5. Template C: Deep Learning Inference Detector

Use this pattern for primary neural inference with resolution normalization and fallback:

```python
def detect_deep_learning_example(
    image_input: Any,
    conf_threshold: float = 0.25,
) -> List[SpeechBubbleItem]:
    """
    Executes YOLO semantic inference on comic strips with resolution normalization.

    Args:
        image_input (Any): Comic frame input (PIL Image or raw bytes).
        conf_threshold (float, optional): Confidence floor. Defaults to 0.25.

    Returns:
        List[SpeechBubbleItem]: Detected entities sorted in reading order.
    """
    # ── Stage 1: Input Normalization & Guard Clauses ────────────────────────
    if image_input is None:
        return []

    if isinstance(image_input, Image.Image):
        pil_img = image_input.convert("RGB") if image_input.mode != "RGB" else image_input
    elif isinstance(image_input, bytes):
        pil_img = Image.open(io.BytesIO(image_input)).convert("RGB")
    else:
        raise ValueError("Invalid input: expected bytes or PIL.Image")

    img_w, img_h = pil_img.size
    if img_w < 10 or img_h < 10:
        return []

    # ── Stage 2: Resolution Normalization & Inference ────────────────────────
    model = get_yolo_speech_bubble_model()
    results = []
    scale_factor = 1.0

    if model is not None:
        try:
            # Scale narrow webtoon strips to match receptive field (~800px)
            if img_w < 600:
                target_w = 800
                scale_factor = target_w / float(img_w)
                infer_img = pil_img.resize((target_w, int(img_h * scale_factor)), Image.Resampling.LANCZOS)
            elif img_w > 1800:
                target_w = 1200
                scale_factor = target_w / float(img_w)
                infer_img = pil_img.resize((target_w, int(img_h * scale_factor)), Image.Resampling.LANCZOS)
            else:
                infer_img = pil_img

            results = model.predict(source=infer_img, conf=conf_threshold, verbose=False)
        except Exception as e:
            logger.warning(f"[Detector] Inference error ({e}), proceeding to fallbacks...")
            results = []

    # ── Stage 3: Entity Extraction & Content Verification ────────────────────
    gray_np = np.array(pil_img.convert("L"))
    entities: List[SpeechBubbleItem] = []
    bubble_counter = 1

    if results:
        for r in results:
            boxes_obj = getattr(r, "boxes", None)
            masks_obj = getattr(r, "masks", None)
            boxes = boxes_obj.xyxy.cpu().numpy() if (boxes_obj is not None and hasattr(boxes_obj, "xyxy")) else []
            confs = boxes_obj.conf.cpu().numpy() if (boxes_obj is not None and hasattr(boxes_obj, "conf")) else []
            masks = masks_obj.xy if (masks_obj is not None and hasattr(masks_obj, "xy")) else []

            for idx, (box, conf) in enumerate(zip(boxes, confs)):
                rx1, ry1, rx2, ry2 = [float(v) for v in box]
                x1 = int(rx1 / scale_factor) if scale_factor != 1.0 else int(rx1)
                y1 = int(ry1 / scale_factor) if scale_factor != 1.0 else int(ry1)
                x2 = int(rx2 / scale_factor) if scale_factor != 1.0 else int(rx2)
                y2 = int(ry2 / scale_factor) if scale_factor != 1.0 else int(ry2)
                w, h = max(4, x2 - x1), max(4, y2 - y1)

                polygon = None
                if idx < len(masks) and masks[idx] is not None and len(masks[idx]) > 2:
                    polygon = (
                        [[int(pt[0] / scale_factor), int(pt[1] / scale_factor)] for pt in masks[idx]]
                        if scale_factor != 1.0
                        else [[int(pt[0]), int(pt[1])] for pt in masks[idx]]
                    )
                if polygon is None:
                    polygon = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]

                # Content verification (check for text lettering)
                sub_patch = gray_np[y1:y1 + h, x1:x1 + w]
                if sub_patch.size == 0 or (float(np.std(sub_patch)) < 2.0 and conf < 0.60):
                    continue

                entities.append(SpeechBubbleItem(
                    bubble_id=f"bubble_{bubble_counter}",
                    label=EntityLabel.BUBBLE_SPEECH.value,
                    category=EntityCategory.TEXT.value,
                    sub_type="speech",
                    x=x1,
                    y=y1,
                    width=w,
                    height=h,
                    polygon=polygon,
                    dialogue_text=None,
                    confidence=round(float(conf), 2),
                    reading_order=bubble_counter,
                    is_bound=False,
                ))
                bubble_counter += 1

    # ── Stage 4: Sorting, Reading Order & Return ─────────────────────────────
    entities.sort(key=lambda b: (b.y, b.x))
    for i, b in enumerate(entities, start=1):
        b.bubble_id = f"bubble_{i}"
        b.reading_order = i

    logger.info(f"[Detector] Detected {len(entities)} entity/entities")
    return entities
```

---

## 6. Pre-Commit Checklist for Detection Functions

Before committing changes to any detection function, verify:
- [ ] **Input Type Guard**: Accepts both `PIL.Image` and `bytes` without crashing.
- [ ] **RGB Mode**: Converted via `.convert("RGB")` before converting to NumPy / OpenCV.
- [ ] **No Naked `except:`**: All exception blocks name `except Exception as e:` and log details.
- [ ] **Polygon Guarantee**: Always provides a 4-point fallback box polygon if contour has < 3 vertices.
- [ ] **Sequential Order**: Entities are sorted `(b.y, b.x)` and indexed sequentially (`reading_order = i`).
- [ ] **PEP 8 Compliance**: Clean indentation, max line length under 100 characters.
