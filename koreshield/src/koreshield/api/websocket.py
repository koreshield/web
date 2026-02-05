"""
WebSocket API for real-time event streaming.

Provides real-time updates for:
- Threat detection events
- Provider health changes
- Cost threshold alerts
- System status updates
"""

import json
import asyncio
from typing import Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends, status
from fastapi.responses import JSONResponse
import structlog
import redis.asyncio as aioredis

from ..auth import verify_jwt_token

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])

# Redis client for pub/sub (will be initialized from main app)
redis_client: aioredis.Redis | None = None


class ConnectionManager:
    """Manages WebSocket connections and message broadcasting."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_subscriptions: Dict[str, set[str]] = {}  # user_id -> set of event types
    
    async def connect(self, websocket: WebSocket, user_id: str, client_id: str):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.user_subscriptions.setdefault(user_id, set())
        logger.info("websocket_connected", user_id=user_id, client_id=client_id)
    
    def disconnect(self, client_id: str, user_id: str):
        """Remove a WebSocket connection."""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if user_id in self.user_subscriptions and not any(
            cid.startswith(user_id) for cid in self.active_connections
        ):
            # Remove user subscriptions if no more connections
            del self.user_subscriptions[user_id]
        logger.info("websocket_disconnected", user_id=user_id, client_id=client_id)
    
    async def send_personal_message(self, message: Dict[str, Any], client_id: str):
        """Send a message to a specific client."""
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error("websocket_send_error", client_id=client_id, error=str(e))
    
    async def broadcast(self, message: Dict[str, Any], event_type: str | None = None):
        """Broadcast a message to all connected clients."""
        disconnected_clients = []
        
        for client_id, websocket in self.active_connections.items():
            try:
                # If event type is specified, only send to subscribed users
                if event_type:
                    user_id = client_id.split("_")[0]  # Extract user_id from client_id
                    if user_id in self.user_subscriptions and event_type in self.user_subscriptions[user_id]:
                        await websocket.send_json(message)
                else:
                    # Broadcast to all
                    await websocket.send_json(message)
            except Exception as e:
                logger.error("websocket_broadcast_error", client_id=client_id, error=str(e))
                disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            user_id = client_id.split("_")[0]
            self.disconnect(client_id, user_id)
    
    def subscribe(self, user_id: str, event_types: list[str]):
        """Subscribe a user to specific event types."""
        if user_id not in self.user_subscriptions:
            self.user_subscriptions[user_id] = set()
        self.user_subscriptions[user_id].update(event_types)


manager = ConnectionManager()


async def verify_ws_token(token: str) -> Dict[str, Any]:
    """Verify JWT token for WebSocket authentication."""
    try:
        # Use existing JWT verification from auth module
        user = verify_jwt_token(token)
        return user
    except Exception as e:
        logger.error("websocket_auth_failed", error=str(e))
        raise


@router.websocket("/events")
async def websocket_events(
    websocket: WebSocket,
    token: str = Query(..., description="JWT authentication token"),
):
    """
    WebSocket endpoint for real-time event streaming.
    
    Authentication:
        - Requires valid JWT token in query parameter
        
    Event Types:
        - threat_detected: New threat detection event
        - provider_health_change: Provider health status update
        - cost_threshold_alert: Cost threshold exceeded
        - system_status_update: System component status change
    
    Message Format:
        {
            "type": "threat_detected",
            "timestamp": "2026-02-05T10:30:00Z",
            "data": {
                "threat_id": "...",
                "severity": "high",
                "attack_type": "prompt_injection",
                ...
            }
        }
    """
    client_id = None
    user_id = None
    
    try:
        # Verify JWT token
        user = await verify_ws_token(token)
        user_id = user.get("id", "unknown")
        client_id = f"{user_id}_{id(websocket)}"
        
        # Accept connection
        await manager.connect(websocket, user_id, client_id)
        
        # Send welcome message
        await websocket.send_json({
            "type": "connection_established",
            "timestamp": "2026-02-05T10:00:00Z",  # Will use real timestamp in production
            "data": {
                "user_id": user_id,
                "message": "Connected to KoreShield real-time event stream"
            }
        })
        
        # Start Redis pub/sub listener in background
        if redis_client:
            asyncio.create_task(redis_pubsub_listener(client_id, user_id))
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Receive messages from client (for subscription management)
                data = await websocket.receive_json()
                
                if data.get("action") == "subscribe":
                    # Allow clients to subscribe to specific event types
                    event_types = data.get("event_types", [])
                    manager.subscribe(user_id, event_types)
                    await websocket.send_json({
                        "type": "subscription_updated",
                        "data": {"subscribed_to": event_types}
                    })
                    logger.info("websocket_subscription_updated", user_id=user_id, event_types=event_types)
                
                elif data.get("action") == "ping":
                    # Heartbeat
                    await websocket.send_json({"type": "pong"})
                    
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "data": {"message": "Invalid JSON format"}
                })
    
    except Exception as e:
        logger.error("websocket_error", user_id=user_id, error=str(e))
        if websocket.client_state.value == 1:  # CONNECTED
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
    
    finally:
        if client_id and user_id:
            manager.disconnect(client_id, user_id)


async def redis_pubsub_listener(client_id: str, user_id: str):
    """
    Listen to Redis pub/sub channel and forward events to WebSocket client.
    """
    if not redis_client:
        logger.warning("redis_client_not_initialized")
        return
    
    try:
        pubsub = redis_client.pubsub()
        await pubsub.subscribe("koreshield:events")
        
        logger.info("redis_pubsub_started", user_id=user_id, client_id=client_id)
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    event_data = json.loads(message["data"])
                    await manager.send_personal_message(event_data, client_id)
                except json.JSONDecodeError:
                    logger.error("redis_message_decode_error", message=message)
                except Exception as e:
                    logger.error("redis_message_forward_error", error=str(e))
    
    except Exception as e:
        logger.error("redis_pubsub_error", user_id=user_id, error=str(e))
    
    finally:
        await pubsub.unsubscribe("koreshield:events")
        await pubsub.close()


async def publish_event(event_type: str, data: Dict[str, Any]):
    """
    Publish an event to all connected WebSocket clients via Redis pub/sub.
    
    Args:
        event_type: Type of event (threat_detected, provider_health_change, etc.)
        data: Event data payload
    """
    if not redis_client:
        logger.warning("redis_client_not_initialized_cannot_publish")
        return
    
    event = {
        "type": event_type,
        "timestamp": "2026-02-05T10:00:00Z",  # Will use datetime.utcnow() in production
        "data": data
    }
    
    try:
        await redis_client.publish("koreshield:events", json.dumps(event))
        logger.info("event_published", event_type=event_type)
    except Exception as e:
        logger.error("event_publish_error", event_type=event_type, error=str(e))


# Health check endpoint for WebSocket service
@router.get("/health")
async def websocket_health():
    """Check WebSocket service health."""
    return JSONResponse({
        "status": "healthy",
        "active_connections": len(manager.active_connections),
        "redis_connected": redis_client is not None
    })


def set_redis_client(client: aioredis.Redis):
    """Set the Redis client for pub/sub (called from main app)."""
    global redis_client
    redis_client = client
    logger.info("redis_client_initialized_for_websocket")
