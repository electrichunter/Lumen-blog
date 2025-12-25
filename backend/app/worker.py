from celery import Celery
from config import settings

celery = Celery(
    "lumen_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Example task
@celery.task
def send_email_task(email: str, subject: str, body: str):
    """
    Mock email sending task
    """
    import time
    # Simulate work
    time.sleep(2)
    print(f"Sending email to {email} with subject '{subject}'")
    return {"status": "sent", "email": email}
