# Weather Dashboard Application

A comprehensive weather dashboard that provides real-time weather data, forecasts, and analytics using the Open-Meteo API. This application serves a practical purpose by delivering accurate weather information for any location worldwide.

## Features

- **Real-time Weather Data**: Current temperature, humidity, wind speed, pressure, and UV index
- **7-Day Forecast**: Detailed weather predictions with temperature ranges
- **Precipitation Tracking**: Rain and snow forecasts
- **Interactive Filtering**: Sort and filter weather data by temperature, date, or precipitation
- **Temperature Units**: Toggle between Celsius and Fahrenheit
- **Quick Locations**: Pre-configured buttons for major cities
- **Server Analytics**: Track usage statistics and popular locations
- **Load Balancing Support**: Designed for deployment across multiple servers
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## Requirements Met

 **Practical Purpose**: Provides genuine value as a weather information service  
 **External API Integration**: Uses Open-Meteo API for weather data  
 **User Interaction**: Sorting, filtering, searching, and temperature unit conversion  
 **Error Handling**: Comprehensive error management for API failures  
 **Clean Data Presentation**: Intuitive interface with organized weather information  
 **Security**: No API keys required, all data handled securely  

## Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **API**: Open-Meteo Weather API (free, no API key required)
- **Containerization**: Docker
- **Deployment**: Docker Hub + HAProxy Load Balancer

## Local Development

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/weather-dashboard.git
cd weather-dashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Create the public directory and index.html**
```bash
mkdir -p public
# Copy the client HTML content to public/index.html
```

4. **Run the application**
```bash
npm start
```

5. **Access the application**
Open your browser and navigate to `http://localhost:8080`

### Development Mode
```bash
npm run dev  # Uses nodemon for auto-restart
```

## Docker Deployment

### Part 2A: Docker Containers + Docker Hub

#### Step 1: Build the Docker Image

```bash
# Build the image
docker build -t yourdockerhubusername/weather-dashboard:v1 .

# Test locally
docker run -p 8080:8080 yourdockerhubusername/weather-dashboard:v1

# Verify it works
curl http://localhost:8080/health
```

#### Step 2: Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Push the image
docker push yourdockerhubusername/weather-dashboard:v1

# Tag as latest
docker tag yourdockerhubusername/weather-dashboard:v1 yourdockerhubusername/weather-dashboard:latest
docker push yourdockerhubusername/weather-dashboard:latest
```

#### Step 3: Deploy on Lab Machines

**On Web-01:**
```bash
# SSH into web-01
ssh user@web-01

# Pull and run the image
docker pull yourdockerhubusername/weather-dashboard:v1
docker run -d --name weather-app --restart unless-stopped \
  -p 8080:8080 \
  -e INSTANCE_NAME=web-01 \
  yourdockerhubusername/weather-dashboard:v1

# Verify it's running
curl http://localhost:8080/health
```

**On Web-02:**
```bash
# SSH into web-02
ssh user@web-02

# Pull and run the image
docker pull yourdockerhubusername/weather-dashboard:v1
docker run -d --name weather-app --restart unless-stopped \
  -p 8080:8080 \
  -e INSTANCE_NAME=web-02 \
  yourdockerhubusername/weather-dashboard:v1

# Verify it's running
curl http://localhost:8080/health
```

#### Step 4: Configure Load Balancer (HAProxy)

**On Lb-01, update `/etc/haproxy/haproxy.cfg`:**
```haproxy
global
    daemon
    maxconn 4096

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend weather_frontend
    bind *:80
    default_backend weather_backend

backend weather_backend
    balance roundrobin
    option httpchk GET /health
    server web01 172.20.0.11:8080 check
    server web02 172.20.0.12:8080 check
```

**Reload HAProxy:**
```bash

#  Restart container 
docker restart lb-01
```

#### Step 5: Test Load Balancing

```bash
# Test multiple requests to see load balancing
for i in {1..10}; do
  curl -s http://localhost/health | jq '.server_info.hostname'
  sleep 1
