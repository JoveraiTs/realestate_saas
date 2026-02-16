#!/bin/bash

# ============================================
# 🏠 Real Estate SaaS - Quick Deployment Script
# ============================================
# Author: Abdullah
# Version: 2.0.0
# Description: Deploy Real Estate SaaS in seconds
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# ASCII Art Banner
print_banner() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
██████╗ ███████╗ █████╗ ██╗         ███████╗███████╗ █████╗ ███████╗
██╔══██╗██╔════╝██╔══██╗██║         ██╔════╝██╔════╝██╔══██╗██╔════╝
██████╔╝█████╗  ███████║██║         █████╗  ███████╗███████║███████╗
██╔══██╗██╔══╝  ██╔══██║██║         ██╔══╝  ╚════██║██╔══██║╚════██║
██║  ██║███████╗██║  ██║███████╗    ███████╗███████║██║  ██║███████║
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝    ╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝
EOF
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}            Multi-tenant Property Management Platform${NC}"
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Loading animation
spinner() {
    local pid=$!
    local spin='⣾⣽⣻⢿⡿⣟⣯⣷'
    local charwidth=3
    while kill -0 $pid 2>/dev/null; do
        local i=$(( (i+charwidth) % ${#spin} ))
        printf "\r${YELLOW}[%s]${NC} %s" "${spin:$i:charwidth}" "$1"
        sleep .1
    done
    printf "\r${GREEN}[✅]${NC} %s\n" "$1"
}

# Check prerequisites
check_prerequisites() {
    echo -e "\n${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed!${NC}"
        echo -e "${YELLOW}📥 Please install Docker first:${NC}"
        echo "   https://docs.docker.com/get-docker/"
        exit 1
    else
        DOCKER_VERSION=$(docker --version | cut -d ' ' -f3 | cut -d ',' -f1)
        echo -e "${GREEN}✅ Docker version ${DOCKER_VERSION} is installed${NC}"
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed!${NC}"
        echo -e "${YELLOW}📥 Please install Docker Compose first:${NC}"
        echo "   https://docs.docker.com/compose/install/"
        exit 1
    else
        if docker compose version &> /dev/null; then
            COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "latest")
            echo -e "${GREEN}✅ Docker Compose version ${COMPOSE_VERSION} is installed${NC}"
        else
            COMPOSE_VERSION=$(docker-compose --version | cut -d ' ' -f4 | cut -d ',' -f1)
            echo -e "${GREEN}✅ Docker Compose version ${COMPOSE_VERSION} is installed${NC}"
        fi
    fi

    # Check curl/wget
    if command -v curl &> /dev/null; then
        echo -e "${GREEN}✅ curl is installed${NC}"
    elif command -v wget &> /dev/null; then
        echo -e "${GREEN}✅ wget is installed${NC}"
    else
        echo -e "${RED}❌ Neither curl nor wget is installed!${NC}"
        exit 1
    fi

    # Check available ports
    check_port 3000 "Frontend"
    check_port 8080 "Backend"
    check_port 27018 "MongoDB"
    check_port 6379 "Redis"
}

# Check if port is available
check_port() {
    if lsof -i:$1 &>/dev/null; then
        echo -e "${YELLOW}⚠️  Port $1 ($2) is already in use${NC}"
        echo -e "   ${CYAN}Will use alternative port configuration${NC}"
        PORT_CONFLICT=true
    else
        echo -e "${GREEN}✅ Port $1 ($2) is available${NC}"
    fi
}

# Create docker-compose.yml
create_compose_file() {
    echo -e "\n${BLUE}📝 Creating docker-compose.yml...${NC}"
    
    cat > docker-compose.yml << 'EOF'
version: '3.8'

networks:
  real-estate-network:
    driver: bridge

volumes:
  mongo-data:
    driver: local
  redis-data:
    driver: local

services:
  mongodb:
    image: abdullah4jovera/mongodb:6
    container_name: real-estate-mongodb
    restart: unless-stopped
    ports:
      - "${MONGO_PORT:-27018}:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - real-estate-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    image: abdullah4jovera/redis:latest
    container_name: real-estate-redis
    restart: unless-stopped
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis-data:/data
    networks:
      - real-estate-network
    command: redis-server --appendonly yes

  backend:
    image: abdullah4jovera/real-estate-backend:latest
    container_name: real-estate-backend
    restart: unless-stopped
    ports:
      - "${BACKEND_PORT:-8080}:8080"
    environment:
      - MONGO_MAIN_URI=mongodb://mongodb:27017/main_db
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - NODE_ENV=production
      - PORT=8080
      - JWT_SECRET=${JWT_SECRET}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
    env_file:
      - .env
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - real-estate-network

  email-worker:
    image: abdullah4jovera/real-estate-email-worker:latest
    container_name: real-estate-email-worker
    restart: unless-stopped
    command: npm run worker
    environment:
      - MONGO_MAIN_URI=mongodb://mongodb:27017/main_db
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
    env_file:
      - .env
    depends_on:
      - backend
      - mongodb
      - redis
    networks:
      - real-estate-network

  frontend:
    image: abdullah4jovera/real-estate-frontend:latest
    container_name: real-estate-frontend
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT:-3000}:80"
    depends_on:
      - backend
    networks:
      - real-estate-network
EOF

    echo -e "${GREEN}✅ docker-compose.yml created successfully${NC}"
}

# Create .env file
create_env_file() {
    echo -e "\n${BLUE}🔐 Creating .env file with secure credentials...${NC}"
    
    # Generate secure JWT secret
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || date +%s%N | sha256sum | base64 | head -c 64)
    
    cat > .env << EOF
# ============================================
# 🔐 SECURITY CONFIGURATION (REQUIRED)
# ============================================
JWT_SECRET=${JWT_SECRET}

# ============================================
# 📧 EMAIL CONFIGURATION (OPTIONAL)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# ============================================
# 🚀 PORT CONFIGURATION
# ============================================
MONGO_PORT=27018
REDIS_PORT=6379
BACKEND_PORT=8080
FRONTEND_PORT=3000
EOF

    echo -e "${GREEN}✅ .env file created successfully${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env file to add your email credentials if needed${NC}"
}

