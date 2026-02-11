import asyncio
import httpx
import os

BASE_URL = "http://localhost:8000/v1"
# Login first to get token
from dotenv import load_dotenv
load_dotenv()

async def verify_teams():
    async with httpx.AsyncClient() as client:
        # 1. Login
        # Assuming we have a test user or create one
        # For simplicity, I'll use signup to ensure user exists
        email = f"test_team_{os.urandom(4).hex()}@example.com"
        password = "password123"
        print(f"Creating user {email}...")
        resp = await client.post(f"{BASE_URL}/management/signup", json={
            "email": email, 
            "password": password,
            "name": "Test User"
        })
        if resp.status_code in [200, 201]:
            token = resp.json()["token"]
        else:
            print(f"Signup failed: {resp.status_code} {resp.text}")
            # Login if exists
            resp = await client.post(f"{BASE_URL}/management/login", json={
                "email": email,
                "password": password
            })
            print(f"Login response: {resp.status_code} {resp.text}")
            token = resp.json()["token"]
            
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create Team
        print("Creating team...")
        slug = f"team-{os.urandom(4).hex()}"
        resp = await client.post(f"{BASE_URL}/teams/", json={
            "name": "Test Team 1",
            "slug": slug
        }, headers=headers)
        print(f"Create Team: {resp.status_code}")
        if resp.status_code != 200:
            print(resp.text)
            return
        team = resp.json()
        team_id = team["id"]
        print(f"Team ID: {team_id}")
        
        # 3. List Teams
        print("Listing teams...")
        resp = await client.get(f"{BASE_URL}/teams/", headers=headers)
        print(f"List Teams: {resp.status_code}")
        teams = resp.json()
        print(f"Teams count: {len(teams)}")
        assert len(teams) >= 1
        assert teams[0]["id"] == team_id
        
        # 4. Get Team Details
        print("Getting team details...")
        resp = await client.get(f"{BASE_URL}/teams/{team_id}", headers=headers)
        print(f"Get Team: {resp.status_code}")
        assert resp.json()["id"] == team_id
        
        # 5. Add Member (Self - should fail 'already member')
        print("Adding member (self)...")
        resp = await client.post(f"{BASE_URL}/teams/{team_id}/members", json={
            "email": email,
            "role": "admin"
        }, headers=headers)
        print(f"Add Member (Self): {resp.status_code}")
        assert resp.status_code == 400 # Already in team
        
        # 6. Create another user and add as member
        email2 = f"test_member_{os.urandom(4).hex()}@example.com"
        print(f"Creating user 2 {email2}...")
        await client.post(f"{BASE_URL}/management/signup", json={
            "email": email2, 
            "password": "password123",
            "name": "Member User"
        })
        
        print("Adding member 2...")
        resp = await client.post(f"{BASE_URL}/teams/{team_id}/members", json={
            "email": email2,
            "role": "viewer"
        }, headers=headers)
        print(f"Add Member 2: {resp.status_code}")
        if resp.status_code != 200:
            print(resp.text)
        
        # 7. List Members
        print("Listing members...")
        resp = await client.get(f"{BASE_URL}/teams/{team_id}/members", headers=headers)
        members = resp.json()
        print(f"Members count: {len(members)}")
        assert len(members) == 2

if __name__ == "__main__":
    asyncio.run(verify_teams())
