"""
Setup script for KoreShield.
"""

from setuptools import setup, find_packages

# Read README for long description
with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="koreshield",
    version="0.1.0",
    author="Emmanuel Isaac",
    author_email="ei@nsisong.com",
    description="Middleware proxy for protecting enterprise LLM integrations from prompt injection attacks",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/koreshield/koreshield",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Security",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.10",
    install_requires=[
        "fastapi>=0.104.0",
        "uvicorn[standard]>=0.24.0",
        "pydantic>=2.5.0",
        "pydantic-settings>=2.1.0",
        "httpx>=0.25.0",
        "python-multipart>=0.0.6",
        "pyyaml>=6.0.1",
        "structlog>=23.2.0",
    ],
)

