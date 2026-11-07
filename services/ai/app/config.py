"""
Application configuration loaded from environment variables.
Uses pydantic-settings for validation and type safety.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Service
    debug: bool = True
    ai_service_host: str = "127.0.0.1"
    ai_service_port: int = 8000

    # Internal auth — requests from Node API must carry this secret
    ai_service_internal_secret: str = "REPLACE_WITH_RANDOM_32_BYTE_HEX"

    # Node API (for CORS allowlist)
    node_api_url: str = "http://127.0.0.1:4000"

    # Ollama
    ollama_host: str = "http://127.0.0.1:11434"
    ollama_default_model: str = "llama3"

    # ChromaDB
    chroma_data_path: str = "./data-local/chroma"

    # PostgreSQL (read-only config reference — writes go through Node API)
    postgres_host: str = "127.0.0.1"
    postgres_port: int = 5432
    postgres_db: str = "neurodesk"
    postgres_user: str = "neurodesk_user"
    postgres_password: str = "REPLACE_WITH_POSTGRES_PASSWORD"

    # Neo4j
    neo4j_uri: str = "bolt://127.0.0.1:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "REPLACE_WITH_NEO4J_PASSWORD"


settings = Settings()
