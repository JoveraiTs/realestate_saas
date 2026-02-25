#!/bin/bash

# ============================================
# 🏠 Real Estate SaaS - Docker Compose Quickstart
# ============================================

set -e

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; WHITE='\033[1;37m'; NC='\033[0m'

# Default ports
FRONTEND_PORT=3000
BACKEND_PORT=8080
MONGO_PORT=27018
REDIS_PORT=6379
NGINX_PORT=80

# Ultra-Hacker Animated Banner
print_banner() {
    clear
    # Matrix-style falling characters effect
    matrix_animation() {
        local width=$(tput cols)
        local height=$(tput lines)
        local chars=('0' '1' '@' '#' '$' '%' '&' '*' '+' '=')
        local -a drops
        for ((i=0;i<width;i++)); do drops[i]=$((RANDOM % height)); done

        for _ in {1..50}; do
            for ((i=0;i<width;i++)); do
                echo -ne "\033[${drops[i]};${i}H${chars[RANDOM % ${#chars[@]}]}"
                drops[i]=$((drops[i] + 1))
                if [ ${drops[i]} -ge $height ]; then drops[i]=0; fi
            done
            sleep 0.03
        done
        clear
    }

    matrix_animation

    # Hacker-style ASCII Banner
    echo -e "\033[1;31m"  # Bright Red
    cat << "EOF"
██████╗ ███████╗███████╗ ██████╗     ███████╗██╗   ██╗███╗   ██╗
██╔══██╗██╔════╝██╔════╝██╔═══██╗    ██╔════╝██║   ██║████╗  ██║
██████╔╝█████╗  █████╗  ██║   ██║    ███████╗██║   ██║██╔██╗ ██║
██╔═══╝ ██╔══╝  ██╔══╝  ██║   ██║    ╚════██║██║   ██║██║╚██╗██║
██║     ███████╗███████╗╚██████╔╝    ███████║╚██████╔╝██║ ╚████║
╚═╝     ╚══════╝╚══════╝ ╚═════╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝
    ████████╗███████╗███████╗████████╗
    ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝
       ██║   █████╗  ███████╗   ██║   
       ██║   ██╔══╝  ╚════██║   ██║   
       ██║   ███████╗███████║   ██║   
       ╚═╝   ╚══════╝╚══════╝   ╚═╝   
EOF
    echo -e "\033[1;37m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
    echo -e "\033[1;32m         Red Eyz Scripts - Multi-Tenant Real Estate SaaS\033[0m"
    echo -e "\033[1;37m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
}

# Robust .env loader
load_env() {
    if [ -f .env ]; then
        echo -e "${BLUE}🔹 Loading .env file...${NC}"
        while IFS='=' read -r key value; do
            [[ -z "$key" || "$key" =~ ^# ]] && continue
            key=$(echo $key | xargs)
            value=$(echo $value | xargs)
            export "$key=$value"
        done < .env
    fi

    FRONTEND_PORT=${FRONTEND_PORT:-3000}
    BACKEND_PORT=${BACKEND_PORT:-8080}
    MONGO_PORT=${MONGO_PORT:-27018}
    REDIS_PORT=${REDIS_PORT:-6379}
    NGINX_PORT=${NGINX_PORT:-80}
}

# Check Docker & Docker Compose
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker not installed!${NC}"
        exit 1
    fi

    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        echo -e "${RED}❌ Docker Compose not installed!${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Docker & Compose detected${NC}"
}

# Create docker-compose.yml
create_compose_file() {
    echo -e "${BLUE}📝 Creating docker-compose.yml...${NC}"
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  mongodb:
    image: JoveraiTs/mongodb:6
    container_name: real-estate-mongodb
    restart: unless-stopped
    ports:
      - "${MONGO_PORT}:27017"
    volumes:
      - mongo-data:/data/db

  redis:
    image: JoveraiTs/redis:latest
    container_name: real-estate-redis
    restart: unless-stopped
    ports:
      - "${REDIS_PORT}:6379"
    volumes:
      - redis-data:/data

  backend:
    image: JoveraiTs/real-estate-backend:latest
    container_name: real-estate-backend
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "${BACKEND_PORT}:8080"
    depends_on:
      - mongodb
      - redis

  frontend:
    image: JoveraiTs/real-estate-frontend:latest
    container_name: real-estate-frontend
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT}:80"
    depends_on:
      - backend

  email-worker:
    image: JoveraiTs/real-estate-email-worker:latest
    container_name: real-estate-email-worker
    restart: unless-stopped
    env_file:
      - .env
    command: npm run worker
    depends_on:
      - backend
      - mongodb
      - redis

  nginx:
    image: JoveraiTs/nginx:latest
    container_name: real-estate-nginx
    restart: unless-stopped
    ports:
      - "${NGINX_PORT}:80"
    depends_on:
      - frontend

volumes:
  mongo-data:
  redis-data:
EOF
    echo -e "${GREEN}✅ docker-compose.yml created${NC}"
}

# Start stack
start_stack() {
    echo -e "${BLUE}🚀 Pulling images and starting stack...${NC}"
    $COMPOSE_CMD pull
    $COMPOSE_CMD up -d
    echo -e "${GREEN}✅ All containers are up!${NC}"
}

# Show access URLs
show_urls() {
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Deployment Complete!${NC}"
    echo -e "${CYAN}Frontend: http://localhost:${FRONTEND_PORT}${NC}"
    echo -e "${CYAN}Backend: http://localhost:${BACKEND_PORT}${NC}"
    echo -e "${CYAN}MongoDB: mongodb://localhost:${MONGO_PORT}${NC}"
    echo -e "${CYAN}Redis: localhost:${REDIS_PORT}${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🧹 Stopping all containers...${NC}"
    $COMPOSE_CMD down
    echo -e "${GREEN}✅ Cleanup done${NC}"
}
trap cleanup SIGINT SIGTERM

# Main
main() {
    print_banner
    load_env
    check_prerequisites
    create_compose_file
    start_stack
    show_urls
}

main
