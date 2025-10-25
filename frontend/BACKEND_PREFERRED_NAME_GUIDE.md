# Backend Implementation Guide: Preferred Name Feature

## Overview

This guide provides complete backend implementation for the "Preferred Name" feature, allowing users to set a nickname that Diajeng (the AI assistant) will use in conversations.

---

## Part 1: Database Migration

**File:** Run the SQL migration script

```bash
# Connect to database
psql -h 172.16.1.7 -U notaku_user -d notaku_db

# Run migration
\i BACKEND_MIGRATION_preferred_name.sql
```

Or manually:

```sql
-- Add column
ALTER TABLE users ADD COLUMN preferred_name VARCHAR(100);

-- Populate existing users
UPDATE users 
SET preferred_name = SPLIT_PART(full_name, ' ', 1) 
WHERE full_name IS NOT NULL AND full_name != '' AND preferred_name IS NULL;

UPDATE users 
SET preferred_name = username 
WHERE preferred_name IS NULL;

-- Add index
CREATE INDEX idx_users_preferred_name ON users(preferred_name);
```

---

## Part 2: Update User Model

**File:** `/var/www/notaku-api/app/models/user.py`

```python
from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String)
    preferred_name = Column(String(100))  # ✅ ADD THIS LINE
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<User(username={self.username}, email={self.email})>"
    
    def to_dict(self):
        """Convert user to dictionary for API responses"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "preferred_name": self.preferred_name,  # ✅ ADD THIS LINE
            "is_premium": self.is_premium,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
```

---

## Part 3: Update Registration Endpoint

**File:** `/var/www/notaku-api/app/routers/auth.py`

### Update Pydantic Models

```python
from pydantic import BaseModel, EmailStr, validator
from typing import Optional

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None
    preferred_name: Optional[str] = None  # ✅ ADD THIS LINE
    
    @validator('username')
    def validate_username(cls, v):
        if not v or len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not v.isalnum() and '_' not in v:
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v.lower()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v
    
    @validator('preferred_name')
    def validate_preferred_name(cls, v):
        if v and len(v) > 100:
            raise ValueError('Preferred name must be less than 100 characters')
        return v.strip() if v else None

class RegisterResponse(BaseModel):
    message: str
    user: dict
```

### Update Registration Handler

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.auth import hash_password
import uuid

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/register", response_model=RegisterResponse)
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user with optional preferred name
    """
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = db.query(User).filter(User.username == data.username.lower()).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # ✅ SMART PREFERRED NAME LOGIC
    # Priority: 1) provided preferred_name, 2) first word of full_name, 3) username
    preferred_name = data.preferred_name
    
    if not preferred_name and data.full_name:
        # Extract first name from full_name
        preferred_name = data.full_name.split()[0] if data.full_name.strip() else None
    
    if not preferred_name:
        # Fallback to username
        preferred_name = data.username
    
    # Create new user
    new_user = User(
        id=str(uuid.uuid4()),
        email=data.email,
        username=data.username.lower(),
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        preferred_name=preferred_name,  # ✅ ADD THIS LINE
        is_premium=False,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "Registration successful",
        "user": new_user.to_dict()
    }
```

---

## Part 4: Update Profile Endpoints

**File:** `/var/www/notaku-api/app/routers/user.py` (or create if doesn't exist)

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/v1/user", tags=["user"])

# ============================================
# PYDANTIC MODELS
# ============================================

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    preferred_name: Optional[str] = None  # ✅ ADD THIS
    
    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "Ari Wibowo",
                "preferred_name": "Ari"
            }
        }

class ProfileResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str]
    preferred_name: Optional[str]  # ✅ ADD THIS
    is_premium: bool
    created_at: str
    updated_at: Optional[str]

# ============================================
# ENDPOINTS
# ============================================

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """
    Get current user's profile
    """
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "preferred_name": current_user.preferred_name,  # ✅ ADD THIS
        "is_premium": current_user.is_premium,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else None,
    }

@router.put("/profile")
async def update_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile (full_name and preferred_name)
    """
    updated_fields = []
    
    # Update full_name if provided
    if data.full_name is not None:
        current_user.full_name = data.full_name.strip() if data.full_name else None
        updated_fields.append("full_name")
    
    # ✅ UPDATE PREFERRED_NAME
    if data.preferred_name is not None:
        # Validate length
        if len(data.preferred_name) > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Preferred name must be less than 100 characters"
            )
        
        current_user.preferred_name = data.preferred_name.strip() if data.preferred_name else None
        updated_fields.append("preferred_name")
    
    # Commit changes
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Profile updated successfully",
        "updated_fields": updated_fields,
        "user": current_user.to_dict()
    }
