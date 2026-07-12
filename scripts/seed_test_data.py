import os
import sqlite3
import bcrypt
import logging
import json
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_test_data")

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_DIR = os.path.join(PROJECT_ROOT, "backend", "database")
DB_PATH = os.path.join(DB_DIR, "webtoon_local.db")
SCHEMA_PATH = os.path.join(DB_DIR, "schema.sql")


def ensure_db_schema():
    """Ensure the SQLite database file and tables are initialized from schema.sql."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if cursor.fetchone() is None:
            logger.info("Database file empty/missing. Bootstrapping schema from schema.sql...")
            with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
                schema_sql = f.read()
            conn.executescript(schema_sql)
            logger.info("Database schema applied successfully.")
        else:
            logger.info("Database schema is already present.")
    finally:
        conn.close()


def _dt(days_ago=0, hours=0, minutes=0, base="2026-06-20"):
    """Helper to generate datetime strings relative to a base date."""
    dt = datetime.strptime(base, "%Y-%m-%d") - timedelta(days=days_ago, hours=hours, minutes=minutes)
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def seed_data():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON")

    try:
        # ── 1. Clear ALL tables ───────────────────────────────────────────────
        tables = [
            "panels", "chapters", "series", "user_sessions", "user_audit_logs",
            "user_invoices", "user_api_keys", "token_usage_logs",
            "system_announcements", "platform_settings",
            "youtube_publications", "youtube_profiles", "youtube_credentials",
            "users", "scrape_sessions", "edit_history",
        ]
        logger.info("Clearing existing records...")
        for table in tables:
            try:
                cursor.execute(f"DELETE FROM {table}")
            except Exception:
                pass  # table might not exist yet

        # ── 2. Password hash (shared) ─────────────────────────────────────────
        logger.info("Generating password hashes...")
        pw = "password123".encode("utf-8")[:72]
        pw_hash = bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")

        # ── 3. Users ──────────────────────────────────────────────────────────
        logger.info("Seeding users...")
        users = [
            (
                "user_testuser1", "testuser1", "creator@sonikoma.com", pw_hash,
                '{"theme":"dark","autoSave":true,"volume":0.8}',
                "https://api.dicebear.com/7.x/avataaars/svg?seed=testuser1",
                "Test User One", "creator",
                "Casual webtoon compiler and creator testing the Sonikoma suite.",
                1, "en", "[]", 1250, None, "[]", 0,
                '{"google":true,"github":false,"discord":false}',
                _dt(30), _dt(1),
            ),
            (
                "user_creator_pro", "creator_pro", "pro@gmail.com", pw_hash,
                '{"theme":"cyberpunk","autoSave":true,"volume":1.0}',
                "https://api.dicebear.com/7.x/avataaars/svg?seed=creator_pro",
                "Sarah Jenkins (Pro)", "director",
                "Professional animator and comic creator pushing Webtoons to cinematic heights.",
                1, "en",
                '["https://behance.net/sarah","https://youtube.com/sarahanimations"]',
                4850, _dt(1), '["badge_pro_creator","badge_early_bird"]', 1,
                '{"google":true,"github":true,"discord":true}',
                _dt(25), _dt(0),
            ),
            (
                "user_editor_test", "editor_test", "editor@gmail.com", pw_hash,
                '{"theme":"light","autoSave":false,"volume":0.5}',
                "https://api.dicebear.com/7.x/avataaars/svg?seed=editor_test",
                "Alex Rivera", "editor",
                "Collaborative editor testing timeline synchronization and audio syncing.",
                0, "es", "[]", 350, None, "[]", 0,
                '{"google":false,"github":false,"discord":false}',
                _dt(20), _dt(5),
            ),
            (
                "user_manga_fan", "manga_fan", "manga@hotmail.com", pw_hash,
                '{"theme":"dark","autoSave":true,"volume":0.6}',
                "https://api.dicebear.com/7.x/avataaars/svg?seed=manga_fan",
                "Kenji Tanaka", "viewer",
                "Manga enthusiast exploring Sonikoma as a video-compilation tool.",
                1, "ja", "[]", 200, None, "[]", 0,
                '{"google":false,"github":false,"discord":true}',
                _dt(15), _dt(3),
            ),
            (
                "user_anim_studio", "anim_studio", "studio@animx.io", pw_hash,
                '{"theme":"dark","autoSave":true,"volume":1.0}',
                "https://api.dicebear.com/7.x/avataaars/svg?seed=anim_studio",
                "AnimX Studio", "director",
                "Studio account for batch-rendering multiple webtoon series into reels.",
                1, "en",
                '["https://animx.io","https://twitter.com/animxstudio"]',
                9999, _dt(1), '["badge_studio_tier","badge_volume_creator","badge_early_bird"]', 1,
                '{"google":true,"github":true,"discord":true}',
                _dt(60), _dt(0),
            ),
            (
                "user_free_trial", "free_trial", "trial@example.com", pw_hash,
                '{"theme":"light","autoSave":false,"volume":0.3}',
                "https://api.dicebear.com/7.x/avataaars/svg?seed=free_trial",
                "Trial User", "viewer",
                "Free-tier trial user with limited credits, testing the basic pipeline.",
                0, "en", "[]", 0, None, "[]", 0,
                '{"google":false,"github":false,"discord":false}',
                _dt(2), _dt(2),
            ),
        ]
        cursor.executemany("""
            INSERT INTO users (
                id, username, email, password_hash, preferences, avatar_url,
                full_name, creator_role, bio, newsletter, language, portfolio_links,
                credits, last_claimed_date, unlocked_rewards, mfa_enabled, social_connections,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, users)

        # ── 4. Series ─────────────────────────────────────────────────────────
        logger.info("Seeding series...")
        series = [
            ("ser_lore_olympus", "user_testuser1", "Lore Olympus",
             "Rachel Smythe",
             "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop",
             "romance",
             "A modern retelling of one of mythology's greatest stories: the taking of Persephone.",
             _dt(30)),
            ("ser_tower_of_god", "user_testuser1", "Tower of God",
             "SIU",
             "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&auto=format&fit=crop",
             "action",
             "What do you desire? Authority and power? Find it all at the top of the Tower.",
             _dt(25)),
            ("ser_omniscient_reader", "user_creator_pro", "Omniscient Reader",
             "sing N song",
             "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop",
             "fantasy",
             "Only I know the end of this world. Survival begins the day the novel becomes reality.",
             _dt(25)),
            ("ser_solo_leveling", "user_creator_pro", "Solo Leveling",
             "Chugong",
             "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop",
             "action",
             "The weakest hunter of all mankind will face the world's deadliest dungeon raid.",
             _dt(20)),
            ("ser_true_beauty", "user_anim_studio", "True Beauty",
             "Yaongyi",
             "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop",
             "romance",
             "A girl who masterfully hides her plain face through the power of makeup.",
             _dt(18)),
            ("ser_noblesse", "user_anim_studio", "Noblesse",
             "Son Jeho",
             "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=300&auto=format&fit=crop",
             "action",
             "A powerful Noble awakens in the modern era after a 820-year slumber.",
             _dt(15)),
            ("ser_unordinary", "user_manga_fan", "unOrdinary",
             "uru-chan",
             "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&auto=format&fit=crop",
             "action",
             "In a world of superpowers, a school-age boy with no ability must survive.",
             _dt(10)),
        ]
        cursor.executemany("""
            INSERT INTO series (id, user_id, title, author, cover_image, genre, synopsis, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, series)

        # ── 5. Chapters ───────────────────────────────────────────────────────
        logger.info("Seeding chapters...")
        chapters = [
            # Lore Olympus
            ("chap_lore_c1", "ser_lore_olympus", "Chapter 1",
             "https://www.webtoons.com/en/romance/lore-olympus/episode-1/viewer?title_no=1320&episode_no=1",
             "completed", 3,
             "https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-in-the-forest-43189-large.mp4",
             _dt(29), _dt(28)),
            ("chap_lore_c2", "ser_lore_olympus", "Chapter 2",
             "https://www.webtoons.com/en/romance/lore-olympus/episode-2/viewer?title_no=1320&episode_no=2",
             "completed", 4, None, _dt(22), _dt(21)),
            ("chap_lore_c3", "ser_lore_olympus", "Chapter 3",
             "https://www.webtoons.com/en/romance/lore-olympus/episode-3/viewer?title_no=1320&episode_no=3",
             "processing", 0, None, _dt(10), _dt(10)),

            # Tower of God
            ("chap_tog_c1", "ser_tower_of_god", "Chapter 1",
             "https://www.webtoons.com/en/fantasy/tower-of-god/season-1-ep-0/viewer?title_no=95&episode_no=1",
             "completed", 4,
             "https://assets.mixkit.co/videos/preview/mixkit-flying-through-clouds-in-a-sunny-sky-42861-large.mp4",
             _dt(24), _dt(23)),
            ("chap_tog_c2", "ser_tower_of_god", "Chapter 2",
             "https://www.webtoons.com/en/fantasy/tower-of-god/season-1-ep-1/viewer?title_no=95&episode_no=2",
             "completed", 3, None, _dt(20), _dt(19)),
            ("chap_tog_c3", "ser_tower_of_god", "Chapter 3",
             "https://www.webtoons.com/en/fantasy/tower-of-god/season-1-ep-2/viewer?title_no=95&episode_no=3",
             "failed", 0, None, _dt(15), _dt(14)),
            ("chap_tog_c4", "ser_tower_of_god", "Chapter 4",
             "https://www.webtoons.com/en/fantasy/tower-of-god/season-1-ep-3/viewer?title_no=95&episode_no=4",
             "pending", 0, None, _dt(5), _dt(5)),

            # Omniscient Reader
            ("chap_or_c1", "ser_omniscient_reader", "Chapter 1",
             "https://www.webtoons.com/en/action/omniscient-reader/episode-1/viewer?title_no=2154&episode_no=1",
             "completed", 5,
             "https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-a-window-pane-41617-large.mp4",
             _dt(24), _dt(23)),
            ("chap_or_c2", "ser_omniscient_reader", "Chapter 2",
             "https://www.webtoons.com/en/action/omniscient-reader/episode-2/viewer?title_no=2154&episode_no=2",
             "completed", 4, None, _dt(18), _dt(17)),
            ("chap_or_c3", "ser_omniscient_reader", "Chapter 3",
             "https://www.webtoons.com/en/action/omniscient-reader/episode-3/viewer?title_no=2154&episode_no=3",
             "pending", 0, None, _dt(3), _dt(3)),

            # Solo Leveling
            ("chap_sl_c1", "ser_solo_leveling", "Chapter 1",
             "https://www.webtoons.com/en/action/solo-leveling/episode-1/viewer?title_no=1&episode_no=1",
             "completed", 6, None, _dt(19), _dt(18)),
            ("chap_sl_c2", "ser_solo_leveling", "Chapter 2",
             "https://www.webtoons.com/en/action/solo-leveling/episode-2/viewer?title_no=1&episode_no=2",
             "processing", 0, None, _dt(4), _dt(4)),

            # True Beauty
            ("chap_tb_c1", "ser_true_beauty", "Chapter 1",
             "https://www.webtoons.com/en/romance/true-beauty/episode-1/viewer?title_no=1436&episode_no=1",
             "completed", 4, None, _dt(17), _dt(16)),
            ("chap_tb_c2", "ser_true_beauty", "Chapter 2",
             "https://www.webtoons.com/en/romance/true-beauty/episode-2/viewer?title_no=1436&episode_no=2",
             "pending", 0, None, _dt(6), _dt(6)),

            # Noblesse
            ("chap_nob_c1", "ser_noblesse", "Chapter 1",
             "https://www.webtoons.com/en/action/noblesse/episode-1/viewer?title_no=87&episode_no=1",
             "completed", 5, None, _dt(14), _dt(13)),

            # unOrdinary
            ("chap_uno_c1", "ser_unordinary", "Chapter 1",
             "https://www.webtoons.com/en/action/unordinary/episode-1/viewer?title_no=679&episode_no=1",
             "completed", 3, None, _dt(9), _dt(8)),
            ("chap_uno_c2", "ser_unordinary", "Chapter 2",
             "https://www.webtoons.com/en/action/unordinary/episode-2/viewer?title_no=679&episode_no=2",
             "failed", 0, None, _dt(4), _dt(3)),
        ]
        cursor.executemany("""
            INSERT INTO chapters (
                id, series_id, episode_number, original_url, status,
                panels_count, video_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, chapters)

        # ── 6. Panels ─────────────────────────────────────────────────────────
        logger.info("Seeding panels...")
        _img = [
            "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop",
        ]

        def _panel(chap, idx, text, sfx, dur, motion, desc,
                   br=None, ct=None, sat=None, gray=0, flt=None,
                   bub=None, sens=None, dil=None, inr=None, dstyle=None,
                   created=None):
            img = _img[idx % len(_img)]
            return (chap, idx, img, img, text, sfx, dur, motion, desc,
                    br, ct, sat, gray, flt, bub, sens, dil, inr, dstyle,
                    created or _dt(20))

        panels = [
            # ── Lore Olympus C1
            _panel("chap_lore_c1", 0, "Welcome to the underworld!", "WHOOSH", 4.5, "zoom_in",
                   "Persephone gazes at the dark obsidian castle.", 10, 5, 0, 0, "cyberpunk", created=_dt(29)),
            _panel("chap_lore_c1", 1, "Wait, who is that in the shadows?", "SHINE", 3.5, "pan_right",
                   "Hades in a sharp business suit with glowing red eyes.", created=_dt(29)),
            _panel("chap_lore_c1", 2, "Let our story begin.", "POP", 5.0, "zoom_out",
                   "Persephone and Hades meet at the banquet.", 0, 0, 0, 0, "vintage", created=_dt(29)),

            # ── Lore Olympus C2
            _panel("chap_lore_c2", 0, "Are you lost, little goddess?", "ECHO", 4.0, "static",
                   "Hades looking down at Persephone near the gates.", created=_dt(22)),
            _panel("chap_lore_c2", 1, "I never get lost. I choose alternate routes.", "CHIME", 3.0, "pan_left",
                   "Persephone lifting her chin defiantly.", created=_dt(22)),
            _panel("chap_lore_c2", 2, "A mortal with a goddess' attitude.", "WIND", 5.0, "zoom_in",
                   "Hades and Persephone walking through fields of glowing flowers.", 5, 5, 10, 0, None, created=_dt(22)),
            _panel("chap_lore_c2", 3, "The underworld will never be the same.", "HEARTBEAT", 6.0, "zoom_out",
                   "Sweeping view of the dark kingdom lit by Persephone's aura.", created=_dt(22)),

            # ── Tower of God C1
            _panel("chap_tog_c1", 0, "Bam! Why are you running away?!", "CRASH", 4.0, "pan_left",
                   "Rachel running toward massive iron gates.", None, None, None, 0, None, "manual", 0.85, 4.0, 15, "comic", created=_dt(24)),
            _panel("chap_tog_c1", 1, "I must reach the stars.", "WIND", 5.5, "zoom_in",
                   "Rachel fading into a golden portal.", created=_dt(24)),
            _panel("chap_tog_c1", 2, "No! Rachel!", "HEARTBEAT", 4.5, "zoom_out",
                   "Bam reaching out as the gate slams shut.", 5, -5, 0, 0, None, created=_dt(24)),
            _panel("chap_tog_c1", 3, "Where am I? Who are you?", "ECHO", 5.0, "static",
                   "Bam waking on stone in front of Headon.", None, None, None, 0, "noir", created=_dt(24)),

            # ── Tower of God C2
            _panel("chap_tog_c2", 0, "Pass the test and you shall climb.", "ROAR", 5.0, "zoom_in",
                   "Headon presenting the black steel ball.", created=_dt(20)),
            _panel("chap_tog_c2", 1, "I'll do it, for Rachel.", "DETERMINATION", 4.5, "static",
                   "Bam clenching his fist and stepping forward.", 10, 0, 0, 0, None, created=_dt(20)),
            _panel("chap_tog_c2", 2, "The test begins. Survive.", "CRASH", 6.5, "pan_right",
                   "Bam sprinting across the floor toward the giant eel.", created=_dt(20)),

            # ── Omniscient Reader C1
            _panel("chap_or_c1", 0, "I was reading the final chapter.", "KEYBOARD_TAP", 4.0, "static",
                   "Dokja staring at his phone on a crowded subway.", created=_dt(24)),
            _panel("chap_or_c1", 1, "The lights flickered. The train stopped.", "SPARK", 4.5, "pan_right",
                   "Sparks flying from ceiling lights as train shakes.", 20, 20, -10, 0, None, created=_dt(24)),
            _panel("chap_or_c1", 2, "[Free service of planetary system 8612 has terminated.]",
                   "STATIC_BUZZ", 6.0, "zoom_in",
                   "Holographic system message appears in mid-air.", None, None, None, 0, "cyberpunk", created=_dt(24)),
            _panel("chap_or_c1", 3, "[The main scenario starts now.]", "EXPLOSION", 5.0, "zoom_out",
                   "The Dokkaebi appears before the terrified passengers.", created=_dt(24)),
            _panel("chap_or_c1", 4, "This is the world I knew.", "DARK_HUM", 5.0, "pan_left",
                   "Dokja narrowing his eyes and bracing for the monsters.", None, None, None, 0, "noir", created=_dt(24)),

            # ── Omniscient Reader C2
            _panel("chap_or_c2", 0, "I am the only one who knows how this ends.", "STATIC_BUZZ", 5.0, "zoom_in",
                   "Dokja surrounded by frightened people in the broken subway.", created=_dt(18)),
            _panel("chap_or_c2", 1, "The first scenario: eliminate the enemy.", "CRASH", 6.5, "zoom_out",
                   "A massive monster breaking through the tunnel wall.", created=_dt(18)),
            _panel("chap_or_c2", 2, "Nobody believed the ending but me.", "ECHO", 4.0, "static",
                   "Dokja picking up a weapon left by a fallen police officer.", created=_dt(18)),
            _panel("chap_or_c2", 3, "Fight.", "EXPLOSION", 3.0, "pan_right",
                   "Dokja charging at the monster alone in the dark tunnel.", 5, 10, 5, 0, None, created=_dt(18)),

            # ── Solo Leveling C1
            _panel("chap_sl_c1", 0, "Sung Jinwoo, the weakest E-rank hunter.", "WIND", 4.0, "static",
                   "A thin young man standing behind a group of elite hunters.", created=_dt(19)),
            _panel("chap_sl_c1", 1, "Everyone enters the double dungeon.", "ECHO", 4.5, "pan_left",
                   "The hunters descending into an ancient underground ruin.", created=_dt(19)),
            _panel("chap_sl_c1", 2, "Something is wrong. This isn't a C-rank dungeon.", "HEARTBEAT", 5.0, "zoom_in",
                   "Stone statues covering every wall and ceiling, all turned toward the hunters.", 15, 5, 0, 0, "noir", created=_dt(19)),
            _panel("chap_sl_c1", 3, "The statues… they're moving!", "CRASH", 7.0, "zoom_out",
                   "Chaos erupting as the statues begin attacking.", created=_dt(19)),
            _panel("chap_sl_c1", 4, "I have to survive this alone.", "DETERMINATION", 5.0, "static",
                   "Jinwoo injured and alone, the only survivor.", created=_dt(19)),
            _panel("chap_sl_c1", 5, "[You have been selected as a Player.]", "STATIC_BUZZ", 6.0, "zoom_in",
                   "A glowing blue quest window appearing before dying Jinwoo.", None, None, None, 0, "cyberpunk", created=_dt(19)),

            # ── True Beauty C1
            _panel("chap_tb_c1", 0, "Without makeup, I'm nothing.", "WIND", 3.5, "static",
                   "Jugyeong without makeup, looking plain in the mirror.", created=_dt(17)),
            _panel("chap_tb_c1", 1, "But with it, I'm everything.", "SHINE", 4.5, "zoom_in",
                   "Jugyeong fully made up, radiant and beautiful.", 5, 5, 10, 0, None, created=_dt(17)),
            _panel("chap_tb_c1", 2, "New school. New identity. New me.", "CHIME", 4.0, "pan_right",
                   "Jugyeong confidently walking into a new school entrance.", created=_dt(17)),
            _panel("chap_tb_c1", 3, "He saw me. Without my makeup.", "HEARTBEAT", 6.0, "zoom_out",
                   "Suho and Jugyeong's eyes meeting across a dark library.", created=_dt(17)),

            # ── Noblesse C1
            _panel("chap_nob_c1", 0, "820 years of slumber ends today.", "DARK_HUM", 5.0, "static",
                   "Cadis rising from a stone coffin in a darkened chamber.", 0, 0, 0, 0, "noir", created=_dt(14)),
            _panel("chap_nob_c1", 1, "What is this strange new world?", "ECHO", 4.5, "pan_left",
                   "Cadis walking through modern Seoul, confused by skyscrapers.", created=_dt(14)),
            _panel("chap_nob_c1", 2, "Frankenstein. My loyal servant.", "ROAR", 5.0, "zoom_in",
                   "Cadis and Frankenstein reuniting after centuries.", 5, 5, 0, 0, None, created=_dt(14)),
            _panel("chap_nob_c1", 3, "I will protect these humans.", "WIND", 6.0, "zoom_out",
                   "Cadis overlooking the city from a rooftop at night.", created=_dt(14)),
            _panel("chap_nob_c1", 4, "Let's enrol in high school.", "CHIME", 3.5, "static",
                   "Cadis and Frankenstein standing outside a high school gate.", created=_dt(14)),

            # ── unOrdinary C1
            _panel("chap_uno_c1", 0, "In this world, ability is everything.", "STATIC_BUZZ", 4.0, "static",
                   "A high-school hallway, students casually using superpowers.", None, None, None, 0, "cyberpunk", created=_dt(9)),
            _panel("chap_uno_c1", 1, "John Doe. Cripple. Bottom of the hierarchy.", "WIND", 4.5, "pan_left",
                   "John sitting alone at a cafeteria table, ignored by everyone.", created=_dt(9)),
            _panel("chap_uno_c1", 2, "Keep your head down.", "ECHO", 3.5, "static",
                   "Seraphina walking past John without a glance.", created=_dt(9)),
        ]
        cursor.executemany("""
            INSERT INTO panels (
                chapter_id, panel_index, image_url, original_url, speech_text, sfx,
                duration, motion_type, visual_description, brightness, contrast, saturation,
                grayscale, filter_preset, bubble_method, bubble_sensitivity, bubble_dilation,
                inpaint_radius, detection_style, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, panels)

        # ── 7. Scrape Sessions ─────────────────────────────────────────────────
        logger.info("Seeding scrape sessions cache...")
        scrape_sessions = [
            ("https://www.webtoons.com/en/romance/lore-olympus/episode-1/viewer?title_no=1320&episode_no=1",
             '["https://example.com/lore1_1.jpg","https://example.com/lore1_2.jpg","https://example.com/lore1_3.jpg"]',
             3, _dt(29)),
            ("https://www.webtoons.com/en/fantasy/tower-of-god/season-1-ep-0/viewer?title_no=95&episode_no=1",
             '["https://example.com/tog1_1.jpg","https://example.com/tog1_2.jpg","https://example.com/tog1_3.jpg","https://example.com/tog1_4.jpg"]',
             4, _dt(24)),
            ("https://www.webtoons.com/en/action/omniscient-reader/episode-1/viewer?title_no=2154&episode_no=1",
             '["https://example.com/or1_1.jpg","https://example.com/or1_2.jpg","https://example.com/or1_3.jpg","https://example.com/or1_4.jpg","https://example.com/or1_5.jpg"]',
             5, _dt(24)),
            ("https://www.webtoons.com/en/action/solo-leveling/episode-1/viewer?title_no=1&episode_no=1",
             '["https://example.com/sl1_1.jpg","https://example.com/sl1_2.jpg","https://example.com/sl1_3.jpg","https://example.com/sl1_4.jpg","https://example.com/sl1_5.jpg","https://example.com/sl1_6.jpg"]',
             6, _dt(19)),
            ("https://www.webtoons.com/en/romance/true-beauty/episode-1/viewer?title_no=1436&episode_no=1",
             '["https://example.com/tb1_1.jpg","https://example.com/tb1_2.jpg","https://example.com/tb1_3.jpg","https://example.com/tb1_4.jpg"]',
             4, _dt(17)),
        ]
        cursor.executemany("""
            INSERT INTO scrape_sessions (url, image_urls, panel_count, scraped_at)
            VALUES (?, ?, ?, ?)
        """, scrape_sessions)

        # ── 8. Edit History ───────────────────────────────────────────────────
        logger.info("Seeding edit history...")
        edit_history = [
            ("https://example.com/cache/lore_c1_p0_crop.png",
             "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600", "crop", _dt(29)),
            ("https://example.com/cache/lore_c1_p0_clean.png",
             "https://example.com/cache/lore_c1_p0_crop.png", "bubble_remove", _dt(29)),
            ("https://example.com/cache/tog_c1_p0_crop.png",
             "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600", "crop", _dt(24)),
            ("https://example.com/cache/tog_c1_p2_merged.png",
             "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600", "merge", _dt(24)),
            ("https://example.com/cache/or_c1_p2_crop.png",
             "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600", "crop", _dt(24)),
            ("https://example.com/cache/sl_c1_p5_crop.png",
             "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600", "crop", _dt(19)),
            ("https://example.com/cache/sl_c1_p5_stitch.png",
             "https://example.com/cache/sl_c1_p5_crop.png", "stitch", _dt(19)),
        ]
        cursor.executemany("""
            INSERT INTO edit_history (edited_url, original_url, edit_type, created_at)
            VALUES (?, ?, ?, ?)
        """, edit_history)

        # ── 9. User Sessions ──────────────────────────────────────────────────
        logger.info("Seeding user sessions...")
        user_sessions = [
            ("sess_test111", "user_testuser1", "Chrome on Windows 11", "192.168.1.45", "New York, USA", 1, _dt(1)),
            ("sess_test222", "user_testuser1", "Safari on Apple iPhone", "172.56.21.99", "San Francisco, USA", 1, _dt(3)),
            ("sess_pro111", "user_creator_pro", "Firefox Dev Edition on Arch Linux", "84.22.100.12", "London, UK", 1, _dt(0)),
            ("sess_pro222", "user_creator_pro", "Chrome on macOS", "198.51.100.3", "Toronto, Canada", 0, _dt(10)),
            ("sess_studio1", "user_anim_studio", "Chrome on Windows 11", "203.0.113.50", "Tokyo, Japan", 1, _dt(0)),
            ("sess_studio2", "user_anim_studio", "Edge on Windows 11", "203.0.113.51", "Seoul, Korea", 0, _dt(5)),
            ("sess_manga1", "user_manga_fan", "Firefox on Ubuntu", "198.100.20.10", "Osaka, Japan", 1, _dt(2)),
            ("sess_editor1", "user_editor_test", "Chrome on Windows 10", "10.0.0.55", "Madrid, Spain", 0, _dt(7)),
        ]
        cursor.executemany("""
            INSERT INTO user_sessions (session_id, user_id, browser, ip, location, active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, user_sessions)

        # ── 10. Audit Logs ────────────────────────────────────────────────────
        logger.info("Seeding audit logs...")
        audit_logs = [
            ("user_testuser1", "User registration", "127.0.0.1", "Success", _dt(30)),
            ("user_testuser1", "Generated developer API key 'Local Dev Sandbox'", "192.168.1.45", "Success", _dt(29)),
            ("user_testuser1", "Failed login attempt (bad password)", "192.168.1.200", "Failed", _dt(20)),
            ("user_testuser1", "User login via Chrome on Windows 11", "192.168.1.45", "Success", _dt(1)),
            ("user_testuser1", "Exported video for Lore Olympus Chapter 1", "192.168.1.45", "Success", _dt(0, 12)),
            ("user_creator_pro", "User registration", "84.22.100.12", "Success", _dt(25)),
            ("user_creator_pro", "Unlocked achievement badge 'badge_pro_creator'", "84.22.100.12", "Success", _dt(20)),
            ("user_creator_pro", "Redeemed +1000 compute credits", "84.22.100.12", "Success", _dt(20)),
            ("user_creator_pro", "Activated Multi-Factor Authentication", "84.22.100.12", "Success", _dt(10)),
            ("user_creator_pro", "User login via Firefox on Arch Linux", "84.22.100.12", "Success", _dt(0)),
            ("user_anim_studio", "User registration", "203.0.113.50", "Success", _dt(60)),
            ("user_anim_studio", "Upgraded to Studio Tier", "203.0.113.50", "Success", _dt(30)),
            ("user_anim_studio", "Exported bulk 12 videos in batch", "203.0.113.50", "Success", _dt(5)),
            ("user_anim_studio", "User login via Chrome on Windows 11", "203.0.113.50", "Success", _dt(0)),
            ("user_editor_test", "User registration", "10.0.0.55", "Success", _dt(20)),
            ("user_editor_test", "Failed login attempt (expired session)", "10.0.0.55", "Failed", _dt(7)),
            ("user_manga_fan", "User registration", "198.100.20.10", "Success", _dt(15)),
            ("user_manga_fan", "User login via Firefox on Ubuntu", "198.100.20.10", "Success", _dt(2)),
            ("user_free_trial", "User registration (free trial)", "172.0.50.1", "Success", _dt(2)),
            ("user_free_trial", "Attempted export (insufficient credits)", "172.0.50.1", "Failed", _dt(1)),
        ]
        cursor.executemany("""
            INSERT INTO user_audit_logs (user_id, event, ip, status, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, audit_logs)

        # ── 11. Invoices ──────────────────────────────────────────────────────
        logger.info("Seeding invoices...")
        invoices = [
            ("INV-2026-001-testuser", "user_testuser1", 19.00, "Paid", _dt(90)),
            ("INV-2026-002-testuser", "user_testuser1", 19.00, "Paid", _dt(60)),
            ("INV-2026-003-testuser", "user_testuser1", 19.00, "Paid", _dt(30)),
            ("INV-2026-001-creatorpro", "user_creator_pro", 49.00, "Paid", _dt(90)),
            ("INV-2026-002-creatorpro", "user_creator_pro", 49.00, "Paid", _dt(60)),
            ("INV-2026-003-creatorpro", "user_creator_pro", 49.00, "Unpaid", _dt(30)),
            ("INV-2026-001-studio", "user_anim_studio", 199.00, "Paid", _dt(90)),
            ("INV-2026-002-studio", "user_anim_studio", 199.00, "Paid", _dt(60)),
            ("INV-2026-003-studio", "user_anim_studio", 199.00, "Paid", _dt(30)),
            ("INV-2026-001-editor", "user_editor_test", 19.00, "Paid", _dt(60)),
            ("INV-2026-002-editor", "user_editor_test", 0.00, "Free Trial", _dt(20)),
        ]
        cursor.executemany("""
            INSERT INTO user_invoices (invoice_id, user_id, amount, status, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, invoices)

        # ── 12. API Keys ──────────────────────────────────────────────────────
        logger.info("Seeding API keys...")
        api_keys = [
            ("key_test123", "user_testuser1", "Local Dev Sandbox",
             "av_live_68fa9180b73c2ea891047820a8910478207e2a", _dt(29)),
            ("key_pro456", "user_creator_pro", "Production Deployment",
             "av_live_21c81c81c81c81c81c81c81c81c81c81c81c81a891", _dt(24)),
            ("key_pro789", "user_creator_pro", "CI/CD Pipeline",
             "av_live_df84f84f84f84f84f84f84f84f84f84f84f84ff239", _dt(24)),
            ("key_studio1", "user_anim_studio", "Bulk Export Bot",
             "av_live_aa11bb22cc33dd44ee55ff6677889900aabbccdd", _dt(50)),
            ("key_studio2", "user_anim_studio", "Internal Dashboard",
             "av_live_ff0011223344556677889900aabbccddeeff0011", _dt(30)),
        ]
        cursor.executemany("""
            INSERT INTO user_api_keys (key_id, user_id, name, api_key, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, api_keys)

        # ── 13. Token Usage Logs ──────────────────────────────────────────────
        # Schema: project_id, input_tokens, output_tokens, total_tokens, estimated_cost_usd, created_at
        logger.info("Seeding token usage logs...")
        try:
            token_logs = [
                ("chap_lore_c1", 1200, 450, 1650, 0.0008, _dt(29)),
                ("chap_tog_c1",  1800, 620, 2420, 0.0012, _dt(24)),
                ("chap_or_c1",   3400, 1100, 4500, 0.0225, _dt(24)),
                ("chap_or_c2",   2900, 980, 3880, 0.0194, _dt(18)),
                ("chap_sl_c1",   4100, 1350, 5450, 0.0273, _dt(19)),
                ("chap_tb_c1",   2100, 700, 2800, 0.0014, _dt(17)),
                ("chap_nob_c1",  2600, 850, 3450, 0.0017, _dt(14)),
                ("chap_uno_c1",  900,  310, 1210, 0.0006, _dt(9)),
            ]
            cursor.executemany("""
                INSERT INTO token_usage_logs
                    (project_id, input_tokens, output_tokens, total_tokens, estimated_cost_usd, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, token_logs)
        except Exception as e:
            logger.warning(f"token_usage_logs skipped: {e}")

        # ── 14. System Announcements ──────────────────────────────────────────
        # Schema: title, message, type, status, created_at
        logger.info("Seeding system announcements...")
        try:
            announcements = [
                ("New Feature: AI Smart Crop v2",
                 "We've upgraded the AI panel-detection pipeline. Smart Crop now runs 3× faster with improved accuracy on long-form webtoon pages.",
                 "info", "active", _dt(7)),
                ("Scheduled Maintenance – June 30",
                 "The platform will be unavailable from 02:00–04:00 UTC on June 30 for database optimizations.",
                 "warning", "active", _dt(5)),
                ("Studio Tier Launched",
                 "Sonikoma Studio Tier is now available for teams and studios — batch exports, team seats, and priority rendering.",
                 "success", "active", _dt(14)),
                ("Deprecation: Legacy Proxy Endpoint",
                 "The /api/proxy-image v1 endpoint will be removed in the next release. Please migrate to /api/image/cached.",
                 "warning", "active", _dt(3)),
                ("Welcome to Sonikoma Beta!",
                 "Thank you for joining the Sonikoma beta program. Your feedback shapes the product.",
                 "info", "archived", _dt(60)),
            ]
            cursor.executemany("""
                INSERT INTO system_announcements (title, message, type, status, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, announcements)
        except Exception as e:
            logger.warning(f"system_announcements skipped: {e}")

        # ── 15. Platform Settings ─────────────────────────────────────────────
        # Schema: key, value, updated_at
        logger.info("Seeding platform settings...")
        try:
            platform_settings = [
                ("max_credits_per_day",    "500",   _dt(10)),
                ("default_video_fps",       "24",    _dt(10)),
                ("rate_limit_rpm",          "120",   _dt(10)),
                ("scrape_cache_ttl_hours",  "72",    _dt(10)),
                ("enable_youtube_upload",   "true",  _dt(10)),
                ("max_panels_per_chapter",  "200",   _dt(10)),
                ("maintenance_mode",        "false", _dt(10)),
                ("free_tier_credit_cap",    "0",     _dt(10)),
            ]
            cursor.executemany("""
                INSERT OR REPLACE INTO platform_settings (key, value, updated_at)
                VALUES (?, ?, ?)
            """, platform_settings)
        except Exception as e:
            logger.warning(f"platform_settings skipped: {e}")

        # ── 16. YouTube Profiles ──────────────────────────────────────────────
        # Schema: user_id, name, title_template, description_template, tags, category_id,
        #         privacy_status, is_short, made_for_kids, paid_promotion, license,
        #         video_language, channel_link, discord_link, patreon_link
        logger.info("Seeding YouTube profiles...")
        try:
            yt_profiles = [
                ("user_testuser1", "Sonikoma Webtoons by TestUser1",
                 "{series_title} {episode_number} | Fan-Made Cinematic",
                 "Fan-made cinematic adaptation of {series_title} by Sonikoma.",
                 '["webtoon","fanmade","sonikoma","cinematic"]',
                 "1", "public", 0, "no", 0, "youtube", "en",
                 "https://youtube.com/@testuser1", None, None),
                ("user_creator_pro", "Sarah's Cinematic Webtoons",
                 "{series_title} | Episode {episode_number} Cinematic",
                 "Premium cinematic adaptation by Sarah Jenkins.",
                 '["webtoon","animation","cinematic","sonikoma","sarah"]',
                 "1", "public", 0, "no", 0, "youtube", "en",
                 "https://youtube.com/@sarahcinematic",
                 "https://discord.gg/sarahcinematic",
                 "https://patreon.com/sarahcinematic"),
                ("user_anim_studio", "AnimX Studio Official",
                 "{series_title} | AnimX Studio",
                 "Official AnimX Studio cinematic webtoon production.",
                 '["webtoon","studio","animx","sonikoma","official"]',
                 "1", "public", 0, "no", 0, "youtube", "en",
                 "https://youtube.com/@animxstudio",
                 "https://discord.gg/animxstudio", None),
                ("user_manga_fan", "Kenji's Manga Cinema",
                 "{series_title} EP{episode_number}",
                 "Manga-to-video by Kenji Tanaka.",
                 '["manga","webtoon","sonikoma","japan"]',
                 "1", "unlisted", 1, "no", 0, "youtube", "ja",
                 None, None, None),
            ]
            cursor.executemany("""
                INSERT INTO youtube_profiles
                    (user_id, name, title_template, description_template, tags, category_id,
                     privacy_status, is_short, made_for_kids, paid_promotion, license,
                     video_language, channel_link, discord_link, patreon_link)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, yt_profiles)
        except Exception as e:
            logger.warning(f"youtube_profiles skipped: {e}")

        # ── 17. YouTube Publications ──────────────────────────────────────────
        # Schema: user_id, chapter_id, youtube_url, title, privacy_status, published_at
        logger.info("Seeding YouTube publications...")
        try:
            yt_pubs = [
                ("user_testuser1", "chap_lore_c1",
                 "https://youtu.be/example_lore_c1",
                 "Lore Olympus Chapter 1 | Fan-Made Cinematic",
                 "public", _dt(28)),
                ("user_testuser1", "chap_tog_c1",
                 "https://youtu.be/example_tog_c1",
                 "Tower of God Chapter 1 | Animated Fan Edit",
                 "public", _dt(23)),
                ("user_creator_pro", "chap_or_c1",
                 "https://youtu.be/example_or_c1",
                 "Omniscient Reader Ch.1 | Cinematic Webtoon Video",
                 "unlisted", _dt(23)),
                ("user_creator_pro", "chap_sl_c1",
                 "https://youtu.be/example_sl_c1",
                 "Solo Leveling Chapter 1 | Fan Film",
                 "public", _dt(18)),
                ("user_anim_studio", "chap_tb_c1",
                 "https://youtu.be/example_tb_c1",
                 "True Beauty Ch.1 | AnimX Studio Production",
                 "public", _dt(16)),
                ("user_anim_studio", "chap_nob_c1",
                 "https://youtu.be/example_nob_c1",
                 "Noblesse Chapter 1 | AnimX Studio Production",
                 "public", _dt(13)),
            ]
            cursor.executemany("""
                INSERT INTO youtube_publications
                    (user_id, chapter_id, youtube_url, title, privacy_status, published_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, yt_pubs)
        except Exception as e:
            logger.warning(f"youtube_publications skipped: {e}")

        conn.commit()
        logger.info("✅ Successfully seeded all database tables with rich mock data!")

    except Exception as e:
        conn.rollback()
        logger.error(f"Error seeding database: {e}")
        raise
    finally:
        conn.close()


def seed_training_data():
    """Seed 3 mock training pairs inside training_data/ to unlock fine-tuning."""
    import numpy as np
    import cv2
    
    training_dir = os.path.join(PROJECT_ROOT, "training_data")
    os.makedirs(training_dir, exist_ok=True)
    logger.info(f"Seeding mock training pairs in {training_dir}...")
    
    samples = [
        {"id": "sample001", "text": "BOOM!", "color": (150, 100, 250), "shape": "circle"},
        {"id": "sample002", "text": "WHAT?", "color": (100, 200, 150), "shape": "rect"},
        {"id": "sample003", "text": "AHA!", "color": (250, 150, 100), "shape": "ellipse"}
    ]

    for s in samples:
        pair_id = s["id"]
        original = np.zeros((256, 256, 3), dtype=np.uint8)
        original[:, :] = s["color"]
        mask = np.zeros((256, 256), dtype=np.uint8)

        if s["shape"] == "rect":
            cv2.rectangle(original, (40, 60), (210, 190), (255, 255, 255), -1)
            cv2.putText(original, s["text"], (75, 135), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)
            cv2.rectangle(mask, (40, 60), (210, 190), 255, -1)
        elif s["shape"] == "circle":
            cv2.circle(original, (128, 128), 80, (255, 255, 255), -1)
            cv2.putText(original, s["text"], (70, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)
            cv2.circle(mask, (128, 128), 80, 255, -1)
        else:
            cv2.ellipse(original, (128, 128), (95, 65), 0, 0, 360, (255, 255, 255), -1)
            cv2.putText(original, s["text"], (80, 135), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)
            cv2.ellipse(mask, (128, 128), (95, 65), 0, 0, 360, 255, -1)

        orig_path = os.path.join(training_dir, f"original_{pair_id}.png")
        mask_path = os.path.join(training_dir, f"mask_{pair_id}.png")

        cv2.imwrite(orig_path, original)
        cv2.imwrite(mask_path, mask)
        logger.info(f"  Generated mock training pair: {pair_id}")


if __name__ == "__main__":
    logger.info("=== Sonikoma Seed Script Started ===")
    ensure_db_schema()
    seed_data()
    seed_training_data()
    logger.info("=== Seeding Completed Successfully ===")
