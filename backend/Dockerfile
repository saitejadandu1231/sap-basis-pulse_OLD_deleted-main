# Production-optimized Dockerfile for Railway deployment
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app

# Create non-root user for security
RUN adduser --disabled-password --gecos '' --shell /bin/bash --uid 1001 appuser

# Railway automatically assigns PORT, but we'll default to 8080
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

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
    --no-restore \
    --no-build \
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
    CMD curl -f http://localhost:8080/health || exit 1

# Start application
ENTRYPOINT ["dotnet", "SapBasisPulse.Api.dll"]