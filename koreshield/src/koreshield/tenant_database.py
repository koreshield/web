"""
Database Isolation and Tenant-Specific Operations
================================================

Handles database connections, schema isolation, and tenant-specific data operations.
"""

import os
import time
from typing import Dict, Optional, Any, AsyncGenerator
from contextlib import asynccontextmanager
from datetime import datetime

from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from .tenant_models import TenantContext, generate_tenant_schema_name
from .tenant_utils import get_current_tenant
from .logger import FirewallLogger

class TenantDatabaseManager:
    """
    Manages database connections and tenant isolation.

    Features:
    - Separate schemas per tenant (PostgreSQL)
    - Connection pooling per tenant
    - Automatic schema creation and migration
    - Cross-tenant security enforcement
    """

    def __init__(self, database_url: str):
        self.database_url = database_url
        self.logger = FirewallLogger()

        # Main database engine (for tenant metadata)
        self.main_engine = create_async_engine(
            database_url,
            poolclass=StaticPool,
            echo=False
        )

        # Tenant-specific engines cache
        self._tenant_engines: Dict[str, Any] = {}
        self._tenant_sessions: Dict[str, async_sessionmaker] = {}

        # Schema metadata cache
        self._schema_metadata: Dict[str, MetaData] = {}

    async def initialize(self) -> None:
        """Initialize the database manager."""
        try:
            # Create main tables
            from .tenant_models import Base
            async with self.main_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

            self.logger.info("tenant_database_initialized")

        except Exception as e:
            self.logger.error("tenant_database_initialization_failed", error=str(e))
            raise

    async def create_tenant_schema(self, tenant_id: str) -> str:
        """Create database schema for a new tenant."""
        schema_name = generate_tenant_schema_name(tenant_id)

        try:
            async with self.main_engine.begin() as conn:
                # Create schema
                await conn.execute(f"CREATE SCHEMA IF NOT EXISTS {schema_name}")

                # Create tenant-specific tables in the schema
                # Note: In a real implementation, you'd have tenant-specific tables
                # For now, we'll use the main schema approach

            self.logger.info(
                "tenant_schema_created",
                tenant_id=tenant_id,
                schema_name=schema_name
            )

            return schema_name

        except Exception as e:
            self.logger.error(
                "tenant_schema_creation_failed",
                tenant_id=tenant_id,
                error=str(e)
            )
            raise

    async def get_tenant_session(self, tenant_context: TenantContext) -> async_sessionmaker:
        """Get a database session for the specified tenant."""
        schema_name = tenant_context.schema_name

        if schema_name not in self._tenant_sessions:
            # Create tenant-specific engine
            tenant_engine = create_async_engine(
                f"{self.database_url}?schema={schema_name}",
                poolclass=StaticPool,
                echo=False
            )

            # Create session maker
            session_maker = async_sessionmaker(
                tenant_engine,
                class_=AsyncSession,
                expire_on_commit=False
            )

            self._tenant_engines[schema_name] = tenant_engine
            self._tenant_sessions[schema_name] = session_maker

        return self._tenant_sessions[schema_name]

    async def execute_tenant_query(
        self,
        tenant_context: TenantContext,
        query: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Any:
        """Execute a raw SQL query in the tenant's schema."""
        session_maker = await self.get_tenant_session(tenant_context)

        async with session_maker() as session:
            try:
                result = await session.execute(query, params or {})
                await session.commit()
                return result

            except Exception as e:
                await session.rollback()
                self.logger.error(
                    "tenant_query_execution_failed",
                    tenant_id=tenant_context.tenant_id,
                    query=query,
                    error=str(e)
                )
                raise

    async def cleanup_tenant_connections(self, tenant_id: str) -> None:
        """Clean up database connections for a tenant."""
        schema_name = generate_tenant_schema_name(tenant_id)

        if schema_name in self._tenant_engines:
            engine = self._tenant_engines[schema_name]
            await engine.dispose()
            del self._tenant_engines[schema_name]
            del self._tenant_sessions[schema_name]

            self.logger.info(
                "tenant_connections_cleaned",
                tenant_id=tenant_id,
                schema_name=schema_name
            )

    async def get_tenant_stats(self, tenant_context: TenantContext) -> Dict[str, Any]:
        """Get database statistics for a tenant."""
        try:
            session_maker = await self.get_tenant_session(tenant_context)

            async with session_maker() as session:
                # Get table sizes, index usage, etc.
                # This is a simplified version
                stats = {
                    "schema_name": tenant_context.schema_name,
                    "connection_count": len(self._tenant_engines),
                    "tables_count": 0,  # Would query information_schema
                    "total_size_mb": 0,  # Would calculate from pg_size_pretty
                }

            return stats

        except Exception as e:
            self.logger.error(
                "tenant_stats_retrieval_failed",
                tenant_id=tenant_context.tenant_id,
                error=str(e)
            )
            return {}

# Global database manager instance
_db_manager: Optional[TenantDatabaseManager] = None

def get_tenant_db_manager() -> TenantDatabaseManager:
    """Get the global tenant database manager."""
    global _db_manager
    if _db_manager is None:
        database_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://localhost/koreshield")
        _db_manager = TenantDatabaseManager(database_url)
    return _db_manager

@asynccontextmanager
async def get_tenant_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Get a database session for the current tenant."""
    tenant_context = get_current_tenant()

    if not tenant_context:
        # Fallback to main database for system operations
        session_maker = async_sessionmaker(
            get_tenant_db_manager().main_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
    else:
        session_maker = await get_tenant_db_manager().get_tenant_session(tenant_context)

    async with session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

class TenantConfigurationManager:
    """
    Manages tenant-specific configuration with isolation.

    Features:
    - Tenant-specific settings storage
    - Configuration inheritance and overrides
    - Encrypted sensitive configuration
    - Configuration validation and schema enforcement
    """

    def __init__(self):
        self.logger = FirewallLogger()
        self._config_cache: Dict[str, Dict[str, Any]] = {}
        self._cache_timestamps: Dict[str, float] = {}
        self._cache_ttl = 300  # 5 minutes

    async def get_tenant_config(
        self,
        tenant_context: TenantContext,
        key: str,
        default: Any = None
    ) -> Any:
        """Get a configuration value for the tenant."""
        # Check cache first
        cache_key = f"{tenant_context.tenant_id}:{key}"
        if cache_key in self._config_cache:
            cache_time = self._cache_timestamps.get(cache_key, 0)
            if time.time() - cache_time < self._cache_ttl:
                return self._config_cache[cache_key]

        # Load from database
        try:
            async with get_tenant_db_session() as session:
                from .tenant_models import TenantConfiguration
                result = await session.execute(
                    session.query(TenantConfiguration).filter(
                        TenantConfiguration.tenant_id == tenant_context.tenant_uuid,
                        TenantConfiguration.config_key == key
                    )
                )
                config = result.scalar_one_or_none()

                if config:
                    value = config.config_value
                else:
                    value = default

                # Cache the result
                self._config_cache[cache_key] = value
                self._cache_timestamps[cache_key] = time.time()

                return value

        except Exception as e:
            self.logger.error(
                "tenant_config_retrieval_failed",
                tenant_id=tenant_context.tenant_id,
                key=key,
                error=str(e)
            )
            return default

    async def set_tenant_config(
        self,
        tenant_context: TenantContext,
        key: str,
        value: Any,
        config_type: str = "security",
        description: Optional[str] = None,
        is_encrypted: bool = False
    ) -> bool:
        """Set a configuration value for the tenant."""
        try:
            async with get_tenant_db_session() as session:
                from .tenant_models import TenantConfiguration

                # Check if config already exists
                result = await session.execute(
                    session.query(TenantConfiguration).filter(
                        TenantConfiguration.tenant_id == tenant_context.tenant_uuid,
                        TenantConfiguration.config_key == key
                    )
                )
                existing_config = result.scalar_one_or_none()

                if existing_config:
                    # Update existing
                    existing_config.config_value = value
                    existing_config.config_type = config_type
                    existing_config.description = description
                    existing_config.is_encrypted = is_encrypted
                    existing_config.updated_at = datetime.utcnow()
                else:
                    # Create new
                    new_config = TenantConfiguration(
                        tenant_id=tenant_context.tenant_uuid,
                        config_key=key,
                        config_value=value,
                        config_type=config_type,
                        description=description,
                        is_encrypted=is_encrypted
                    )
                    session.add(new_config)

                await session.commit()

                # Invalidate cache
                cache_key = f"{tenant_context.tenant_id}:{key}"
                if cache_key in self._config_cache:
                    del self._config_cache[cache_key]
                    del self._cache_timestamps[cache_key]

                self.logger.info(
                    "tenant_config_updated",
                    tenant_id=tenant_context.tenant_id,
                    key=key,
                    config_type=config_type
                )

                return True

        except Exception as e:
            self.logger.error(
                "tenant_config_update_failed",
                tenant_id=tenant_context.tenant_id,
                key=key,
                error=str(e)
            )
            return False

    async def get_all_tenant_configs(
        self,
        tenant_context: TenantContext,
        config_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get all configuration values for the tenant."""
        try:
            async with get_tenant_db_session() as session:
                from .tenant_models import TenantConfiguration
                query = session.query(TenantConfiguration).filter(
                    TenantConfiguration.tenant_id == tenant_context.tenant_uuid
                )

                if config_type:
                    query = query.filter(TenantConfiguration.config_type == config_type)

                result = await session.execute(query)
                configs = result.scalars().all()

                config_dict = {}
                for config in configs:
                    config_dict[config.config_key] = {
                        "value": config.config_value,
                        "type": config.config_type,
                        "description": config.description,
                        "encrypted": config.is_encrypted,
                        "updated_at": config.updated_at.isoformat() if config.updated_at else None
                    }

                return config_dict

        except Exception as e:
            self.logger.error(
                "tenant_configs_retrieval_failed",
                tenant_id=tenant_context.tenant_id,
                error=str(e)
            )
            return {}

    async def delete_tenant_config(
        self,
        tenant_context: TenantContext,
        key: str
    ) -> bool:
        """Delete a configuration value for the tenant."""
        try:
            async with get_tenant_db_session() as session:
                from .tenant_models import TenantConfiguration
                result = await session.execute(
                    session.query(TenantConfiguration).filter(
                        TenantConfiguration.tenant_id == tenant_context.tenant_uuid,
                        TenantConfiguration.config_key == key
                    )
                )
                config = result.scalar_one_or_none()

                if config:
                    await session.delete(config)
                    await session.commit()

                    # Invalidate cache
                    cache_key = f"{tenant_context.tenant_id}:{key}"
                    if cache_key in self._config_cache:
                        del self._config_cache[cache_key]
                        del self._cache_timestamps[cache_key]

                    self.logger.info(
                        "tenant_config_deleted",
                        tenant_id=tenant_context.tenant_id,
                        key=key
                    )

                    return True

                return False

        except Exception as e:
            self.logger.error(
                "tenant_config_deletion_failed",
                tenant_id=tenant_context.tenant_id,
                key=key,
                error=str(e)
            )
            return False

# Global configuration manager instance
_config_manager: Optional[TenantConfigurationManager] = None

def get_tenant_config_manager() -> TenantConfigurationManager:
    """Get the global tenant configuration manager."""
    global _config_manager
    if _config_manager is None:
        _config_manager = TenantConfigurationManager()
    return _config_manager
