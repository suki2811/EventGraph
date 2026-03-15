from neo4j import GraphDatabase
import os

URI = "neo4j+ssc://fac50b14.databases.neo4j.io"
PASSWORD = "Z_zzl6fdN9dxxlgTvmknLdBhzVPbl3yJK08QMqSl7mc"
USERNAMES = ["neo4j", "fac50b14"]

for user in USERNAMES:
    print(f"Testing {user}...")
    try:
        driver = GraphDatabase.driver(URI, auth=(user, PASSWORD))
        driver.verify_connectivity()
        print(f"SUCCESS! Username is {user}")
        driver.close()
        break
    except Exception as e:
        print(f"Failed for {user}: {e}")
