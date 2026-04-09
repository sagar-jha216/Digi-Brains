from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.social import ScheduledPost, SocialAccount
from app.services import social_service
from app.services.analytics_service import upsert_generated_analytics
import logging

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


async def process_scheduled_posts():
    """Run every minute — publish any posts whose scheduled_at has passed."""
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        due_posts = (
            db.query(ScheduledPost)
            .filter(ScheduledPost.status == "scheduled", ScheduledPost.scheduled_at <= now)
            .all()
        )

        for post in due_posts:
            account = db.query(SocialAccount).filter(SocialAccount.id == post.social_account_id).first()
            if not account or not account.is_connected:
                post.status = "failed"
                post.error_message = "Social account not connected"
                db.commit()
                continue

            try:
                result = await social_service.publish_post(post, account)
                post.status = "posted"
                post.posted_at = now
                post.platform_post_id = result.get("platform_post_id")
                post.post_url = result.get("post_url")
                db.commit()
                upsert_generated_analytics(db, post)
                logger.info(f"Posted {post.id} to {post.platform}: {post.post_url}")
            except Exception as e:
                post.status = "failed"
                post.error_message = str(e)[:500]
                logger.error(f"Failed to post {post.id}: {e}")

            db.commit()
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(
        process_scheduled_posts,
        trigger=IntervalTrigger(minutes=1),
        id="process_scheduled_posts",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started")


def stop_scheduler():
    scheduler.shutdown()
