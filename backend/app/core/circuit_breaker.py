import asyncio
import time
from typing import Any, Callable, Coroutine
from loguru import logger
from datetime import datetime

class CircuitBreakerOpen(Exception):
    pass

class CircuitBreaker:
    def __init__(
        self, 
        name: str,
        failure_threshold: int = 5, 
        recovery_timeout: int = 30
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        
        self._state: str = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self._failures: int = 0
        self._last_failure_time: float = 0.0
        self._lock = asyncio.Lock()
        self._trial_lock = asyncio.Lock() # To ensure only one trial in HALF_OPEN

    @property
    def state(self) -> str:
        return self._state

    @property
    def failures(self) -> int:
        return self._failures

    async def call(self, func: Callable[..., Coroutine], *args, **kwargs) -> Any:
        # 1. Check state and handle transitions to HALF_OPEN
        async with self._lock:
            if self._state == "OPEN":
                if time.time() - self._last_failure_time >= self.recovery_timeout:
                    self._set_state("HALF_OPEN")
                else:
                    raise CircuitBreakerOpen(f"Circuit breaker '{self.name}' is OPEN")

        # 2. Execute call
        if self._state == "HALF_OPEN":
            # Exactly ONE trial request using the trial_lock
            acquired = self._trial_lock.acquire()
            if isinstance(acquired, Coroutine):
                acquired = await acquired
            
            if not acquired:
                raise CircuitBreakerOpen(f"Circuit breaker '{self.name}' is HALF_OPEN (trial in progress)")
            
            try:
                # Create the coroutine only when we're ready to execute
                coro = func(*args, **kwargs)
                result = await self._execute(coro)
                return result
            finally:
                self._trial_lock.release()
        else:
            # Create the coroutine only when we're ready to execute
            coro = func(*args, **kwargs)
            return await self._execute(coro)

    async def _execute(self, coro: Coroutine) -> Any:
        try:
            result = await coro
            await self._on_success()
            return result
        except Exception as e:
            await self._on_failure(e)
            raise e

    async def _on_success(self):
        async with self._lock:
            if self._state != "CLOSED":
                self._set_state("CLOSED")
            self._failures = 0

    async def _on_failure(self, error: Exception):
        async with self._lock:
            self._failures += 1
            self._last_failure_time = time.time()
            
            if self._state == "CLOSED":
                if self._failures >= self.failure_threshold:
                    self._set_state("OPEN")
            elif self._state == "HALF_OPEN":
                self._set_state("OPEN")

    def _set_state(self, new_state: str):
        old_state = self._state
        if old_state != new_state:
            self._state = new_state
            # Structured logging with loguru
            logger.bind(
                service_name=self.name,
                circuit_breaker_state=new_state,
                failures=self._failures,
                timestamp=datetime.utcnow().isoformat()
            ).info(f"Circuit Breaker '{self.name}' state transition: {old_state} -> {new_state}")

# Global instances for the app
osrm_breaker = CircuitBreaker(name="OSRM", failure_threshold=5, recovery_timeout=30)
ors_breaker = CircuitBreaker(name="ORS", failure_threshold=5, recovery_timeout=30)
nominatim_breaker = CircuitBreaker(name="NOMINATIM", failure_threshold=5, recovery_timeout=30)
firestore_breaker = CircuitBreaker(name="FIRESTORE", failure_threshold=5, recovery_timeout=30)