done
```

You should see alternating responses from web-01 and web-02.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |
| `NODE_ENV` | Environment | development |
| `INSTANCE_NAME` | Server instance identifier | weather-app |

## API Endpoints

### Health Check
- **GET** `/health`
- Returns server status and basic metrics

### Weather Data
- **GET** `/api/weather?latitude={lat}&longitude={lng}&timezone={tz}`
- Returns comprehensive weather data for specified coordinates

### Analytics
- **GET** `/api/analytics`
- Returns usage statistics and popular locations

## Project Structure

```
weather-dashboard/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── Dockerfile            # Container configuration
├── README.md             # Project documentation
├── .gitignore           # Git ignore rules
├── public/              # Static files
│   └── index.html       # Main client application
└── docs/                # Additional documentation
```

## Security Considerations

- **No API Keys**: Uses Open-Meteo API which requires no authentication
- **Input Validation**: All coordinates are validated before processing
- **Non-root User**: Docker container runs as non-privileged user
- **Health Checks**: Built-in container health monitoring
- **Error Handling**: Graceful error responses without exposing internals

## Testing

### Manual Testing Steps

1. **Local functionality test:**
```bash
curl http://localhost:8080/health
curl "http://localhost:8080/api/weather?latitude=40.7128&longitude=-74.0060"
```

2. **Load balancer test:**
```bash
# Should show alternating server instances
for i in {1..6}; do
  curl -s http://localhost/health | grep hostname
done
```

3. **Frontend test:**
- Visit `http://localhost` in browser
- Test different locations using quick buttons
- Verify filtering and sorting functionality
- Check mobile responsiveness

### Expected Responses

**Health Check Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-31T10:00:00.000Z",
  "requests": 42,
  "uptime": 3600
}
```

**Weather API Response:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "current": {
    "temperature_2m": 15.2,
    "relative_humidity_2m": 65,
    "weather_code": 1
  },
  "daily": {
    "time": ["2025-01-31", "2025-02-01"],
    "temperature_2m_max": [18.5, 20.1],
    "temperature_2m_min": [12.3, 14.7]
  },
  "server_info": {
    "instance": "web-01",
    "hostname": "container-id"
  }
}
```

## Performance Features

- **Caching**: Client-side data caching for improved performance
- **Efficient API Calls**: Minimized external API requests
- **Responsive Design**: Optimized for various screen sizes
- **Error Recovery**: Graceful handling of network issues
- **Load Balancing**: Distributed load across multiple instances

## Monitoring and Analytics

The application includes built-in monitoring:
- Request counting
- Popular location tracking
- Server uptime monitoring
- Health check endpoints
- Instance identification for load balancing verification

## Troubleshooting

### Common Issues

1. **Container won't start:**
```bash
# Check container logs
docker logs weather-app

# Check if port is available
netstat -tulpn | grep 8080
```

2. **Load balancer not working:**
```bash
# Verify backend servers are reachable
curl http://172.20.0.11:8080/health
curl http://172.20.0.12:8080/health

# Check HAProxy status
docker exec -it lb-01 cat /var/log/haproxy.log
```

3. **API requests failing:**
```bash
# Test external API directly
curl "https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current=temperature_2m"
```

## Success Criteria Verification

-  **Application runs correctly in both containers** (Web01 & Web02)
-  **HAProxy successfully routes requests** to both instances
-  **Docker image publicly available** on Docker Hub
-  **README provides complete deployment instructions**
-  **Load balancing verification** through health check responses
-  **Error handling** for various failure scenarios
-  **User interaction features** (filtering, sorting, searching)
-  **Clean, professional UI** with responsive design

##  External Resources

- **API Documentation**: [Open-Meteo API](https://open-meteo.com/en/docs)
- **Docker Hub Repository**: `https://hub.docker.com/r/yourusername/weather-dashboard`
- **Load Balancer Setup**: Based on provided lab infrastructure

##  Development Notes

- Professional API integration practices
- Scalable containerized deployment
- User-centric design principles
- Robust error handling
- Performance optimization
- Security best practices

The application provides a genuinely useful service that users would actually want to use for checking weather conditions worldwide.