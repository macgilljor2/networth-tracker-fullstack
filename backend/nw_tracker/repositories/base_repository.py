from typing import Generic, List, Optional, Type, TypeVar
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import UUID4

from nw_tracker.models.models import Base
from nw_tracker.logger import get_logger

logger = get_logger()

T = TypeVar("ModelType", bound=Base)


class GenericRepository(Generic[T]):
    """Generic repository implementation for basic CRUD operations"""

    def __init__(self, session: AsyncSession, model_class: Type[T]):
        self.session = session
        self.model_class = model_class

    async def get_by_id(self, id: UUID4) -> Optional[T]:
        """Get an entity by ID"""
        result = await self.session.execute(
            select(self.model_class).filter(self.model_class.id == id)
        )
        return result.scalars().first()

    async def get_all(self) -> List[T]:
        """Get all entities"""
        result = await self.session.execute(select(self.model_class))
        return list(result.scalars().all())

    async def create(self, entity: T) -> T:
        """Create a new entity"""
        self.session.add(entity)
        await self.session.commit()
        await self.session.refresh(entity)

        logger.info(f"Entity {entity} created successfully.")

        return entity

    async def update(self, entity: T) -> T:
        """
        Update an entity

        The repository expects the full entity object to be passed.
        It will merge the passed entity with the existing one in the database.
        """
        # Merge the entity into this session
        self.session.add(entity)
        await self.session.commit()
        await self.session.refresh(entity)
        return entity

    async def delete(self, entity: T) -> None:
        """Delete an entity"""
        await self.session.delete(entity)
        await self.session.commit()

    async def delete_by_id(self, id: UUID4) -> bool:
        """Delete an entity by ID"""
        entity = await self.get_by_id(id)
        if entity:
            await self.session.delete(entity)
            await self.session.commit()
            return True
        return False

    async def exists_by_id(self, id: UUID4) -> bool:
        """Check if an entity exists by ID"""
        result = await self.session.execute(
            select(self.model_class).filter(self.model_class.id == id)
        )
        entity = result.scalars().first()

        return bool(entity)
