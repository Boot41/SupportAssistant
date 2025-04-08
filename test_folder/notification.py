import requests
import json

# Replace this with your actual webhook URL
WEBHOOK_URL = "https://chat.googleapis.com/v1/spaces/AAQAys6OFTM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=CCLGglbxyz8fMv0jdHhevoAp4VswRaakxnc9w-qRzFU"

def send_google_chat_notification(message: str):
    headers = {"Content-Type": "application/json"}
    data = {
        "cards": [
            {
                "header": {
                    "title": "🚨 Recruit41 Notification",
                    "subtitle": "Automated Alert System",
                    "imageUrl": "https://www.gstatic.com/images/icons/material/system/2x/notifications_active_black_48dp.png",
                    "imageStyle": "IMAGE"
                },
                "sections": [
                    {
                        "widgets": [
                            {
                                "textParagraph": {
                                    "text": f"<b>Message:</b> {message}"
                                }
                            },
                            {
                                "buttons": [
                                    {
                                        "textButton": {
                                            "text": "View Dashboard",
                                            "onClick": {
                                                "openLink": {
                                                    "url": "https://localhost:3000/signin"
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }

    response = requests.post(WEBHOOK_URL, headers=headers, data=json.dumps(data))

    if response.status_code == 200:
        print("✅ Notification sent successfully.")
    else:
        print(f"❌ Failed to send notification: {response.status_code} - {response.text}")

# Example usage
send_google_chat_notification("🚀 Notification system is now live!")