# Pull Docker images
pull_images() {
    echo -e "\n${BLUE}📥 Pulling Docker images from Docker Hub...${NC}"
    
    images=(
        "abdullah4jovera/mongodb:6"
        "abdullah4jovera/redis:latest"
        "abdullah4jovera/real-estate-backend:latest"
        "abdullah4jovera/real-estate-frontend:latest"
        "abdullah4jovera/real-estate-email-worker:latest"
    )
    
    total=${#images[@]}
    current=0
    
    for image in "${images[@]}"; do
        current=$((current + 1))
        echo -e "\n${CYAN}[$current/$total] Pulling ${image}...${NC}"
        docker pull $image &
        spinner "Downloading $image"
    done
    
    echo -e "${GREEN}✅ All images pulled successfully${NC}"
}

# Start containers
start_containers() {
    echo -e "\n${BLUE}🚀 Starting containers...${NC}"
    
    # Check for port conflicts
    if [ "$PORT_CONFLICT" = true ]; then
        echo -e "${YELLOW}⚠️  Port conflicts detected. Using alternative ports...${NC}"
        sed -i.bak 's/FRONTEND_PORT=3000/FRONTEND_PORT=3001/' .env
        sed -i.bak 's/BACKEND_PORT=8080/BACKEND_PORT=8081/' .env
        sed -i.bak 's/MONGO_PORT=27018/MONGO_PORT=27019/' .env
        rm -f .env.bak
        source .env
    fi
    
    # Start services
    docker compose up -d 2>&1 | while read line; do
        echo -e "  ${CYAN}▶${NC} $line"
    done
    
    # Wait for services to be ready
    echo -e "\n${YELLOW}⏳ Waiting for services to be ready...${NC}"
    sleep 10
    
    # Check container status
    echo -e "\n${BLUE}📊 Container Status:${NC}"
    docker compose ps
}

# Display success message and URLs
show_success() {
    FRONTEND_PORT=${FRONTEND_PORT:-3000}
    BACKEND_PORT=${BACKEND_PORT:-8080}
    MONGO_PORT=${MONGO_PORT:-27018}
    
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅✅✅ DEPLOYMENT SUCCESSFUL! ✅✅✅${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${WHITE}📱 Your Real Estate SaaS is now running!${NC}"
    echo ""
    echo -e "  ${CYAN}🌐 Frontend:${NC}     ${GREEN}http://localhost:${FRONTEND_PORT}${NC}"
    echo -e "  ${CYAN}🔧 Backend API:${NC}  ${GREEN}http://localhost:${BACKEND_PORT}${NC}"
    echo -e "  ${CYAN}🗄️ MongoDB:${NC}      ${GREEN}mongodb://localhost:${MONGO_PORT}${NC}"
    echo -e "  ${CYAN}⚡ Redis:${NC}         ${GREEN}localhost:6379${NC}"
    echo ""
    echo -e "${YELLOW}📝 Default credentials:${NC}"
    echo -e "  Email: ${WHITE}admin@example.com${NC}"
    echo -e "  Password: ${WHITE}admin123${NC}"
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}📊 Useful Commands:${NC}"
    echo -e "  ${GREEN}▶${NC} View logs:        ${YELLOW}docker compose logs -f${NC}"
    echo -e "  ${GREEN}▶${NC} Stop services:    ${YELLOW}docker compose down${NC}"
    echo -e "  ${GREEN}▶${NC} Restart:          ${YELLOW}docker compose restart${NC}"
    echo -e "  ${GREEN}▶${NC} Check status:     ${YELLOW}docker compose ps${NC}"
    echo -e "  ${GREEN}▶${NC} Access backend:   ${YELLOW}docker exec -it real-estate-backend sh${NC}"
    echo -e "  ${GREEN}▶${NC} Access MongoDB:   ${YELLOW}docker exec -it real-estate-mongodb mongosh${NC}"
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    if [ -f docker-compose.yml ]; then
        docker compose down 2>/dev/null
    fi
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

# Handle script interruption
trap cleanup SIGINT SIGTERM

# Main function
main() {
    print_banner
    
    echo -e "${WHITE}Welcome to Real Estate SaaS Quick Installer!${NC}"
    echo -e "${CYAN}This script will deploy the complete platform in seconds.${NC}"
    echo ""
    
    # Check if user wants to continue
    read -p "$(echo -e "${YELLOW}Continue with installation? (y/n): ${NC}")" -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Installation cancelled.${NC}"
        exit 0
    fi
    
    # Installation steps
    check_prerequisites
    create_compose_file
    create_env_file
    
    echo -e "\n${PURPLE}⚡ Ready to deploy!${NC}"
    read -p "$(echo -e "${YELLOW}Press Enter to start deployment...${NC}")"
    
    pull_images
    start_containers
    show_success
    
    # Ask if user wants to view logs
    echo ""
    read -p "$(echo -e "${YELLOW}View logs now? (y/n): ${NC}")" -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${CYAN}Showing logs (Ctrl+C to exit)...${NC}"
        docker compose logs -f
    fi
    
    echo -e "\n${GREEN}Thank you for using Real Estate SaaS!${NC}"
    echo -e "${WHITE}Made with ❤️ by Abdullah${NC}"
}

# Run main function
main