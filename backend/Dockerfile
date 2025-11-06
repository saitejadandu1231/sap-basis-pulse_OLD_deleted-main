# Production-optimized Dockerfile for Railway deployment
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app

# Create non-root user for security
RUN adduser --disabled-password --gecos '' --shell /bin/bash --uid 1001 appuser

# Expose a default port (useful for local runs). Vercel sets PORT at runtime.
EXPOSE 8080
# Listen on the port provided by the environment (Vercel sets $PORT at runtime)
ENV ASPNETCORE_URLS=http://+:$PORT

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies (better Docker layer caching)
COPY ["SapBasisPulse.Api.csproj", "."]
RUN dotnet restore "SapBasisPulse.Api.csproj" --verbosity minimal

# Copy source code
COPY . .
WORKDIR "/src"

# Build application
RUN dotnet build "SapBasisPulse.Api.csproj" -c Release -o /app/build

FROM build AS publish
# Publish application with optimizations
RUN dotnet publish "SapBasisPulse.Api.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false \
    /p:PublishTrimmed=false \
    /p:PublishSingleFile=false

FROM base AS final
WORKDIR /app

# Copy published application
COPY --from=publish /app/publish .

# Set ownership and permissions
RUN chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD sh -c 'curl -f http://localhost:${PORT:-8080}/health || exit 1'

# Start application
ENTRYPOINT ["dotnet", "SapBasisPulse.Api.dll"]