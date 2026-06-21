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

def seed_data():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")
    
    try:
        # 1. Clear ALL tables to perform a clean and complete seed
        tables = [
            "panels", "chapters", "series", "user_sessions", "user_audit_logs", 
            "user_invoices", "user_api_keys", "users", "scrape_sessions", "edit_history"
        ]
        logger.info("Clearing existing records...")
        for table in tables:
            cursor.execute(f"DELETE FROM {table}")
        
        # 2. Pre-generate password hashes
        logger.info("Generating password hashes...")
        password = "password"
        password_bytes = password.encode('utf-8')[:72]
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        password_hash = hashed.decode('utf-8')
        
        # 3. Seed Users Table
        logger.info("Seeding users...")
        users = [
            # Main Test User
            (
                "user_testuser1", "testuser1", "test@gamil.com", password_hash, 
                '{"theme": "dark", "autoSave": true, "volume": 0.8}', 
                "https://api.dicebear.com/7.x/avataaars/svg?seed=testuser1", 
                "Test User One", "creator", "Casual webtoon compiler and creator testing the Anivox suite.", 
                1, "en", "[]", 1250, None, "[]", 0, 
                '{"google":true,"github":false,"discord":false}',
                "2026-06-18 10:00:00", "2026-06-18 10:00:00"
            ),
            # Pro Creator
            (
                "user_creator_pro", "creator_pro", "pro@gmail.com", password_hash, 
                '{"theme": "cyberpunk", "autoSave": true, "volume": 1.0}', 
                "https://api.dicebear.com/7.x/avataaars/svg?seed=creator_pro", 
                "Sarah Jenkins (Pro)", "director", "Professional animator and comic creator pushing Webtoons to cinematic heights.", 
                1, "en", '["https://behance.net/sarah", "https://youtube.com/sarahanimations"]', 4850, 
                (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"), 
                '["badge_pro_creator", "badge_early_bird"]', 1, 
                '{"google":true,"github":true,"discord":true}',
                "2026-06-19 13:00:00", "2026-06-19 13:00:00"
            ),
            # Guest Editor
            (
                "user_editor_test", "editor_test", "editor@gmail.com", password_hash, 
                '{"theme": "light", "autoSave": false, "volume": 0.5}', 
                "https://api.dicebear.com/7.x/avataaars/svg?seed=editor_test", 
                "Alex Rivera", "editor", "Collaborative editor testing timeline synchronization and audio syncing.", 
                0, "es", "[]", 350, None, "[]", 0, 
                '{"google":false,"github":false,"discord":false}',
                "2026-06-20 12:00:00", "2026-06-20 12:00:00"
            )
        ]
        cursor.executemany("""
            INSERT INTO users (
                id, username, email, password_hash, preferences, avatar_url, 
                full_name, creator_role, bio, newsletter, language, portfolio_links, 
                credits, last_claimed_date, unlocked_rewards, mfa_enabled, social_connections,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, users)

        # 4. Seed Series Table
        logger.info("Seeding series publishing metadata...")
        series = [
            (
                "ser_lore_olympus", "user_testuser1", "Lore Olympus (Test Series)", 
                "Rachel Smythe", "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop", 
                "romance", "A modern retelling of one of mythology's greatest stories: the taking of Persephone.",
                "2026-06-18 10:30:00"
            ),
            (
                "ser_tower_of_god", "user_testuser1", "Tower of God (Test Series)", 
                "SIU", "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&auto=format&fit=crop", 
                "action", "What do you desire? Money and wealth? Honor and pride? Authority and power? Find it all at the top of the Tower.",
                "2026-06-19 09:30:00"
            ),
            (
                "ser_omniscient_reader", "user_creator_pro", "Omniscient Reader (Test Series)", 
                "sing N song", "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop", 
                "fantasy", "Only I know the end of this world. One day, our favorite webtoon novel becomes reality, and survival begins.",
                "2026-06-19 13:30:00"
            )
        ]
        cursor.executemany("""
            INSERT INTO series (
                id, user_id, title, author, cover_image, genre, synopsis, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, series)

        # 5. Seed Chapters Table (Testing completed, processing, failed, pending states)
        logger.info("Seeding chapters/episodes...")
        chapters = [
            # Lore Olympus (User testuser1)
            (
                "chap_lore_c1", "ser_lore_olympus", "Chapter 1", 
                "https://www.webtoons.com/en/romance/lore-olympus/episode-1/viewer?title_no=1320&episode_no=1", 
                "completed", 3, "https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-in-the-forest-43189-large.mp4",
                "2026-06-18 11:00:00", "2026-06-18 11:05:00"
            ),
            # Tower of God Chapters (User testuser1)
            (
                "chap_tog_c1", "ser_tower_of_god", "Chapter 1", 
                "https://www.webtoons.com/en/fantasy/tower-of-god/season-1-ep-0/viewer?title_no=95&episode_no=1", 
                "completed", 4, "https://assets.mixkit.co/videos/preview/mixkit-flying-through-clouds-in-a-sunny-sky-42861-large.mp4",
                "2026-06-19 10:00:00", "2026-06-19 10:05:00"
            ),
            (
                "chap_tog_c2", "ser_tower_of_god", "Chapter 2", 
                "https://www.webtoons.com/en/fantasy/tower-of-god/season-1-ep-1/viewer?title_no=95&episode_no=2", 
                "processing", 0, None,
                "2026-06-20 17:00:00", "2026-06-20 17:00:00"
            ),
            (
                "chap_tog_c3", "ser_tower_of_god", "Chapter 3", 
                "https://www.webtoons.com/en/fantasy/tower-of-god/season-1-ep-2/viewer?title_no=95&episode_no=3", 
                "failed", 0, None,
                "2026-06-20 17:10:00", "2026-06-20 17:12:00"
            ),
            (
                "chap_tog_c4", "ser_tower_of_god", "Chapter 4", 
                "https://www.webtoons.com/en/fantasy/tower-of-god/season-1-ep-3/viewer?title_no=95&episode_no=4", 
                "pending", 0, None,
                "2026-06-20 17:15:00", "2026-06-20 17:15:00"
            ),
            # Omniscient Reader Chapters (User creator_pro)
            (
                "chap_or_c1", "ser_omniscient_reader", "Chapter 1", 
                "https://www.webtoons.com/en/action/omniscient-reader/episode-1/viewer?title_no=2154&episode_no=1", 
                "completed", 5, "https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-a-window-pane-41617-large.mp4",
                "2026-06-19 14:00:00", "2026-06-19 14:08:00"
            ),
            (
                "chap_or_c2", "ser_omniscient_reader", "Chapter 2", 
                "https://www.webtoons.com/en/action/omniscient-reader/episode-2/viewer?title_no=2154&episode_no=2", 
                "pending", 0, None,
                "2026-06-20 12:00:00", "2026-06-20 12:00:00"
            )
        ]
        cursor.executemany("""
            INSERT INTO chapters (
                id, series_id, episode_number, original_url, status, panels_count, video_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, chapters)

        # 6. Seed Storyboard Panels Table (For completed chapters)
        logger.info("Seeding storyboard panels with custom details...")
        panels = [
            # Panels for Lore Olympus Chapter 1 (3 panels)
            (
                "chap_lore_c1", 0, 
                "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop",
                "Welcome to the underworld! It is dark, mysterious, yet vibrant.", "WHOOSH", 4.5, "zoom_in", 
                "Persephone looking at the towering dark obsidian castle.", 10, 5, 0, 0, "cyberpunk", None, None, None, None, None,
                "2026-06-18 11:00:00"
            ),
            (
                "chap_lore_c1", 1, 
                "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop",
                "Wait, who is standing there in the shadows?", "SHINE", 3.5, "pan_right", 
                "Hades turning around, dressed in a sharp business suit with glowing red eyes.", None, None, None, 0, None, None, None, None, None, None,
                "2026-06-18 11:02:00"
            ),
            (
                "chap_lore_c1", 2, 
                "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop",
                "Let our story begin.", "POP", 5.0, "zoom_out", 
                "A close-up of Persephone and Hades meeting at the banquet tables.", 0, 0, 0, 0, "vintage", None, None, None, None, None,
                "2026-06-18 11:05:00"
            ),

            # Panels for Tower of God Chapter 1 (4 panels)
            (
                "chap_tog_c1", 0,
                "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop",
                "Bam! Why are you running away?!", "CRASH", 4.0, "pan_left", 
                "Rachel running towards the massive heavy iron gates of the tower.", None, None, None, 0, None, "manual", 0.85, 4.0, 15, "comic",
                "2026-06-19 10:00:00"
            ),
            (
                "chap_tog_c1", 1,
                "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&auto=format&fit=crop",
                "I must reach the stars. Even if it means leaving you in the dark.", "WIND", 5.5, "zoom_in", 
                "Rachel fading away into a golden bright light inside the gateway portal.", None, None, None, 0, None, None, None, None, None, None,
                "2026-06-19 10:02:00"
            ),
            (
                "chap_tog_c1", 2,
                "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop",
                "No! Wait for me! Rachel!", "HEARTBEAT", 4.5, "zoom_out", 
                "Bam reaching out his hand as the gate slams shut, leaving him in darkness.", 5, -5, 0, 0, None, None, None, None, None, None,
                "2026-06-19 10:03:00"
            ),
            (
                "chap_tog_c1", 3,
                "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop",
                "Where am I? Who are you?", "ECHO", 5.0, "static", 
                "Bam waking up on a cold stone floor in front of a giant monster (Headon).", None, None, None, 0, "noir", None, None, None, None, None,
                "2026-06-19 10:05:00"
            ),

            # Panels for Omniscient Reader Chapter 1 (5 panels)
            (
                "chap_or_c1", 0,
                "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop",
                "I was reading the final chapter of 'Three Ways to Survive in a Ruined World'.", "KEYBOARD_TAP", 4.0, "static", 
                "Dokja staring at his smartphone screen on a crowded subway train.", None, None, None, 0, None, None, None, None, None, None,
                "2026-06-19 14:00:00"
            ),
            (
                "chap_or_c1", 1,
                "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop",
                "Suddenly, the lights flickered and the train screeched to a halt.", "SPARK", 4.5, "pan_right", 
                "The subway interior shaking violently, sparks flying from the ceiling lights.", 20, 20, -10, 0, None, None, None, None, None, None,
                "2026-06-19 14:02:00"
            ),
            (
                "chap_or_c1", 2,
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop",
                "[The free service of planetary system 8612 has terminated.]", "STATIC_BUZZ", 6.0, "zoom_in", 
                "A blue holographic system message window appearing floating in the air.", None, None, None, 0, "cyberpunk", None, None, None, None, None,
                "2026-06-19 14:04:00"
            ),
            (
                "chap_or_c1", 3,
                "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop",
                "[The main scenario starts now.]", "EXPLOSION", 5.0, "zoom_out", 
                "A fuzzy white creature with horns (the Dokkaebi) appearing in front of them.", None, None, None, 0, None, None, None, None, None, None,
                "2026-06-19 14:06:00"
            ),
            (
                "chap_or_c1", 4,
                "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop",
                "This is the world I knew. The story has become reality.", "DARK_HUM", 5.0, "pan_left", 
                "Dokja narrowing his eyes, bracing himself for the monsters inside the train.", None, None, None, 0, "noir", None, None, None, None, None,
                "2026-06-19 14:08:00"
            )
        ]
        cursor.executemany("""
            INSERT INTO panels (
                chapter_id, panel_index, image_url, original_url, speech_text, sfx,
                duration, motion_type, visual_description, brightness, contrast, saturation,
                grayscale, filter_preset, bubble_method, bubble_sensitivity, bubble_dilation,
                inpaint_radius, detection_style, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, panels)

        # 7. Seed Scrape Sessions Cache Table
        logger.info("Seeding scrape sessions cache...")
        scrape_sessions = [
            (
                "https://www.webtoons.com/en/romance/lore-olympus/episode-1/viewer?title_no=1320&episode_no=1",
                '["https://example.com/lore1_1.jpg", "https://example.com/lore1_2.jpg", "https://example.com/lore1_3.jpg"]',
                3, "2026-06-18 10:45:00"
            ),
            (
                "https://www.webtoons.com/en/fantasy/tower-of-god/season-1-ep-0/viewer?title_no=95&episode_no=1",
                '["https://example.com/tog1_1.jpg", "https://example.com/tog1_2.jpg", "https://example.com/tog1_3.jpg", "https://example.com/tog1_4.jpg"]',
                4, "2026-06-19 09:45:00"
            )
        ]
        cursor.executemany("""
            INSERT INTO scrape_sessions (url, image_urls, panel_count, scraped_at)
            VALUES (?, ?, ?, ?)
        """, scrape_sessions)

        # 8. Seed Edit History Table
        logger.info("Seeding image edits logs (undo/redo)...")
        edit_history_entries = [
            (
                "https://example.com/cache/panel_0_crop1.png", 
                "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop", 
                "crop", "2026-06-18 11:02:00"
            ),
            (
                "https://example.com/cache/panel_0_clean.png", 
                "https://example.com/cache/panel_0_crop1.png", 
                "bubble_remove", "2026-06-18 11:04:00"
            )
        ]
        cursor.executemany("""
            INSERT INTO edit_history (edited_url, original_url, edit_type, created_at)
            VALUES (?, ?, ?, ?)
        """, edit_history_entries)

        # 9. Seed Active User Sessions Table
        logger.info("Seeding active device sessions...")
        user_sessions = [
            ("sess_test111", "user_testuser1", "Chrome on Windows 11", "192.168.1.45", "New York, USA", 1, "2026-06-20 15:40:00"),
            ("sess_test222", "user_testuser1", "Safari on Apple iPhone", "172.56.21.99", "San Francisco, USA", 1, "2026-06-20 12:10:00"),
            ("sess_pro111", "user_creator_pro", "Firefox Developer Edition on Arch Linux", "84.22.100.12", "London, UK", 1, "2026-06-20 17:05:00"),
            ("sess_pro222", "user_creator_pro", "Chrome on Apple macOS", "198.51.100.3", "Toronto, Canada", 0, "2026-06-19 08:30:00") # inactive
        ]
        cursor.executemany("""
            INSERT INTO user_sessions (session_id, user_id, browser, ip, location, active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, user_sessions)

        # 10. Seed User Audit Logs Table
        logger.info("Seeding security audit trails...")
        audit_logs = [
            ("user_testuser1", "User registration", "127.0.0.1", "Success", "2026-06-18 10:00:00"),
            ("user_testuser1", "Generated developer API key 'Local Dev Sandbox'", "192.168.1.45", "Success", "2026-06-18 10:15:00"),
            ("user_testuser1", "Failed login attempt (bad password)", "192.168.1.200", "Failed", "2026-06-19 09:30:00"),
            ("user_testuser1", "User login via Chrome on Windows 11", "192.168.1.45", "Success", "2026-06-20 15:40:00"),
            ("user_creator_pro", "Unlocked achievement badge 'badge_pro_creator'", "84.22.100.12", "Success", "2026-06-19 14:00:00"),
            ("user_creator_pro", "Redeemed reward points for +1000 compute credits", "84.22.100.12", "Success", "2026-06-19 14:15:00"),
            ("user_creator_pro", "Activated Multi-Factor Authentication (MFA)", "84.22.100.12", "Success", "2026-06-20 17:05:00")
        ]
        cursor.executemany("""
            INSERT INTO user_audit_logs (user_id, event, ip, status, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, audit_logs)

        # 11. Seed Billing Invoices Table
        logger.info("Seeding invoices ledger logs...")
        invoices = [
            ("INV-2026-001-testuser", "user_testuser1", 19.00, "Paid", "2026-04-15 10:00:00"),
            ("INV-2026-002-testuser", "user_testuser1", 19.00, "Paid", "2026-05-15 10:00:00"),
            ("INV-2026-003-testuser", "user_testuser1", 19.00, "Paid", "2026-06-15 10:00:00"),
            ("INV-2026-001-creatorpro", "user_creator_pro", 49.00, "Paid", "2026-04-15 10:00:00"),
            ("INV-2026-002-creatorpro", "user_creator_pro", 49.00, "Paid", "2026-05-15 10:00:00"),
            ("INV-2026-003-creatorpro", "user_creator_pro", 49.00, "Unpaid", "2026-06-15 10:00:00")
        ]
        cursor.executemany("""
            INSERT INTO user_invoices (invoice_id, user_id, amount, status, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, invoices)

        # 12. Seed Developer API Keys Table
        logger.info("Seeding API key credentials...")
        api_keys = [
            ("key_test123", "user_testuser1", "Local Dev Sandbox", "av_live_68fa9180b73c2ea891047820a891047820a8910478207e2a", "2026-06-18 10:15:00"),
            ("key_pro456", "user_creator_pro", "Production Deployment App", "av_live_21c81c81c81c81c81c81c81c81c81c81c81c81c81c81a891", "2026-06-19 14:30:00"),
            ("key_pro789", "user_creator_pro", "CI/CD Deployment pipeline", "av_live_df84f84f84f84f84f84f84f84f84f84f84f84f84f84ff239", "2026-06-19 14:35:00")
        ]
        cursor.executemany("""
            INSERT INTO user_api_keys (key_id, user_id, name, api_key, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, api_keys)

        conn.commit()
        logger.info("Successfully seeded all testing database tables with rich mock data!")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error seeding database: {e}")
        raise e
    finally:
        conn.close()

if __name__ == "__main__":
    logger.info("=== Expanded Seeding Script Started ===")
    ensure_db_schema()
    seed_data()
    logger.info("=== Expanded Seeding Process Completed Successfully ===")
