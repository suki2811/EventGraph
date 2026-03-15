import face_recognition
import cv2
import numpy as np

def extract_faces(image_path: str):
    """
    Detects faces in an image and returns a list of embeddings.
    """
    image = face_recognition.load_image_file(image_path)
    
    # Find all the faces and face encodings in the current frame of video
    face_locations = face_recognition.face_locations(image)
    face_encodings = face_recognition.face_encodings(image, face_locations)
    
    faces = []
    for encoding in face_encodings:
        faces.append({
            'embedding': encoding.tolist()
        })
        
    return faces