```

---

## Part 5: Update Chat Router

**File:** `/var/www/notaku-api/app/routers/chat.py`

### Update Quick Response Function

Find the `get_quick_response` function (around line 50-100) and update it:

```python
def get_quick_response(message: str, display_name: str) -> Optional[str]:  # ✅ CHANGE PARAMETER NAME
    """
    Generate quick template responses for common questions
    Uses display_name (preferred_name) for personalization
    """
    message_lower = message.lower().strip()
    
    # Greetings
    greetings = ["halo", "hai", "hi", "hello", "hey", "pagi", "siang", "sore", "malam"]
    if any(greeting in message_lower for greeting in greetings):
        return f"👋 Hai {display_name}! Senang bertemu denganmu! Ada yang bisa saya bantu hari ini?"
    
    # Help requests
    help_keywords = ["bantuan", "help", "tolong", "bisa apa"]
    if any(keyword in message_lower for keyword in help_keywords):
        return f"""Tentu {display_name}! 😊 Saya bisa membantu:

📊 **Analisis Keuangan**
- Cek total pengeluaran
- Lihat kategori spending terbesar
- Bandingkan bulan ini vs bulan lalu

💰 **Budgeting**
- Buat budget bulanan
- Track progress budget
- Tips hemat biaya

📈 **Insights**
- Tren pengeluaran
- Pola spending
- Rekomendasi optimasi

Mau mulai dari mana, {display_name}?"""
    
    # Thank you
    thanks = ["terima kasih", "thanks", "makasih", "thx"]
    if any(thank in message_lower for thank in thanks):
        return f"Sama-sama {display_name}! 😊 Senang bisa membantu. Ada lagi yang mau ditanyakan?"
    
    return None
