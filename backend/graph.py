from neo4j import GraphDatabase
import os
import uuid

# Configuration
URI = os.getenv("NEO4J_URI", "neo4j+ssc://fac50b14.databases.neo4j.io")
USER = os.getenv("NEO4J_USER", "fac50b14")
PASSWORD = os.getenv("NEO4J_PASSWORD", "Z_zzI6fdN9dxxIgTvmknLdBhzVPb13yJK08QMqSl7mc")

driver = None
DISTANCE_THRESHOLD = 0.6

def init_driver():
    global driver
    try:
        print(f"Attempting to connect to: {URI} as {USER}")
        # Explicitly setting trust to system CAs for Aura
        driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
        driver.verify_connectivity()
        print("Connected to Neo4j successfully")
    except Exception as e:
        print(f"Failed to connect to Neo4j: {e}")
        if "routing" in str(e).lower():
            print("Tip: If you're on a restricted network, check if port 7687 is open.")

def close_driver():
    if driver:
        driver.close()

def create_user(username, hashed_password):
    with driver.session() as session:
        return session.execute_write(_create_user_tx, username, hashed_password)

def _create_user_tx(tx, username, hashed_password):
    query = """
    MERGE (u:User {username: $username})
    ON CREATE SET u.hashed_password = $hashed_password
    RETURN u.username
    """
    result = tx.run(query, username=username, hashed_password=hashed_password)
    return result.single() is not None

def get_user(username):
    with driver.session() as session:
        return session.execute_read(_get_user_tx, username)

def _get_user_tx(tx, username):
    query = "MATCH (u:User {username: $username}) RETURN u.hashed_password AS pwd"
    result = tx.run(query, username=username)
    record = result.single()
    return record["pwd"] if record else None

def add_person_to_photo(username, embedding, photo_url):
    with driver.session() as session:
        session.execute_write(_match_and_link_person, username, embedding, photo_url)

def _match_and_link_person(tx, username, embedding, photo_url):
    # 1. Find the closest person belonging to this user
    query_match = (
        "MATCH (u:User {username: $username})-[:OWNS_PERSON]->(p:Person) "
        "WITH p, "
        "     reduce(s = 0.0, i IN range(0, size($embedding)-1) | s + (p.embedding[i] - $embedding[i])^2) AS distSq "
        "WHERE sqrt(distSq) < $threshold "
        "RETURN p ORDER BY distSq LIMIT 1"
    )
    result = tx.run(query_match, username=username, embedding=embedding, threshold=DISTANCE_THRESHOLD)
    record = result.single()

    if record:
        person_id = record["p"]["id"]
        # Link existing person to photo under this user
        tx.run(
            "MATCH (u:User {username: $username}) "
            "MERGE (ph:Photo {url: $photo_url}) "
            "MERGE (u)-[:OWNS_PHOTO]->(ph) "
            "MATCH (u)-[:OWNS_PERSON]->(p:Person {id: $person_id}) "
            "MERGE (p)-[:APPEARS_IN]->(ph)",
            username=username, photo_url=photo_url, person_id=person_id
        )
    else:
        # Create new person for this user
        person_id = str(uuid.uuid4())
        tx.run(
            "MATCH (u:User {username: $username}) "
            "MERGE (ph:Photo {url: $photo_url}) "
            "MERGE (u)-[:OWNS_PHOTO]->(ph) "
            "CREATE (p:Person {id: $person_id, embedding: $embedding, name: 'Person ' + substring($person_id, 0, 4)}) "
            "MERGE (u)-[:OWNS_PERSON]->(p) "
            "MERGE (p)-[:APPEARS_IN]->(ph)",
            username=username, photo_url=photo_url, person_id=person_id, embedding=embedding
        )

def get_full_graph(username):
    with driver.session() as session:
        return session.execute_read(_get_graph_data, username)

def _get_graph_data(tx, username):
    # Fetch only people and photos belonging to the specific user
    query = (
        "MATCH (u:User {username: $username}) "
        "MATCH (u)-[:OWNS_PERSON]->(p:Person)-[:APPEARS_IN]->(ph:Photo)<-[:OWNS_PHOTO]-(u) "
        "RETURN p, ph"
    )
    result = tx.run(query, username=username)
    
    nodes = {}
    links = []
    
    for record in result:
        p = record["p"]
        ph = record["ph"]
        
        p_id = p["id"]
        ph_id = ph["url"] # Using URL/filename as ID for photos
        
        if p_id not in nodes:
            nodes[p_id] = {"id": p_id, "name": p.get("name", "Unknown"), "color": "#6366f1", "val": 8}
        
        if ph_id not in nodes:
            nodes[ph_id] = {"id": ph_id, "name": ph_id.split("/")[-1], "color": "#ec4899", "val": 4}
            
        links.append({"source": p_id, "target": ph_id})
        
    return {"nodes": list(nodes.values()), "links": links}
