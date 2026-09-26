import os
import sqlite3
import logging
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_single_admin_5_projects")

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DB_PATH = os.path.join(REPO_ROOT, "data", "webtoon_local.db")

def _dt(days_ago=0, hours=0, minutes=0, base="2026-06-20"):
    dt = datetime.strptime(base, "%Y-%m-%d") - timedelta(days=days_ago, hours=hours, minutes=minutes)
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def run():
    logger.info(f"Targeting database at: {DB_PATH}")
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database not found at {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = OFF")

    try:
        admin_id = "user_cacfbef1"
        admin_email = "dheenadayalan017@gmail.com"
        admin_username = "Dheenadayalan_R"

        # ── 1. Clear old series, chapters, panels, scrape sessions ───────────
        logger.info("Purging old series, chapters, panels, and scrape sessions...")
        cursor.execute("DELETE FROM panels")
        cursor.execute("DELETE FROM chapters")
        cursor.execute("DELETE FROM series")
        cursor.execute("DELETE FROM scrape_sessions")
        cursor.execute("DELETE FROM edit_history")
        cursor.execute("DELETE FROM jobs")

        # ── 2. Purge other users and secondary user tables ──────────────────
        logger.info("Retaining ONLY admin user Dheenadayalan_R...")
        cursor.execute("DELETE FROM users WHERE id != ?", (admin_id,))
        cursor.execute("DELETE FROM user_sessions WHERE user_id != ?", (admin_id,))
        cursor.execute("DELETE FROM user_api_keys WHERE user_id != ?", (admin_id,))
        cursor.execute("DELETE FROM user_audit_logs WHERE user_id != ?", (admin_id,))
        cursor.execute("DELETE FROM user_invoices WHERE user_id != ?", (admin_id,))
        cursor.execute("DELETE FROM credit_transactions WHERE user_id != ?", (admin_id,))
        cursor.execute("DELETE FROM token_usage_logs WHERE user_id != ?", (admin_id,))
        cursor.execute("DELETE FROM youtube_credentials WHERE user_id != ?", (admin_id,))
        cursor.execute("DELETE FROM youtube_profiles WHERE user_id != ?", (admin_id,))
        cursor.execute("DELETE FROM youtube_publications WHERE user_id != ?", (admin_id,))

        # ── 3. Insert or update Admin User ───────────────────────────────────
        cursor.execute("SELECT id FROM users WHERE id = ?", (admin_id,))
        row = cursor.fetchone()
        pw_hash = "$2b$12$MI9pPwCXwr4F4sEbUTzNZe/Or.T6iRXQbu2Ka3EKyK7CqXL6WrV6m"  # password123

        if not row:
            logger.info("Inserting admin user Dheenadayalan_R...")
            cursor.execute("""
                INSERT INTO users (
                    id, username, email, password_hash, preferences, avatar_url,
                    full_name, google_id, creator_role, bio, newsletter, language, portfolio_links,
                    credits, credit_balance, last_claimed_date, unlocked_rewards, mfa_enabled,
                    social_connections, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                admin_id,
                admin_username,
                admin_email,
                pw_hash,
                '{"theme":"dark","autoSave":true,"volume":1.0}',
                "https://lh3.googleusercontent.com/a/default-user",
                "Dheenadayalan R",
                None,
                "admin",
                "Platform Administrator",
                1,
                "en",
                "[]",
                9999,
                9999,
                None,
                '["badge_pro_creator","badge_admin"]',
                0,
                '{"google":true,"github":true,"discord":true}',
                _dt(30),
                _dt(0),
            ))
        else:
            logger.info("Updating admin user Dheenadayalan_R...")
            cursor.execute("""
                UPDATE users SET
                    username = ?,
                    email = ?,
                    password_hash = ?,
                    preferences = '{"theme":"dark","autoSave":true,"volume":1.0}',
                    full_name = 'Dheenadayalan R',
                    creator_role = 'admin',
                    credits = 9999,
                    credit_balance = 9999,
                    unlocked_rewards = '["badge_pro_creator","badge_admin"]',
                    updated_at = datetime('now')
                WHERE id = ?
            """, (admin_username, admin_email, pw_hash, admin_id))

        # ── 4. Seed the 5 Default Series ─────────────────────────────────────
        logger.info("Seeding the 5 default series for Dheenadayalan_R...")
        series = [
            ("ser_lore_olympus", admin_id, "Lore Olympus", "lore-olympus",
             "Rachel Smythe",
             "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop",
             "romance",
             "A modern retelling of one of mythology's greatest stories: the taking of Persephone.",
             _dt(30)),
            ("ser_tower_of_god", admin_id, "Tower of God", "tower-of-god",
             "SIU",
             "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&auto=format&fit=crop",
             "action",
             "What do you desire? Authority and power? Find it all at the top of the Tower.",
             _dt(25)),
            ("ser_omniscient_reader", admin_id, "Omniscient Reader", "omniscient-reader",
             "sing N song",
             "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop",
             "fantasy",
             "Only I know the end of this world. Survival begins the day the novel becomes reality.",
             _dt(25)),
            ("ser_solo_leveling", admin_id, "Solo Leveling", "solo-leveling",
             "Chugong",
             "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop",
             "action",
             "The weakest hunter of all mankind will face the world's deadliest dungeon raid.",
             _dt(20)),
            ("ser_true_beauty", admin_id, "True Beauty", "true-beauty",
             "Yaongyi",
             "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop",
             "romance",
             "A girl who masterfully hides her plain face through the power of makeup.",
             _dt(18)),
        ]
        cursor.executemany("""
            INSERT INTO series (id, user_id, title, slug, author, cover_image, genre, synopsis, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, series)

        # ── 5. Seed Chapters for the 5 Series ────────────────────────────────
        logger.info("Seeding chapters for the 5 series...")
        chapters = [
            # Lore Olympus
            ("chap_lore_c1", "ser_lore_olympus", "Chapter 1", "lore-olympus-ch1",
             "https://www.webtoons.com/en/romance/lore-olympus/episode-1/viewer?title_no=1320&episode_no=1",
             "completed", 3,
             "https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-in-the-forest-43189-large.mp4",
             1650, '{"volume":0.8,"bgm":"starry_night.mp3"}', _dt(29), _dt(28)),
            ("chap_lore_c2", "ser_lore_olympus", "Chapter 2", "lore-olympus-ch2",
             "https://www.webtoons.com/en/romance/lore-olympus/episode-2/viewer?title_no=1320&episode_no=2",
             "completed", 4, None, 1200, '{"volume":0.8}', _dt(22), _dt(21)),
            ("chap_lore_c3", "ser_lore_olympus", "Chapter 3", "lore-olympus-ch3",
             "https://www.webtoons.com/en/romance/lore-olympus/episode-3/viewer?title_no=1320&episode_no=3",
             "processing", 0, None, 0, None, _dt(10), _dt(10)),

            # Tower of God
            ("chap_tog_c1", "ser_tower_of_god", "Chapter 1", "tower-of-god-ch1",
             "https://www.webtoons.com/en/fantasy/tower-of-god/season-1-ep-0/viewer?title_no=95&episode_no=1",
             "completed", 4,
             "https://assets.mixkit.co/videos/preview/mixkit-flying-through-clouds-in-a-sunny-sky-42861-large.mp4",
             2420, '{"volume":1.0,"bgm":"epic_intro.mp3"}', _dt(24), _dt(23)),
            ("chap_tog_c2", "ser_tower_of_god", "Chapter 2", "tower-of-god-ch2",
             "https://www.webtoons.com/en/fantasy/tower-of-god/season-1-ep-1/viewer?title_no=95&episode_no=2",
             "completed", 3, None, 1100, None, _dt(20), _dt(19)),
            ("chap_tog_c3", "ser_tower_of_god", "Chapter 3", "tower-of-god-ch3",
             "https://www.webtoons.com/en/fantasy/tower-of-god/season-1-ep-2/viewer?title_no=95&episode_no=3",
             "failed", 0, None, 0, None, _dt(15), _dt(14)),
            ("chap_tog_c4", "ser_tower_of_god", "Chapter 4", "tower-of-god-ch4",
             "https://www.webtoons.com/en/fantasy/tower-of-god/season-1-ep-3/viewer?title_no=95&episode_no=4",
             "pending", 0, None, 0, None, _dt(5), _dt(5)),

            # Omniscient Reader
            ("chap_or_c1", "ser_omniscient_reader", "Chapter 1", "omniscient-reader-ch1",
             "https://www.webtoons.com/en/action/omniscient-reader/episode-1/viewer?title_no=2154&episode_no=1",
             "completed", 5,
             "https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-a-window-pane-41617-large.mp4",
             4500, '{"volume":0.9}', _dt(24), _dt(23)),
            ("chap_or_c2", "ser_omniscient_reader", "Chapter 2", "omniscient-reader-ch2",
             "https://www.webtoons.com/en/action/omniscient-reader/episode-2/viewer?title_no=2154&episode_no=2",
             "completed", 4, None, 3880, None, _dt(18), _dt(17)),
            ("chap_or_c3", "ser_omniscient_reader", "Chapter 3", "omniscient-reader-ch3",
             "https://www.webtoons.com/en/action/omniscient-reader/episode-3/viewer?title_no=2154&episode_no=3",
             "pending", 0, None, 0, None, _dt(3), _dt(3)),

            # Solo Leveling
            ("chap_sl_c1", "ser_solo_leveling", "Chapter 1", "solo-leveling-ch1",
             "https://www.webtoons.com/en/action/solo-leveling/episode-1/viewer?title_no=1&episode_no=1",
             "completed", 6, None, 5450, '{"volume":1.0}', _dt(19), _dt(18)),
            ("chap_sl_c2", "ser_solo_leveling", "Chapter 2", "solo-leveling-ch2",
             "https://www.webtoons.com/en/action/solo-leveling/episode-2/viewer?title_no=1&episode_no=2",
             "processing", 0, None, 0, None, _dt(4), _dt(4)),

            # True Beauty
            ("chap_tb_c1", "ser_true_beauty", "Chapter 1", "true-beauty-ch1",
             "https://www.webtoons.com/en/romance/true-beauty/episode-1/viewer?title_no=1436&episode_no=1",
             "completed", 4, None, 2800, None, _dt(17), _dt(16)),
            ("chap_tb_c2", "ser_true_beauty", "Chapter 2", "true-beauty-ch2",
             "https://www.webtoons.com/en/romance/true-beauty/episode-2/viewer?title_no=1436&episode_no=2",
             "pending", 0, None, 0, None, _dt(6), _dt(6)),
        ]
        cursor.executemany("""
            INSERT INTO chapters (
                id, series_id, episode_number, slug, original_url, status,
                panels_count, video_url, total_tokens_used, audio_settings, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, chapters)

        # ── 6. Seed Storyboard Panels ─────────────────────────────────────────
        logger.info("Seeding storyboard panels for the chapters...")
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
                   audio=None, smart_crop=1, crop_pad=10, sanitized=0, created=None):
            img = _img[idx % len(_img)]
            return (chap, idx, img, img, text, sfx, dur, motion, desc,
                    br, ct, sat, gray, flt, bub, sens, dil, inr, dstyle,
                    audio, smart_crop, crop_pad, sanitized, created or _dt(20))

        panels = [
            _panel("chap_lore_c1", 0, "Welcome to the underworld!", "WHOOSH", 4.5, "zoom_in",
                   "Persephone gazes at the dark obsidian castle.", 10, 5, 0, 0, "cyberpunk", created=_dt(29)),
            _panel("chap_lore_c1", 1, "Wait, who is that in the shadows?", "SHINE", 3.5, "pan_right",
                   "Hades in a sharp business suit with glowing red eyes.", created=_dt(29)),
            _panel("chap_lore_c1", 2, "Let our story begin.", "POP", 5.0, "zoom_out",
                   "Persephone and Hades meet at the banquet.", 0, 0, 0, 0, "vintage", created=_dt(29)),

            _panel("chap_lore_c2", 0, "Are you lost, little goddess?", "ECHO", 4.0, "static",
                   "Hades looking down at Persephone near the gates.", created=_dt(22)),
            _panel("chap_lore_c2", 1, "I never get lost. I choose alternate routes.", "CHIME", 3.0, "pan_left",
                   "Persephone lifting her chin defiantly.", created=_dt(22)),
            _panel("chap_lore_c2", 2, "A mortal with a goddess' attitude.", "WIND", 5.0, "zoom_in",
                   "Hades and Persephone walking through fields of glowing flowers.", 5, 5, 10, 0, None, created=_dt(22)),
            _panel("chap_lore_c2", 3, "The underworld will never be the same.", "HEARTBEAT", 6.0, "zoom_out",
                   "Sweeping view of the dark kingdom lit by Persephone's aura.", created=_dt(22)),

            _panel("chap_tog_c1", 0, "Bam! Why are you running away?!", "CRASH", 4.0, "pan_left",
                   "Rachel running toward massive iron gates.", None, None, None, 0, None, "manual", 0.85, 4.0, 15, "comic", created=_dt(24)),
            _panel("chap_tog_c1", 1, "I must reach the stars.", "WIND", 5.5, "zoom_in",
                   "Rachel fading into a golden portal.", created=_dt(24)),
            _panel("chap_tog_c1", 2, "No! Rachel!", "HEARTBEAT", 4.5, "zoom_out",
                   "Bam reaching out as the gate slams shut.", 5, -5, 0, 0, None, created=_dt(24)),
            _panel("chap_tog_c1", 3, "Where am I? Who are you?", "ECHO", 5.0, "static",
                   "Bam waking on stone in front of Headon.", None, None, None, 0, "noir", created=_dt(24)),

            _panel("chap_tog_c2", 0, "Pass the test and you shall climb.", "ROAR", 5.0, "zoom_in",
                   "Headon presenting the black steel ball.", created=_dt(20)),
            _panel("chap_tog_c2", 1, "I'll do it, for Rachel.", "DETERMINATION", 4.5, "static",
                   "Bam clenching his fist and stepping forward.", 10, 0, 0, 0, None, created=_dt(20)),
            _panel("chap_tog_c2", 2, "The test begins. Survive.", "CRASH", 6.5, "pan_right",
                   "Bam sprinting across the floor toward the giant eel.", created=_dt(20)),

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

            _panel("chap_or_c2", 0, "I am the only one who knows how this ends.", "STATIC_BUZZ", 5.0, "zoom_in",
                   "Dokja surrounded by frightened people in the broken subway.", created=_dt(18)),
            _panel("chap_or_c2", 1, "The first scenario: eliminate the enemy.", "CRASH", 6.5, "zoom_out",
                   "A massive monster breaking through the tunnel wall.", created=_dt(18)),
            _panel("chap_or_c2", 2, "Nobody believed the ending but me.", "ECHO", 4.0, "static",
                   "Dokja picking up a weapon left by a fallen police officer.", created=_dt(18)),
            _panel("chap_or_c2", 3, "Fight.", "EXPLOSION", 3.0, "pan_right",
                   "Dokja charging at the monster alone in the dark tunnel.", 5, 10, 5, 0, None, created=_dt(18)),

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

            _panel("chap_tb_c1", 0, "Without makeup, I'm nothing.", "WIND", 3.5, "static",
                   "Jugyeong without makeup, looking plain in the mirror.", created=_dt(17)),
            _panel("chap_tb_c1", 1, "But with it, I'm everything.", "SHINE", 4.5, "zoom_in",
                   "Jugyeong fully made up, radiant and beautiful.", 5, 5, 10, 0, None, created=_dt(17)),
            _panel("chap_tb_c1", 2, "New school. New identity. New me.", "CHIME", 4.0, "pan_right",
                   "Jugyeong confidently walking into a new school entrance.", created=_dt(17)),
            _panel("chap_tb_c1", 3, "He saw me. Without my makeup.", "HEARTBEAT", 6.0, "zoom_out",
                   "Suho and Jugyeong's eyes meeting across a dark library.", created=_dt(17)),
        ]

        cursor.executemany("""
            INSERT INTO panels (
                chapter_id, panel_index, image_url, original_url, speech_text, sfx,
                duration, motion_type, visual_description, brightness, contrast, saturation,
                grayscale, filter_preset, bubble_method, bubble_sensitivity, bubble_dilation,
                inpaint_radius, detection_style, audio_url, smart_crop, crop_padding,
                is_sanitized, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, panels)

        # ── 7. Scrape Sessions ────────────────────────────────────────────────
        logger.info("Seeding scrape sessions...")
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

        # ── 8. Re-enable foreign keys & commit ────────────────────────────────
        cursor.execute("PRAGMA foreign_keys = ON")
        conn.commit()

        # ── 9. Verification Summary ───────────────────────────────────────────
        cursor.execute("SELECT id, username, email, creator_role, credits FROM users")
        final_users = cursor.fetchall()

        cursor.execute("SELECT id, title, author, genre FROM series")
        final_series = cursor.fetchall()

        cursor.execute("SELECT COUNT(*) FROM chapters")
        chap_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM panels")
        panel_count = cursor.fetchone()[0]

        logger.info("==================================================")
        logger.info("DATABASE CONFIGURATION COMPLETED:")
        logger.info(f"Users in DB ({len(final_users)}): {final_users}")
        logger.info(f"Series in DB ({len(final_series)}):")
        for s in final_series:
            logger.info(f"  - {s[1]} ({s[3]}) by {s[2]} [id: {s[0]}]")
        logger.info(f"Total Chapters: {chap_count}")
        logger.info(f"Total Storyboard Panels: {panel_count}")
        logger.info("==================================================")

    finally:
        conn.close()

if __name__ == "__main__":
    run()
