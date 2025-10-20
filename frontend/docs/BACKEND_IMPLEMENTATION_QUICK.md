# 🚀 Backend API Implementation - Quick Guide

Step-by-step guide to implement required endpoints.

**Location:** `/var/www/notaku-api/app/`

---

## 📦 Required Packages

```bash
pip install fastapi sqlalchemy psycopg2-binary python-jose[cryptography] passlib[bcrypt] python-multipart
```

---

## 1. Project Structure

```
/var/www/notaku-api/app/
├── main.py              # Already exists
├── database.py          # NEW
├── models/              # NEW
│   ├── user.py
│   ├── note.py
│   └── receipt.py
├── routers/             # NEW
│   ├── auth.py
│   ├── notes.py
│   ├── receipts.py
│   └── chat.py
└── utils/               # NEW
    ├── security.py
    └── dependencies.py
```

---

## 2. Create Files

### `database.py`
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://user:pass@localhost:5432/notaku"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### `utils/security.py`
```python
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key-change-this"
ALGORITHM = "HS256"

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

### `models/user.py`
```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))
```

### `routers/auth.py`
```python
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
from models.user import User
from utils.security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

class UserReg(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(data: UserReg, response: Response, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Email exists")
    
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=get_password_hash(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token({"sub": str(user.id)})
    response.set_cookie("session", token, httponly=True, secure=True, samesite="lax", max_age=1800)
    
    return {"user": user, "message": "Registered"}

@router.post("/login")
def login(data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    
    token = create_access_token({"sub": str(user.id)})
    response.set_cookie("session", token, httponly=True, secure=True, samesite="lax", max_age=1800)
    
    return {"user": user, "message": "Logged in"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("session")
    return {"message": "Logged out"}

@router.get("/me")
def get_me(session: str = Cookie(None), db: Session = Depends(get_db)):
    if not session:
        raise HTTPException(401, "Not authenticated")
    
    from jose import jwt
    from utils.security import SECRET_KEY, ALGORITHM
    
    try:
        payload = jwt.decode(session, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(404, "User not found")
        return user
    except:
        raise HTTPException(401, "Invalid token")
```

---

## 3. Update `main.py`

Add at the end of your existing `main.py`:

```python
# Import routers
from routers import auth
from database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

# Include router
app.include_router(auth.router)
```

---

## 4. Create Database Tables

```bash
# SSH to server
cd /var/www/notaku-api/app

# Create tables
python3 -c "from database import engine, Base; from models.user import User; Base.metadata.create_all(bind=engine)"
```

---

## 5. Restart Service

```bash
sudo systemctl restart notaku-api.service
```

---

## 6. Test

```bash
# Test register
curl -X POST https://api.notaku.cloud/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# Test login
curl -X POST https://api.notaku.cloud/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## Next: Notes, Receipts, Chat

See full guide: `BACKEND_API_IMPLEMENTATION.md`

**Status:** Auth endpoints ready! 🎉
