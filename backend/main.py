from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Body, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import uvicorn
import graph
from typing import List
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext

# Auth Configuration
SECRET_KEY = "super_secret_eventgraph_key_for_development_only"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    # Verify user exists in db
    db_password = graph.get_user(username)
    if db_password is None:
        raise credentials_exception
    return username

app = FastAPI(title="EventGraph API")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class PhotoUpload(BaseModel):
    filename: str
    embeddings: List[List[float]]

class UserCreate(BaseModel):
    username: str
    password: str

@app.on_event("startup")
async def startup_db_client():
    graph.init_driver()

@app.on_event("shutdown")
async def shutdown_db_client():
    graph.close_driver()

@app.post("/register")
async def register_user(user: UserCreate):
    existing_user = graph.get_user(user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    graph.create_user(user.username, hashed_password)
    return {"message": "User created successfully"}

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    db_password = graph.get_user(form_data.username)
    if not db_password or not verify_password(form_data.password, db_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/upload")
async def upload_embeddings(payload: PhotoUpload, current_user: str = Depends(get_current_user)):
    """
    Receives pre-computed face embeddings from the frontend, scoped to user.
    """
    try:
        for embedding in payload.embeddings:
            graph.add_person_to_photo(current_user, embedding, payload.filename)
        
        return {"status": "success", "count": len(payload.embeddings)}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@app.get("/graph")
async def get_user_graph(current_user: str = Depends(get_current_user)):
    return graph.get_full_graph(current_user)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