```

### Update Chat Endpoint

Find the main chat endpoint (around line 200-300) and update it:

```python
@router.post("/")
async def chat(
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Main chat endpoint - uses preferred_name for personalization
    """
    try:
        # ✅ GET DISPLAY NAME (preferred_name with fallback)
        display_name = current_user.preferred_name or current_user.username
        
        print(f"[Chat] User: {current_user.username}")
        print(f"[Chat] Display name: {display_name}")  # ✅ ADD LOG
        print(f"[Chat] Message: {data.message}")
        
        # Check for quick responses first
        quick_reply = get_quick_response(data.message, display_name)  # ✅ USE display_name
        
        if quick_reply:
            print(f"[Chat] Using quick response")
            return {
                "response": quick_reply,
                "context": data.context + [
                    {"role": "user", "content": data.message},
                    {"role": "assistant", "content": quick_reply}
                ]
            }
        
        # ✅ BUILD MESSAGES WITH PERSONALIZED SYSTEM PROMPT
        messages = []
        
        # System prompt with preferred name
        messages.append({
            "role": "system",
            "content": f"""Kamu adalah Diajeng, asisten keuangan pribadi untuk {display_name}. 

🎯 PENTING: Selalu panggil user dengan nama "{display_name}" dalam percakapan!

Contoh sapaan natural:
✅ "Hai {display_name}! Yuk kita review spending kamu"
✅ "{display_name}, budget bulan ini sudah Rp..."
✅ "Saya analisis pengeluaran {display_name} ya"
✅ "Oke {display_name}, saya bantu cek"

JANGAN gunakan:
❌ "Anda bisa coba..."
❌ "Kamu bisa..." (tanpa nama)
❌ Panggilan formal/kaku

Tugasmu:
- Membantu {display_name} mengelola keuangan dan pengeluaran
- Memberikan saran budgeting yang praktis dan actionable
- Menganalisis pola pengeluaran {display_name}
- Memberikan tips hemat yang konkret

Gaya komunikasi:
- Ramah, akrab, dan supportive
- Gunakan emoji untuk engaging (tapi jangan berlebihan)
- SELALU panggil "{display_name}" untuk personal touch
- Bahasa Indonesia yang natural dan casual
- Jawaban konkret dan actionable, bukan abstrak
- Fokus pada solusi praktis

Data yang tersedia:
- Transaksi dan pengeluaran {display_name}
- Kategori spending
- Supplier/merchant
- Budget tracking

Fokus: Bantu {display_name} capai tujuan keuangan dengan cara yang friendly dan praktis! 💰✨"""
        })
        
        # Add conversation context
        if data.context:
            messages.extend(data.context[-10:])  # Last 10 messages for context
        
        # Add current message
        messages.append({
            "role": "user",
            "content": data.message
        })
        
        print(f"[Chat] Sending to Ollama with {len(messages)} messages")
        
        # Call Ollama API
        ollama_response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                }
            },
            timeout=60
        )
        
        if ollama_response.status_code != 200:
            print(f"[Chat] Ollama error: {ollama_response.status_code}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI service unavailable"
            )
        
        ai_message = ollama_response.json()["message"]["content"]
        print(f"[Chat] AI response: {ai_message[:100]}...")
        
        # Return response with updated context
        return {
            "response": ai_message,
            "context": data.context + [
                {"role": "user", "content": data.message},
                {"role": "assistant", "content": ai_message}
            ]
        }
        
    except requests.exceptions.Timeout:
        print("[Chat] Ollama timeout")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI response timeout"
        )
    except Exception as e:
        print(f"[Chat] Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
```

---

## Part 6: Register User Router (if not already)

**File:** `/var/www/notaku-api/app/main.py`

Make sure the user router is registered:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, chat, user  # ✅ ADD user

app = FastAPI(title="NotaKu API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://notaku.cloud", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(user.router)  # ✅ ADD THIS LINE

@app.get("/")
async def root():
    return {"message": "NotaKu API", "version": "1.0.0"}
```

---

## Testing

### 1. Test Database Migration

```bash
psql -h 172.16.1.7 -U notaku_user -d notaku_db

-- Check column exists
\d users

-- Check data
SELECT username, full_name, preferred_name FROM users LIMIT 5;
```

### 2. Test Registration

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "full_name": "Ari Wibowo",
    "preferred_name": "Ari"
  }'
```

Expected response:
```json
{
  "message": "Registration successful",
  "user": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "full_name": "Ari Wibowo",
    "preferred_name": "Ari",
    "is_premium": false
  }
}
```

### 3. Test Profile GET

```bash
curl -X GET http://localhost:8000/api/v1/user/profile \
  -H "Cookie: session=YOUR_SESSION_COOKIE"
```

### 4. Test Profile UPDATE

```bash
curl -X PUT http://localhost:8000/api/v1/user/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_COOKIE" \
  -d '{
    "full_name": "Ari Wibowo Santoso",
    "preferred_name": "Ari"
  }'
```

### 5. Test Chat with Preferred Name

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_COOKIE" \
  -d '{
    "message": "Halo",
    "context": []
  }'
```

Expected response should include the preferred name:
```json
{
  "response": "👋 Hai Ari! Senang bertemu denganmu! Ada yang bisa saya bantu hari ini?",
  "context": [...]
}
```

---

## Deployment Checklist

- [ ] Database migration applied
- [ ] User model updated
- [ ] Registration endpoint updated
- [ ] Profile endpoints created/updated
- [ ] Chat router updated
- [ ] User router registered in main.py
- [ ] Backend restarted
- [ ] Tested with curl/Postman
- [ ] All existing users have preferred_name set
- [ ] Chat responses use preferred_name

---

## Rollback Plan

If something goes wrong:

```sql
-- Remove index
DROP INDEX IF EXISTS idx_users_preferred_name;

-- Remove column
ALTER TABLE users DROP COLUMN IF EXISTS preferred_name;
```

Then revert code changes and restart backend.

---

## Success Criteria

✅ New users can register with preferred_name  
✅ Existing users have default preferred_name  
✅ Users can update preferred_name via profile  
✅ Chat AI uses preferred_name in responses  
✅ Fallback to username if preferred_name is null  
✅ No breaking changes to existing functionality  

---

**Status:** Ready for implementation! 🚀
